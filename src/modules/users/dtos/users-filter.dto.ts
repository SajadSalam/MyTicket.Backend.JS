import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { UserRole } from '../users.entity';

export class UsersFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filter users by role',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
