import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { Account } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EmailModule } from './email.module';

/**
 * AuthModule
 *
 * Handles authentication concerns:
 * - Login/Logout
 * - Token validation
 * - JWT management
 * - Password reset
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, PetOwner, Employee, PasswordResetToken]),
    EmailModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRES_IN') || 86400, // 24 hours in seconds
        },
      }),
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
