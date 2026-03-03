import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the template (seating chart) to use for this event',
  })
  @IsUUID()
  templateId: string;

  @ApiProperty({ example: 'Summer Music Festival 2025' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A short description of the event' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Full HTML or markdown content...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/main.jpg' })
  @IsOptional()
  @IsString()
  @IsUrl()
  mainImage?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ example: '2025-07-01T18:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-07-03T23:59:59.000Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: '2025-06-01T00:00:00.000Z' })
  @IsDateString()
  bookingStartDate: string;

  @ApiProperty({ example: '2025-06-30T23:59:59.000Z' })
  @IsDateString()
  bookingEndDate: string;

  @ApiPropertyOptional({
    example: ['music', 'festival', 'summer'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Central Park, New York' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 40.785091 })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value == null ? undefined : Number(value),
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: -73.968285 })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value == null ? undefined : Number(value),
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}
