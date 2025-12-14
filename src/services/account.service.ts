import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Account, UserType } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';
import { Veterinarian } from '../entities/veterinarian.entity';
import { CareStaff } from '../entities/care-staff.entity';
import { Manager } from '../entities/manager.entity';
import { Receptionist } from '../entities/receptionist.entity';
import {
  RegisterDto,
  LoginResponseDto,
  AccountResponseDto,
  UpdateProfileDto,
} from '../dto/account';
import { JwtPayload } from '../dto/JWTTypes';
// Domain models & mappers (ADR-001: Domain/Persistence Separation)
import { AccountDomainModel } from '../domain/account.domain';
import { AccountMapper } from '../mappers/account.mapper';

/**
 * AccountService (AccountManager)
 *
 * Manages user authentication, registration, and role-based access control (RBAC).
 * Handles login sessions, password management, and account verification.
 * Supports five user roles: Pet Owner, Manager, Veterinarian, Care Staff, and Receptionist.
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
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Authenticates user credentials and returns session token.
   * @throws AuthenticationException if credentials invalid
   */
  async login(email: string, password: string): Promise<LoginResponseDto> {
    const account = await this.accountRepository.findOne({
      where: { email },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      account.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!account.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const token = this.generateAuthToken(account);

    const accountWithRelations = await this.getAccountById(account.accountId);
    return {
      accessToken: token,
      account: this.mapAccountToResponse(accountWithRelations),
    };
  }

  /**
   * Creates new user account with validation.
   * @throws ValidationException, DuplicateAccountException
   */
  async register(registerDto: RegisterDto): Promise<Account> {
    // 1. Validate account data
    this.validateAccountData(registerDto);

    // 2. Check for duplicate username/email
    const existingEmail = await this.accountRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingPhone = await this.accountRepository.findOne({
      where: { phoneNumber: registerDto.phoneNumber },
    });
    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // 3. Hash password
    const passwordHash = await this.hashPassword(registerDto.password);

    // 4. Create account and related entity (PetOwner/Employee)
    const account = this.accountRepository.create({
      email: registerDto.email,
      passwordHash,
      userType: registerDto.userType,
      fullName: registerDto.fullName,
      phoneNumber: registerDto.phoneNumber,
      address: registerDto.address,
      isActive: true,
    });

    const savedAccount = await this.accountRepository.save(account);

    // Create related entity based on user type
    if (registerDto.userType === UserType.PET_OWNER) {
      const petOwner = this.petOwnerRepository.create({
        accountId: savedAccount.accountId,
        preferredContactMethod: registerDto.preferredContactMethod || 'Email',
        emergencyContact: registerDto.emergencyContact,
      });
      await this.petOwnerRepository.save(petOwner);
    } else {
      // Employee types: MANAGER, VETERINARIAN, CARE_STAFF, RECEPTIONIST
      if (!registerDto.hireDate) {
        throw new BadRequestException('Hire date is required for employees');
      }
      if (registerDto.salary === undefined || registerDto.salary === null) {
        throw new BadRequestException('Salary is required for employees');
      }

      // Create appropriate child entity based on user type
      const baseEmployeeData = {
        accountId: savedAccount.accountId,
        hireDate: new Date(registerDto.hireDate),
        salary: registerDto.salary,
        isAvailable: true,
      };

      let employee: Employee;
      switch (registerDto.userType) {
        case UserType.VETERINARIAN:
          employee = this.employeeRepository.create({
            ...baseEmployeeData,
            licenseNumber: registerDto.licenseNumber || '',
            expertise: registerDto.specialization,
          } as Veterinarian);
          break;
        case UserType.CARE_STAFF:
          employee = this.employeeRepository.create({
            ...baseEmployeeData,
            skills: registerDto.skills || [],
          } as CareStaff);
          break;
        case UserType.MANAGER:
          employee = this.employeeRepository.create(baseEmployeeData as Manager);
          break;
        case UserType.RECEPTIONIST:
          employee = this.employeeRepository.create(baseEmployeeData as Receptionist);
          break;
        default:
          employee = this.employeeRepository.create(baseEmployeeData as Manager);
      }
      await this.employeeRepository.save(employee);
    }

    // 5. Send confirmation email (TODO: Implement email service)
    // await this.emailService.sendWelcomeEmail(savedAccount.email);

    return savedAccount;
  }

  /**
   * Invalidates user session and clears authentication token.
   */
  async logout(token: string): Promise<boolean> {
    // Note: JWT tokens are stateless, so we can't truly "invalidate" them
    // In a production system, you would:
    // 1. Add token to a blacklist/Redis cache
    // 2. Set expiration on the blacklist entry
    // For now, we'll just return true
    // The client should delete the token from their storage
    return true;
  }

  /**
   * Updates user profile information.
   * @throws AccountNotFoundException, ValidationException
   */
  async updateProfile(
    accountId: number,
    updateData: UpdateProfileDto,
  ): Promise<Account> {
    // 1. Find account by ID
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // 2. Validate update data
    if (
      updateData.phoneNumber &&
      updateData.phoneNumber !== account.phoneNumber
    ) {
      const existingPhone = await this.accountRepository.findOne({
        where: { phoneNumber: updateData.phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // 3. Update account fields
    if (updateData.fullName !== undefined)
      account.fullName = updateData.fullName;
    if (updateData.phoneNumber !== undefined)
      account.phoneNumber = updateData.phoneNumber;
    if (updateData.address !== undefined) account.address = updateData.address;
    if (updateData.isActive !== undefined)
      account.isActive = updateData.isActive;

    // 4. Save account changes
    await this.accountRepository.save(account);

    // 5. Update related entity based on user type
    if (account.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId },
      });
      if (petOwner) {
        if (updateData.preferredContactMethod !== undefined) {
          petOwner.preferredContactMethod = updateData.preferredContactMethod;
        }
        if (updateData.emergencyContact !== undefined) {
          petOwner.emergencyContact = updateData.emergencyContact;
        }
        await this.petOwnerRepository.save(petOwner);
      }
    } else {
      const employee = await this.employeeRepository.findOne({
        where: { accountId },
      });
      if (employee) {
        // Update common employee fields
        if (updateData.isAvailable !== undefined) {
          employee.isAvailable = updateData.isAvailable;
        }
        // Update type-specific fields based on employee type
        if (employee instanceof Veterinarian && updateData.specialization !== undefined) {
          (employee as Veterinarian).expertise = updateData.specialization;
        }
        await this.employeeRepository.save(employee);
      }
    }

    return account;
  }

  /**
   * Changes user password after validating old password.
   * @throws AuthenticationException, WeakPasswordException
   */
  async changePassword(
    accountId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    // 1. Find account by ID
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // 2. Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      account.passwordHash,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    // 3. Validate new password strength (already validated by DTO)
    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from old password',
      );
    }

    // 4. Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // 5. Update password hash
    account.passwordHash = newPasswordHash;
    await this.accountRepository.save(account);

    return true;
  }

  /**
   * Checks if user has required role for operation (RBAC).
   * Returns true if authorized, false otherwise.
   */
  async verifyRole(
    accountId: number,
    requiredRole: UserType,
  ): Promise<boolean> {
    // 1. Find account by ID
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });

    if (!account) {
      return false;
    }

    // 2. Check userType against required role
    return account.userType === requiredRole;
  }

  /**
   * Retrieves account information by ID.
   * @throws AccountNotFoundException
   */
  async getAccountById(accountId: number): Promise<Account> {
    // 1. Find account by ID with related data
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // 2. Load related entity based on user type
    if (account.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId },
        relations: ['account'],
      });
      account.petOwner = petOwner ?? undefined;
    } else {
      const employee = await this.employeeRepository.findOne({
        where: { accountId },
        relations: ['account'],
      });
      account.employee = employee ?? undefined;
    }

    return account;
  }

  /**
   * Initiates password reset process and sends reset link via email.
   */
  async resetPassword(email: string): Promise<boolean> {
    // 1. Find account by email
    const account = await this.accountRepository.findOne({
      where: { email },
    });

    if (!account) {
      // Don't reveal that account doesn't exist for security
      return true;
    }

    // 2. Generate reset token
    const resetToken = this.jwtService.sign(
      { accountId: account.accountId, type: 'reset' },
      { expiresIn: '1h' },
    );

    // 3. Send reset email (TODO: Implement email service)
    // await this.emailService.sendPasswordResetEmail(email, resetToken);
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return true;
  }

  // Private helper methods

  /**
   * Validates account data format, email, phone number, etc.
   */
  private validateAccountData(accountData: RegisterDto): boolean {
    // Basic validation is handled by class-validator decorators in DTO
    // Additional business logic validation can be added here

    if (accountData.userType !== UserType.PET_OWNER) {
      // Employees require additional fields
      if (!accountData.hireDate) {
        throw new BadRequestException('Hire date is required for employees');
      }
      if (accountData.salary === undefined || accountData.salary === null) {
        throw new BadRequestException('Salary is required for employees');
      }
    }

    return true;
  }

  /**
   * Hashes password using bcrypt algorithm with salt.
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Generates JWT token for authenticated session.
   */
  private generateAuthToken(account: Account): string {
    const payload: JwtPayload = {
      id: account.accountId,
      email: account.email,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Maps Account entity to response DTO (excludes password hash)
   */
  private mapAccountToResponse(account: Account): AccountResponseDto {
    const response: AccountResponseDto = {
      accountId: account.accountId,
      email: account.email,
      userType: account.userType,
      fullName: account.fullName,
      phoneNumber: account.phoneNumber,
      address: account.address,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };

    if (account.petOwner) {
      response.petOwner = account.petOwner;
    }
    if (account.employee) {
      response.employee = account.employee;
    }

    return response;
  }
}
