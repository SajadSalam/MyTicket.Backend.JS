import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminCreateUserDto } from './dtos/admin-create-user.dto';
import { UpdatePhotoDto } from './dtos/update-photo.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersFilterDto } from './dtos/users-filter.dto';
import { User, UserRole } from './users.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @ApiOperation({ summary: 'Get all users' })
  @ApiPaginatedResponse(User)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() filter: UsersFilterDto) {
    return this.service.findAll(filter);
  }

  @ApiOperation({ summary: 'Create user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this phone number already exists',
  })
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body() dto: AdminCreateUserDto,
  ): Promise<{ user: User; message: string }> {
    const user = await this.service.createByAdmin(dto);
    return { user, message: 'User created successfully' };
  }

  @ApiOperation({ summary: 'Request merchant role (Customer only)' })
  @ApiResponse({
    status: 200,
    description: 'Merchant request submitted successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Already a merchant or request already pending',
  })
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.service.findOne(id).then((user) => ({ ...user }));
  }

  @ApiOperation({ summary: 'Update user by id' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.service
      .update(id, dto)
      .then(() => ({ message: 'User updated successfully' }))
      .catch(() => ({ message: 'User not found' }));
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @Patch('me/profile')
  updateMyProfile(@Body() dto: UpdateUserDto, @CurrentUser() user: User) {
    return this.service
      .update(user.id, dto)
      .then(() => ({ message: 'Profile updated successfully' }));
  }

  @ApiOperation({ summary: 'Update current user photo' })
  @ApiResponse({
    status: 200,
    description: 'Profile photo updated successfully',
  })
  @Patch('me/photo')
  updateMyPhoto(@Body() dto: UpdatePhotoDto, @CurrentUser() user: User) {
    return this.service
      .update(user.id, { photo: dto.photo })
      .then(() => ({ message: 'Profile photo updated successfully' }));
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @Get('me')
  getMyProfile(@CurrentUser() user: User) {
    return this.service.findOne(user.id).then((user) => ({ user }));
  }

  @ApiOperation({ summary: 'Delete user by id' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service
      .delete(id)
      .then(() => ({ message: 'User deleted successfully' }))
      .catch(() => ({ message: 'User not found' }));
  }
}
