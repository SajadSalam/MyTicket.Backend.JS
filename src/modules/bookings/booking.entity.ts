import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../events/events.entity';
import { Payment } from '../payments/payment.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('bookings')
export class Booking {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ type: 'uuid' })
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({
    example: ['A-1', 'A-2'],
    description: 'Seatsio object labels (seats or tables)',
    type: [String],
  })
  @Column({ type: 'simple-array' })
  seats: string[];

  @ApiProperty({
    description: 'Seatsio hold token from the widget',
  })
  @Column({ type: 'varchar' })
  holdToken: string;

  @ApiProperty({ example: '150000.00', description: 'Total amount in IQD' })
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  totalAmount: string;

  @ApiProperty({ example: 'IQD' })
  @Column({ type: 'varchar', length: 10, default: 'IQD' })
  currency: string;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.PENDING })
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @ApiPropertyOptional({
    description: 'Seatsio order ID after successful booking',
  })
  @Column({ type: 'varchar', nullable: true })
  seatioOrderId: string | null;

  @ApiPropertyOptional({ example: 'John Doe' })
  @Column({ type: 'varchar', nullable: true })
  customerName: string | null;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @Column({ type: 'varchar', nullable: true })
  customerEmail: string | null;

  @ApiPropertyOptional({ example: '+9647701234567' })
  @Column({ type: 'varchar', nullable: true })
  customerPhone: string | null;

  @OneToOne(() => Payment, (payment) => payment.booking, { cascade: true })
  payment: Payment;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
