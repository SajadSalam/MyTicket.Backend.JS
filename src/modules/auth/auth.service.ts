import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../users/users.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByPhoneNumber(
      registerDto.phoneNumber,
    );

    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      fullName: registerDto.fullName,
      phoneNumber: registerDto.phoneNumber,
      password: hashedPassword,
      photo: registerDto.photo,
      status: UserStatus.APPROVED,
    });

    return {
      user,
      message: 'Registration successful. You can now login.',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(
      loginDto.phoneNumber,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    // Remove password from response
    const userWithoutPassword = {
      ...user,
      password: undefined,
    };

    return {
      user: userWithoutPassword,
      access_token: token,
    };
  }

  async validateUser(phoneNumber: string, password: string) {
    const user = await this.usersService.findByPhoneNumber(phoneNumber);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    if (user.role === UserRole.CUSTOMER && user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(
        'Your account is pending admin approval. Please wait for approval to login.',
      );
    }

    return user;
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
