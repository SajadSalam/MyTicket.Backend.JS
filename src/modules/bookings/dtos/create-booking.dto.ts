import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the event to book',
  })
  @IsUUID()
  eventId: string;

  @ApiProperty({
    example: ['A-1', 'A-2'],
    description: 'Seatsio object labels (seats or tables)',
    type: [String],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  seats: string[];

  @ApiProperty({
    description:
      'Seatsio hold token from the widget (holds the selected seats)',
  })
  @IsString()
  @IsNotEmpty()
  holdToken: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ example: '+9647701234567' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Logged-in user ID (optional, for guest checkout leave empty)',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
