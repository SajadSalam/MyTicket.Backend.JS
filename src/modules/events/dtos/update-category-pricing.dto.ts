import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCategoryPricingDto {
  @ApiPropertyOptional({ example: 'VIP Premium' })
  @IsOptional()
  @IsString()
  categoryLabel?: string;

  @ApiPropertyOptional({ example: 90000 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 'IQD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 'Updated description for this category' })
  @IsOptional()
  @IsString()
  description?: string;
}
