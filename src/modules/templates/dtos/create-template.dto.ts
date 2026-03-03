import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TemplateCategoryDto {
  @ApiProperty({
    description:
      'Category key used by Seatsio — number or string (e.g. 1 or "VIP")',
    example: 1,
  })
  @IsNotEmpty()
  key: string | number;

  @ApiProperty({ example: 'VIP' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    description: 'Hex color for seats in this category',
    example: '#FF5733',
  })
  @IsHexColor()
  color: string;

  @ApiPropertyOptional({
    description: 'Whether seats in this category are wheelchair accessible',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  accessible?: boolean;
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'Main Stage Arena' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Standard layout for indoor concerts up to 5,000 seats.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [TemplateCategoryDto],
    description: 'Seat categories for the chart (will be seeded in Seatsio)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateCategoryDto)
  categories: TemplateCategoryDto[];
}
