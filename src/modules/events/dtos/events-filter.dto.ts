import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { EventStatus } from '../events.entity';

export class EventsFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({ description: 'Search by event name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: EventStatus,
    example: EventStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Filter by tag (comma-separated for multiple)',
    example: 'music,festival',
  })
  @IsOptional()
  @IsString()
  tags?: string;
}
