import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { SeatioService } from '../seatio/seatio.service';
import { AmwalService } from './amwal.service';
import { AmwalCallbackDto } from './dtos/amwal-callback.dto';
import { Payment, PaymentStatus } from './payment.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly amwalService: AmwalService,
    private readonly seatioService: SeatioService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Create a payment order with Amwal and persist the Payment record.
   * Returns the redirect URL for the customer to complete payment.
   */
  async initiatePayment(booking: Booking): Promise<{ redirectUrl: string }> {
    const callbackUrl = this.config.get<string>('AMWAL_CALLBACK_URL') ?? '';
    const returnUrl = this.config.get<string>('AMWAL_RETURN_URL') ?? '';
    const amount = parseFloat(booking.totalAmount);
    const cartDescription = `Event Booking - ${booking.customerName ?? 'Guest'}`;
    this.logger.warn(
      `Creating Amwal payment for booking ${booking.id}, amount ${amount}, cartDescription ${cartDescription}, callbackUrl ${callbackUrl}, returnUrl ${returnUrl}`,
    );
    const result = await this.amwalService.createOrder(
      booking.id,
      amount,
      cartDescription,
      callbackUrl,
      returnUrl,
    );

    const payment = this.paymentRepo.create({
      bookingId: booking.id,
      tranRef: result.tranRef,
      cartId: result.cartId,
      amount: booking.totalAmount,
      currency: booking.currency,
      status: PaymentStatus.PENDING,
      redirectUrl: result.redirectUrl,
    });

    await this.paymentRepo.save(payment);

    return { redirectUrl: result.redirectUrl };
  }

  /**
   * Handle server-to-server callback from Amwal after payment.
   * Confirms or releases Seatsio seats and updates booking/payment status.
   * Always responds successfully so Amwal does not retry.
   */
  async handleCallback(dto: AmwalCallbackDto): Promise<void> {
    const bookingId = dto.cart_id;
    const tranRef = dto.tran_ref;
    const responseStatus = dto.payment_result?.response_status?.toUpperCase();

    this.logger.warn(
      `Amwal callback: cart_id=${bookingId}, tran_ref=${tranRef}, response_status=${responseStatus}`,
    );

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['event'],
    });

    if (!booking) {
      this.logger.warn(`Callback for unknown booking: ${bookingId}`);
      return;
    }

    const payment = await this.paymentRepo.findOne({
      where: { tranRef },
    });

    if (!payment) {
      this.logger.warn(`Callback for unknown payment: ${tranRef}`);
      return;
    }

    // Idempotency: if already processed, do nothing
    if (booking.status !== BookingStatus.PENDING) {
      this.logger.error(
        `Booking ${bookingId} already in status ${booking.status}, skipping`,
      );
      return;
    }

    const paid = responseStatus === 'A';
    const seatioEventKey = booking.event.seatioEventKey;
    const seatsRaw = booking.seats;
    const seats = Array.isArray(seatsRaw)
      ? seatsRaw
      : String(seatsRaw ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    try {
      if (paid) {
        await this.seatioService.bookObjects(
          seatioEventKey,
          seats,
          booking.holdToken,
          booking.id,
        );
        booking.status = BookingStatus.CONFIRMED;
        booking.seatioOrderId = booking.id;
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();
        this.logger.warn(
          `Booking ${bookingId} confirmed, seats booked in Seatsio`,
        );
      } else {
        await this.seatioService.releaseObjects(
          seatioEventKey,
          seats,
          booking.holdToken,
        );
        booking.status = BookingStatus.FAILED;
        payment.status = PaymentStatus.FAILED;
        this.logger.error(
          `Booking ${bookingId} failed, seats released in Seatsio`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Seatsio operation failed for booking ${bookingId}:`,
        err,
      );
      booking.status = BookingStatus.FAILED;
      payment.status = PaymentStatus.FAILED;
    }

    payment.callbackPayload = dto as unknown as Record<string, unknown>;
    await this.paymentRepo.save(payment);
    await this.bookingRepo.save(booking);
  }

  async findByTranRef(tranRef: string): Promise<Payment | null> {
    // query status from amwal
    const status = await this.amwalService.queryStatus(tranRef);
    console.log('statusAmwalQuery', status);
    return this.paymentRepo.findOne({
      where: { tranRef },
      relations: ['booking', 'booking.event'],
    });
  }

  async getStatusByTranRef(tranRef: string): Promise<{
    tranRef: string;
    status: PaymentStatus;
    bookingId: string;
    amount: string;
    paidAt: Date | null;
    statusAmwal: PaymentStatus;
  }> {
    const payment = await this.findByTranRef(tranRef);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    // query status from amwal
    const status = await this.amwalService.queryStatus(tranRef);
    // console.log('statusAmwalQuery', status);
    return {
      tranRef: payment.tranRef,
      status: payment.status,
      bookingId: payment.bookingId,
      amount: payment.amount,
      paidAt: payment.paidAt,
      statusAmwal: status.status,
    };
  }
}
