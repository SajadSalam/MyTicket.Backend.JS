import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Ahmed Ali' })
  fullName: string;

  @ApiProperty({ example: '+9647701234567' })
  phoneNumber: string;

  @ApiProperty({ required: false })
  photo?: string;
}
