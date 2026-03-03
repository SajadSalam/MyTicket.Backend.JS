import { Module } from '@nestjs/common';
import { SeatioService } from './seatio.service';

@Module({
  providers: [SeatioService],
  exports: [SeatioService],
})
export class SeatioModule {}
