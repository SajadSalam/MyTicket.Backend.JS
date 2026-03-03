import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/users.entity';

@Injectable()
export class AuthSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    try {
      // Check if admin user already exists
      const existingAdmin = await this.userRepository.findOne({
        where: { role: UserRole.ADMIN },
      });

      if (existingAdmin) {
        console.log('Admin user already exists');
        return;
      }

      // Get admin credentials from environment variables or use defaults
      const adminPhoneNumber =
        this.configService.get<string>('ADMIN_PHONE_NUMBER') ||
        '+9647711111111';
      const adminPassword =
        this.configService.get<string>('ADMIN_PASSWORD') || '123@Root';
      const adminFullName =
        this.configService.get<string>('ADMIN_FULL_NAME') || 'Admin User';

      // Check if phone number is already taken
      const existingUser = await this.userRepository.findOne({
        where: { phoneNumber: adminPhoneNumber },
      });

      if (existingUser) {
        console.log(
          `Phone number ${adminPhoneNumber} is already taken. Skipping admin user creation.`,
        );
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      const adminUser = this.userRepository.create({
        fullName: adminFullName,
        phoneNumber: adminPhoneNumber,
        password: hashedPassword,
        role: UserRole.ADMIN,
        isVerified: true, // Admin is verified by default
      });

      await this.userRepository.save(adminUser);

      console.log('Admin user created successfully');
      console.log(`Phone Number: ${adminPhoneNumber}`);
      console.log(`Password: ${adminPassword}`);
    } catch (error) {
      console.error('Error seeding admin user:', error);
    }
  }
}
