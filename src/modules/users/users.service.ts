import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  PaginatedResponseDto,
  createPaginatedResponse,
} from '../../common/dto';
import { AdminCreateUserDto } from './dtos/admin-create-user.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersFilterDto } from './dtos/users-filter.dto';
import { User, UserStatus } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  create(
    data: CreateUserDto & {
      password?: string;
      role?: User['role'];
      status?: UserStatus;
    },
  ): Promise<User> {
    const status = data.status ?? UserStatus.APPROVED;
    const user = this.repo.create({
      ...data,
      status,
      isVerified: status === UserStatus.APPROVED,
    });
    return this.repo.save(user);
  }

  async createByAdmin(data: AdminCreateUserDto): Promise<User> {
    const existing = await this.findByPhoneNumber(data.phoneNumber);
    if (existing) {
      throw new ConflictException('User with this phone number already exists');
    }
    const password = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;
    return this.create({
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      photo: data.photo,
      role: data.role,
      password,
    });
  }

  async findAll(filter: UsersFilterDto): Promise<PaginatedResponseDto<User>> {
    const where = filter.role != null ? { role: filter.role } : undefined;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip: filter.offset,
      take: filter.limit,
      order: { createdAt: 'DESC' },
    });

    return createPaginatedResponse(
      data,
      total,
      filter.page ?? 1,
      filter.limit ?? 10,
    );
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }

  findByPhoneNumber(phoneNumber: string) {
    return this.repo.findOne({
      where: { phoneNumber },
      select: [
        'id',
        'fullName',
        'phoneNumber',
        'password',
        'address',
        'photo',
        'role',
        'isVerified',
        'status',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  update(id: string, data: Partial<User>) {
    return this.repo.update(id, data);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
