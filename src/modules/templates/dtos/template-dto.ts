import { ApiProperty } from '@nestjs/swagger';
import { Chart, ChartValidation } from 'seatsio';
import { Template } from '../templates.entity';
import { TemplateCategoryDto } from './create-template.dto';

export class TemplateDto {
  id: string;
  @ApiProperty({ example: 'Main Stage Arena' })
  name: string;

  @ApiProperty({
    example: 'Standard layout for indoor concerts up to 5,000 seats.',
  })
  notes: string | null;

  @ApiProperty({ example: ['VIP', 'General Admission'] })
  categories: TemplateCategoryDto[];

  @ApiProperty({ example: 'abc123xyz' })
  seatioChartKey: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
  @ApiProperty({
    example:
      'https://cdn-thumbnails.seatsio.net/region/eu/workspaceKey/4d7b1b02-cfa9-46e0-8fb3-21f691374170/charts/adaf5aad-3799-4555-9448-6efa739fc49c/version/published/thumbnail/0',
  })
  publishedVersionThumbnailUrl?: string | null;
  @ApiProperty({ example: ['VALIDATE_NO_OBJECTS'] })
  validations?: ChartValidation | null;

  constructor(template: Template, chart: Chart) {
    this.id = template.id;
    this.name = template.name;
    this.notes = template.notes;
    this.categories = template.categories;
    this.seatioChartKey = template.seatioChartKey;
    this.createdAt = template.createdAt;
    this.updatedAt = template.updatedAt;
    this.publishedVersionThumbnailUrl = chart.publishedVersionThumbnailUrl;
    this.validations = chart.validation;
  }
}
