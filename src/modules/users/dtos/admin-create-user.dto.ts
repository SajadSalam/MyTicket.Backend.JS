import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../users.entity';

export class AdminCreateUserDto {
  @ApiProperty({ example: 'Ahmed Ali' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+9647701234567' })
  @IsString()
  @Matches(/^\+?[\d\s-]+$/, { message: 'Phone number must be valid' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'Password123!', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CUSTOMER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
