import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
}

@Entity('users')
export class User {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'John Doe' })
  @Column()
  fullName: string;

  @ApiProperty({ example: '+1234567890' })
  @Column({ unique: true })
  phoneNumber: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @ApiPropertyOptional({ example: '123 Main St, City' })
  @Column({ nullable: true })
  address: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @Column({ nullable: true })
  photo: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ enum: UserStatus, example: UserStatus.APPROVED })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.APPROVED,
  })
  status: UserStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Auto-assigned sequence number when approved as a merchant',
  })
  @Column({ type: 'int', nullable: true, unique: true })
  merchantSequence: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
