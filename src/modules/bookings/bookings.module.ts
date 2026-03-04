import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { PaymentsModule } from '../payments/payments.module';
import { SeatioModule } from '../seatio/seatio.module';
import { Booking } from './booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    EventsModule,
    PaymentsModule,
    SeatioModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
