import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { SeatioModule } from '../seatio/seatio.module';
import { AmwalService } from './amwal.service';
import { Payment } from './payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: 15000, maxRedirects: 0 }),
    TypeOrmModule.forFeature([Payment, Booking]),
    SeatioModule,
  ],
  providers: [AmwalService, PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
