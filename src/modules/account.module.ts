import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from '../controllers/account.controller';
import { AccountService } from '../services/account.service';
import { AccountFactory } from '../factories/account.factory';
import { Account } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';
import { AuthModule } from './auth.module';

/**
 * AccountModule
 *
 * Handles generic account operations:
 * - Password change
 * - Account activation/deactivation
 * - Profile retrieval
 *
 * Imports AuthModule for login/logout functionality.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, PetOwner, Employee]),
    AuthModule,
  ],
  controllers: [AccountController],
  providers: [AccountService, AccountFactory],
  exports: [AccountService, AccountFactory],
})
export class AccountModule {}
