import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ahmed Ali' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+9647701234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^((\+964|00964)9?)?(0?)(7[5789]\d{8})$/, {
    message: 'Phone number must be a valid Iraqi phone number',
  })
  phoneNumber: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Baghdad, Al-Karada', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  @IsString()
  @IsOptional()
  photo?: string;
}
