import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Template } from '../templates/templates.entity';

@Entity('events')
export class Event {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Summer Music Festival 2025' })
  @Column({ type: 'varchar' })
  name: string;

  @ApiPropertyOptional({ example: 'A short description of the event' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ example: 'Full HTML or markdown content...' })
  @Column({ type: 'text', nullable: true })
  content: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/main.jpg' })
  @Column({ type: 'text', nullable: true })
  mainImage: string | null;

  @ApiPropertyOptional({
    example: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  images: string[] | null;

  @ApiPropertyOptional({
    example: ['music', 'festival', 'summer'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @ApiProperty({ example: '2025-07-01T18:00:00.000Z' })
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @ApiProperty({ example: '2025-07-03T23:59:59.000Z' })
  @Column({ type: 'timestamptz' })
  endDate: Date;

  @ApiProperty({ example: '2025-06-01T00:00:00.000Z' })
  @Column({ type: 'timestamptz' })
  bookingStartDate: Date;

  @ApiProperty({ example: '2025-06-30T23:59:59.000Z' })
  @Column({ type: 'timestamptz' })
  bookingEndDate: Date;

  @ApiPropertyOptional({ example: 'Central Park, New York' })
  @Column({ type: 'text', nullable: true })
  location: string | null;

  @ApiPropertyOptional({ example: 40.785091 })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: string | null;

  @ApiPropertyOptional({ example: -73.968285 })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: string | null;

  // ─── Template relation ────────────────────────────────────────────────────

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ type: 'uuid' })
  templateId: string;

  @ManyToOne(() => Template, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'templateId' })
  template: Template;

  // ─── Seatsio ──────────────────────────────────────────────────────────────

  @ApiProperty({
    example: 'ev-abc123',
    description: 'Seatsio event key provisioned when this event was created',
  })
  @Column({ type: 'varchar', unique: true })
  seatioEventKey: string;

  // ─── Timestamps ───────────────────────────────────────────────────────────

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
