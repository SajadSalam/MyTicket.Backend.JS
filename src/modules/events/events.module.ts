import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatioModule } from '../seatio/seatio.module';
import { TemplatesModule } from '../templates/templates.module';
import { EventCategoryPricing } from './event-category-pricing.entity';
import { EventsController } from './events.controller';
import { Event } from './events.entity';
import { EventsService } from './events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventCategoryPricing]),
    TemplatesModule,
    SeatioModule,
  ],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
