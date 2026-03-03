import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';

export class EventsFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({ description: 'Search by event name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by tag (comma-separated for multiple)',
    example: 'music,festival',
  })
  @IsOptional()
  @IsString()
  tags?: string;
}
