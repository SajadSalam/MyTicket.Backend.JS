import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { SeatioService } from '../seatio/seatio.service';
import { AmwalService } from './amwal.service';
import { Payment, PaymentStatus } from './payment.entity';

const EXPIRY_MS = 10 * 60 * 1_000; // 10 minutes

@Injectable()
export class PaymentSyncService {
  private readonly logger = new Logger(PaymentSyncService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly amwalService: AmwalService,
    private readonly seatioService: SeatioService,
  ) {}

  /**
   * Runs every minute.
   * 1. Loads all pending payments.
   * 2. For each, checks status with Amwal.
   * 3. Updates booking/payment if the status has changed.
   * 4. Expires payments/bookings that are older than 10 minutes and still pending.
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async syncPendingPayments(): Promise<void> {
    const expiryThreshold = new Date(Date.now() - EXPIRY_MS);

    const pendingPayments = await this.paymentRepo.find({
      where: { status: PaymentStatus.PENDING },
      relations: ['booking', 'booking.event'],
    });

    if (pendingPayments.length === 0) return;

    this.logger.log(`Syncing ${pendingPayments.length} pending payment(s)`);

    for (const payment of pendingPayments) {
      const booking = payment.booking;

      // ── 1. Expire old pending payments ──────────────────────────────────
      if (payment.createdAt <= expiryThreshold) {
        this.logger.warn(
          `Payment ${payment.tranRef} (booking ${booking.id}) expired — created at ${payment.createdAt.toISOString()}`,
        );
        await this.expireBooking(booking, payment);
        continue;
      }

      // ── 2. Query Amwal for current status ────────────────────────────────
      let amwalStatus: PaymentStatus;
      try {
        const result = await this.amwalService.queryStatus(payment.tranRef);
        this.logger.warn(
          `Amwal status for TranRef ${payment.tranRef}: ${result.status}`,
        );
        amwalStatus = result.status;
      } catch (err) {
        this.logger.error(
          `Failed to query Amwal status for TranRef ${payment.tranRef}:`,
          err instanceof Error ? err.message : String(err),
        );
        continue;
      }

      // ── 3. Skip if still pending (no change) ─────────────────────────────
      if (amwalStatus === PaymentStatus.PENDING) {
        continue;
      }

      // ── 4. Apply status change ───────────────────────────────────────────
      this.logger.log(
        `Payment ${payment.tranRef} status changed → ${amwalStatus}`,
      );

      const seats = this.normalizeSeats(booking.seats);
      const seatioEventKey = booking.event?.seatioEventKey;

      if (amwalStatus === PaymentStatus.PAID) {
        await this.confirmBooking(booking, payment, seats, seatioEventKey);
      } else {
        await this.failBooking(booking, payment, seats, seatioEventKey);
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async confirmBooking(
    booking: Booking,
    payment: Payment,
    seats: string[],
    seatioEventKey: string,
  ): Promise<void> {
    try {
      await this.bookSeatsWithFallback(seatioEventKey, seats, booking);
      booking.status = BookingStatus.CONFIRMED;
      booking.seatioOrderId = booking.id;
      payment.status = PaymentStatus.PAID;
      payment.paidAt = new Date();
      this.logger.log(`Booking ${booking.id} confirmed via sync`);
    } catch (err) {
      this.logger.error(
        `Seatsio bookObjects failed for booking ${booking.id}:`,
        err,
      );
      booking.status = BookingStatus.FAILED;
      payment.status = PaymentStatus.FAILED;
    }
    await this.paymentRepo.save(payment);
    await this.bookingRepo.save(booking);
  }

  /**
   * Try to book seats with holdToken first.
   * If Seatsio rejects because the hold has expired (ILLEGAL_STATUS_CHANGE),
   * the seats are already free — retry without the holdToken.
   */
  private async bookSeatsWithFallback(
    seatioEventKey: string,
    seats: string[],
    booking: Booking,
  ): Promise<void> {
    try {
      await this.seatioService.bookObjects(
        seatioEventKey,
        seats,
        booking.holdToken,
        booking.id,
      );
    } catch (err: unknown) {
      if (this.isHoldExpiredError(err)) {
        this.logger.warn(
          `Hold token expired for booking ${booking.id} — retrying without holdToken`,
        );
        await this.seatioService.bookObjects(
          seatioEventKey,
          seats,
          undefined,
          booking.id,
        );
      } else {
        throw err;
      }
    }
  }

  /** Detects Seatsio ILLEGAL_STATUS_CHANGE caused by an expired hold token */
  private isHoldExpiredError(err: unknown): boolean {
    if (typeof err !== 'object' || err === null) return false;
    const e = err as Record<string, unknown>;
    if (!Array.isArray(e['errors'])) return false;
    return (e['errors'] as Array<Record<string, unknown>>).some(
      (error) => error['code'] === 'ILLEGAL_STATUS_CHANGE',
    );
  }

  private async expireBooking(
    booking: Booking,
    payment: Payment,
  ): Promise<void> {
    const seats = this.normalizeSeats(booking.seats);
    const seatioEventKey = booking.event?.seatioEventKey;
    try {
      await this.seatioService.releaseObjects(
        seatioEventKey,
        seats,
        booking.holdToken,
      );
    } catch (err) {
      this.logger.error(
        `Seatsio releaseObjects failed while expiring booking ${booking.id}:`,
        err,
      );
    }
    booking.status = BookingStatus.CANCELLED;
    payment.status = PaymentStatus.CANCELLED;
    await this.paymentRepo.save(payment);
    await this.bookingRepo.save(booking);
    this.logger.log(`Booking ${booking.id} expired and cancelled`);
  }

  private async failBooking(
    booking: Booking,
    payment: Payment,
    seats: string[],
    seatioEventKey: string,
  ): Promise<void> {
    try {
      await this.seatioService.releaseObjects(
        seatioEventKey,
        seats,
        booking.holdToken,
      );
    } catch (err) {
      this.logger.error(
        `Seatsio releaseObjects failed for booking ${booking.id}:`,
        err,
      );
    }
    booking.status = BookingStatus.FAILED;
    payment.status = PaymentStatus.FAILED;
    await this.paymentRepo.save(payment);
    await this.bookingRepo.save(booking);
    this.logger.log(`Booking ${booking.id} marked failed via sync`);
  }

  private normalizeSeats(seats: string[] | string): string[] {
    if (Array.isArray(seats)) return seats;
    return String(seats ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
