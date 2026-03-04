import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isSeatsioError } from 'src/common/utils';
import { Repository } from 'typeorm';
import { EventStatus } from '../events/events.entity';
import { EventsService } from '../events/events.service';
import { PaymentsService } from '../payments/payments.service';
import { SeatioService } from '../seatio/seatio.service';
import { Booking, BookingStatus } from './booking.entity';
import { CreateBookingDto } from './dtos/create-booking.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly eventsService: EventsService,
    private readonly seatioService: SeatioService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Create a booking: validate event, compute total from category pricings,
   * save booking, initiate Amwal payment, return redirect URL.
   */
  async create(
    dto: CreateBookingDto,
  ): Promise<{ bookingId: string; redirectUrl: string }> {
    try {
      const event = await this.eventsService.findOne(dto.eventId);
      if (!event) {
        throw new NotFoundException('Event not found');
      }
      if (event.status !== EventStatus.PUBLISHED) {
        throw new BadRequestException(
          'Event is not published. Booking is only allowed for published events.',
        );
      }

      const seats = [...new Set(dto.seats)];
      if (seats.length === 0) {
        throw new BadRequestException('At least one seat is required');
      }

      const seatioEventKey = event.seatioEventKey;
      const objectInfos = await this.seatioService.retrieveObjectInfos(
        seatioEventKey,
        seats,
      );

      const priceByCategoryKey = new Map<string, number>();
      for (const pricing of event.categoryPricings ?? []) {
        const key = String(pricing.categoryKey ?? '');
        const price = parseFloat(pricing.price ?? '0') ?? 0;
        if (!Number.isNaN(price)) {
          priceByCategoryKey.set(key, price);
        }
      }

      let totalAmount = 0;
      for (const label of seats) {
        const info = objectInfos[label];
        if (!info) {
          throw new BadRequestException(
            `Seat "${label}" not found or not available on this event`,
          );
        }
        const categoryKey = String(info.categoryKey ?? '');
        const price = priceByCategoryKey.get(categoryKey);
        if (price == null) {
          throw new BadRequestException(
            `No pricing defined for seat "${label}" (category ${categoryKey})`,
          );
        }
        totalAmount += price;
      }

      const booking = this.bookingRepo.create({
        eventId: event.id,
        userId: dto.userId ?? null,
        seats,
        holdToken: dto.holdToken,
        totalAmount: String(totalAmount.toFixed(2)),
        currency: 'IQD',
        status: BookingStatus.PENDING,
        customerName: dto.customerName ?? null,
        customerEmail: dto.customerEmail ?? null,
        customerPhone: dto.customerPhone ?? null,
      });

      await this.bookingRepo.save(booking);
      const { redirectUrl } =
        await this.paymentsService.initiatePayment(booking);

      return {
        bookingId: booking.id,
        redirectUrl,
      };
    } catch (err: unknown) {
      if (isSeatsioError(err) && err.messages.length) {
        throw new BadRequestException(err.messages);
      }
      this.logger.error('Failed to create Seatsio event', err);
      throw new InternalServerErrorException(
        'Could not create the seating event in Seatsio. Please try again.',
      );
    }
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    eventId?: string;
    status?: BookingStatus;
  }): Promise<{ data: Booking[]; total: number }> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 10, 100);
    const skip = (page - 1) * limit;

    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.event', 'event')
      .leftJoinAndSelect('booking.payment', 'payment')
      .orderBy('booking.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (params.eventId) {
      qb.andWhere('booking.eventId = :eventId', { eventId: params.eventId });
    }
    if (params.status) {
      qb.andWhere('booking.status = :status', { status: params.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Booking | null> {
    return this.bookingRepo.findOne({
      where: { id },
      relations: ['event', 'event.template', 'payment'],
    });
  }

  async getByIdOrFail(id: string): Promise<Booking> {
    const booking = await this.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
}
