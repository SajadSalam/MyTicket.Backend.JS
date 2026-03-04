import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { BookingStatus } from '../booking.entity';

export class BookingsFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({ description: 'Filter by event ID' })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
