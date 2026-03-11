import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { BookingsFilterDto } from './bookings-filter.dto';

export class AdminBookingsFilterDto extends BookingsFilterDto {
  @ApiPropertyOptional({
    description:
      'Search by customer name, email, or phone (case-insensitive partial match)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter bookings created on or after this date (ISO 8601)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter bookings created on or before this date (ISO 8601)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
