import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountController } from '../controllers/account.controller';
import { AccountService } from '../services/account.service';
import { Account } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';

/**
 * AccountModule
 *
 * Manages user authentication, registration, and role-based access control (RBAC).
 * Handles login sessions, password management, and account verification.
 * Supports five user roles: Pet Owner, Manager, Veterinarian, Care Staff, and Receptionist.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, PetOwner, Employee]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-change-in-production',
        signOptions: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '24h') as any,
        },
      }),
    }),
  ],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
