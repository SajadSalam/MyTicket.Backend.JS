import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from './events.entity';

@Entity('event_category_pricings')
@Unique(['eventId', 'categoryKey'])
export class EventCategoryPricing {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ type: 'uuid' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.categoryPricings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ApiProperty({
    example: '1',
    description:
      'Seatsio category key (matches the key in the template categories)',
  })
  @Column({ type: 'varchar' })
  categoryKey: string;

  @ApiProperty({ example: 'VIP', description: 'Human-readable category name' })
  @Column({ type: 'varchar' })
  categoryLabel: string;

  @ApiProperty({ example: 75000, description: 'Price in the smallest unit (e.g. fils/cents)' })
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  price: string;

  @ApiProperty({ example: 'IQD' })
  @Column({ type: 'varchar', length: 10, default: 'IQD' })
  currency: string;

  @ApiPropertyOptional({ example: 'Front-row VIP seats with exclusive access' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
