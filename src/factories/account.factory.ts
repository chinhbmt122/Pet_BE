import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Account } from '../entities/account.entity';
import { UserType } from '../entities/types/entity.types';

/**
 * AccountFactory
 *
 * Creates Account entities with auth information only.
 * Follows Single Responsibility Principle - only handles Account creation.
 *
 * Usage Pattern:
 * 1. Create Account with AccountFactory
 * 2. Save Account to get accountId
 * 3. Create PetOwner/Employee with respective factory using accountId
 *
 * @see PetOwnerFactory - for PetOwner profile creation
 * @see EmployeeFactory - for Employee profile creation
 */
@Injectable()
export class AccountFactory {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  /**
   * Creates an Account entity with auth information only.
   *
   * @param email - User email (unique)
   * @param password - Plain text password (will be hashed)
   * @param userType - Type of user (PET_OWNER, VETERINARIAN, etc.)
   */
  async create(
    email: string,
    password: string,
    userType: UserType,
  ): Promise<Account> {
    // Validate required fields
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Validate email uniqueness
    await this.validateEmailUniqueness(email);

    // Create account with auth fields only
    const account = new Account();
    account.email = email.toLowerCase();
    account.passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
    account.userType = userType;
    account.isActive = true;

    return account;
  }

  /**
   * Validates that email is unique.
   * Provides user-friendly error message before hitting DB constraint.
   */
  private async validateEmailUniqueness(email: string): Promise<void> {
    const existing = await this.accountRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }
  }
}
