import { ApiPropertyOptional } from '@nestjs/swagger';
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

class UpdateTemplateCategoryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNotEmpty()
  key?: string | number;

  @ApiPropertyOptional({ example: 'VIP' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @ApiPropertyOptional({ example: '#FF5733' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  accessible?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ example: 'Main Stage Arena' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 'Standard layout for indoor concerts up to 5,000 seats.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [UpdateTemplateCategoryDto],
    description: 'Replaces the full category list when provided',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTemplateCategoryDto)
  categories?: UpdateTemplateCategoryDto[];
}
