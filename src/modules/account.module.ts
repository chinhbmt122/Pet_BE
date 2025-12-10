import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  imports: [TypeOrmModule.forFeature([Account, PetOwner, Employee])],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
