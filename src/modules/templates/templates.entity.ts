import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class TemplateCategory {
  @ApiProperty({
    example: 1,
    description: 'Category key used by Seatsio (number or string)',
  })
  key: string | number;

  @ApiProperty({ example: 'VIP' })
  label: string;

  @ApiProperty({
    example: '#FF5733',
    description: 'Hex color for seats in this category',
  })
  color: string;

  @ApiProperty({
    example: false,
    description: 'Whether seats are wheelchair accessible',
  })
  accessible: boolean;
}

@Entity('templates')
export class Template {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Main Stage Arena' })
  @Column({ type: 'varchar' })
  name: string;

  @ApiPropertyOptional({
    example: 'Standard layout for indoor concerts up to 5,000 seats.',
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({ type: [TemplateCategory] })
  @Column({ type: 'jsonb', default: [] })
  categories: TemplateCategory[];

  @ApiProperty({
    example: 'abc123xyz',
    description: 'Seatsio chart key created when this template was saved',
  })
  @Column({ type: 'varchar', unique: true })
  seatioChartKey: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
