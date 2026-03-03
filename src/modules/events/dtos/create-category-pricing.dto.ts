import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryPricingDto {
  @ApiProperty({
    example: '1',
    description:
      'Seatsio category key — must match a category key in the event template',
  })
  @IsString()
  @IsNotEmpty()
  categoryKey: string;

  @ApiProperty({ example: 'VIP' })
  @IsString()
  @IsNotEmpty()
  categoryLabel: string;

  @ApiProperty({
    example: 75000,
    description: 'Price amount (e.g. 75000 IQD)',
  })
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: 'IQD', default: 'IQD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({
    example: 'Front-row VIP seats with exclusive lounge access',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
