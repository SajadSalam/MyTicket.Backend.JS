import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../bookings/booking.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('payments')
export class Payment {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ type: 'uuid' })
  bookingId: string;

  @OneToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ApiProperty({ description: 'Amwal/PayTabs transaction reference' })
  @Column({ type: 'varchar', unique: true })
  tranRef: string;

  @ApiProperty({ description: 'Cart ID sent to Amwal (booking ID)' })
  @Column({ type: 'varchar' })
  cartId: string;

  @ApiProperty({ example: '150000.00' })
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @ApiProperty({ example: 'IQD' })
  @Column({ type: 'varchar', length: 10, default: 'IQD' })
  currency: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Amwal redirect URL for customer' })
  @Column({ type: 'text', nullable: true })
  redirectUrl: string | null;

  @ApiPropertyOptional({ description: 'Raw callback payload from Amwal' })
  @Column({ type: 'jsonb', nullable: true })
  callbackPayload: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
