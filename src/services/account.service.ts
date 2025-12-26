import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Account, UserType } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';
import { AccountMapper } from '../mappers/account.mapper';

/**
 * AccountService
 *
 * Handles generic account operations:
 * - Profile fetching (combines Account + PetOwner/Employee)
 * - Password change
 * - Account activation/deactivation
 *
 * DOES NOT handle:
 * - Login/Logout (AuthService)
 * - Registration (PetOwnerService)
 * - Staff creation (StaffService)
 */
@Injectable()
export class AccountService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  /**
   * Gets account by ID.
   * If user is provided, validates they can only access their own account (or MANAGER can access all).
   */
  async getAccountById(
    accountId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<Account> {
    // If user provided and not MANAGER, validate self-access only
    if (user && user.userType !== UserType.MANAGER) {
      if (user.accountId !== accountId) {
        throw new ForbiddenException('You can only access your own account');
      }
    }

    const account = await this.accountRepository.findOne({
      where: { accountId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  /**
   * Gets full profile (Account + PetOwner/Employee).
   * If user is provided, validates they can only access their own profile (or MANAGER can access all).
   */
  async getFullProfile(
    accountId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<{
    account: Account;
    profile: PetOwner | Employee | null;
  }> {
    // Validate access
    if (user && user.userType !== UserType.MANAGER) {
      if (user.accountId !== accountId) {
        throw new ForbiddenException('You can only access your own profile');
      }
    }

    const account = await this.getAccountById(accountId);
    const profile = await this.fetchProfile(accountId, account.userType);
    return { account, profile };
  }

  /**
   * Changes account password.
   * Uses domain model for password validation and hashing.
   * User can only change their own password.
   */
  async changePassword(
    accountId: number,
    oldPassword: string,
    newPassword: string,
    user?: { accountId: number; userType: UserType },
  ): Promise<boolean> {
    // Validate self-access only (even MANAGER cannot change others' passwords)
    if (user && user.accountId !== accountId) {
      throw new ForbiddenException('You can only change your own password');
    }

    // 1. Find account
    const entity = await this.accountRepository.findOne({
      where: { accountId },
    });
    if (!entity) {
      throw new NotFoundException('Account not found');
    }

    // 2. Convert to domain model
    const domain = AccountMapper.toDomain(entity);

    // 3. Validate old password
    const isValid = await domain.validatePassword(oldPassword);
    if (!isValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    // 4. Validate new password is different
    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from old password',
      );
    }

    // 5. Hash and update password via domain model
    const newHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    domain.changePassword(newHash);

    // 6. Save
    const updated = AccountMapper.toPersistence(domain);
    await this.accountRepository.save(updated);

    return true;
  }

  /**
   * Deactivates an account.
   */
  async deactivateAccount(accountId: number): Promise<Account> {
    const entity = await this.accountRepository.findOne({
      where: { accountId },
    });
    if (!entity) {
      throw new NotFoundException('Account not found');
    }

    const domain = AccountMapper.toDomain(entity);
    domain.deactivate();

    const updated = AccountMapper.toPersistence(domain);
    return this.accountRepository.save(updated);
  }

  /**
   * Activates an account.
   */
  async activateAccount(accountId: number): Promise<Account> {
    const entity = await this.accountRepository.findOne({
      where: { accountId },
    });
    if (!entity) {
      throw new NotFoundException('Account not found');
    }

    const domain = AccountMapper.toDomain(entity);
    domain.activate();

    const updated = AccountMapper.toPersistence(domain);
    return this.accountRepository.save(updated);
  }

  /**
   * Verifies if account has specific role.
   */
  async verifyRole(
    accountId: number,
    requiredRole: UserType,
  ): Promise<boolean> {
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });
    return account?.userType === requiredRole;
  }

  async fetchProfile(
    accountId: number,
    userType: UserType,
  ): Promise<PetOwner | Employee | null> {
    if (userType === UserType.PET_OWNER) {
      return this.petOwnerRepository.findOne({ where: { accountId } });
    }
    return this.employeeRepository.findOne({ where: { accountId } });
  }
}
