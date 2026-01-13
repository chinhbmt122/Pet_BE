import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Account } from '../entities/account.entity';
import { AccountDomainModel } from '../domain/account.domain';
import { AccountMapper } from '../mappers/account.mapper';
import { LoginResponseDto, AccountResponseDto } from '../dto/account';
import { JwtPayload } from '../dto/JWTTypes';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';
import { UserType } from '../entities/types/entity.types';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EmailService } from './email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

/**
 * AuthService
 *
 * Handles authentication concerns:
 * - Login (credential validation)
 * - Logout (session invalidation)
 * - Token validation
 * - Password reset
 *
 * Follows SRP - ONLY handles auth, no profile management.
 *
 * @see tech-spec-epic1-auth.md
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Authenticates user credentials and returns JWT token.
   *
   * Flow:
   * 1. Find account by email
   * 2. Convert to domain model
   * 3. Validate password using domain model
   * 4. Check account is active
   * 5. Generate JWT token
   * 6. Fetch profile from PetOwner/Employee
   * 7. Return token + account response
   */
  async login(email: string, password: string): Promise<LoginResponseDto> {
    // 1. Find account entity
    const entity = await this.accountRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!entity) {
      I18nException.unauthorized('errors.unauthorized.invalidCredentials');
    }

    // 2. Convert to domain model for business logic
    const domain = AccountMapper.toDomain(entity);

    // 3. Validate password using domain model
    const isValid = await domain.validatePassword(password);
    if (!isValid) {
      I18nException.unauthorized('errors.unauthorized.invalidCredentials');
    }

    // 4. Check account is active
    if (!domain.isActive) {
      I18nException.unauthorized('errors.unauthorized.accountInactive');
    }

    // 5. Generate JWT token
    const token = this.generateToken(domain);

    // 6. Fetch profile from PetOwner or Employee (thin account pattern)
    const profile = await this.fetchProfile(entity.accountId, entity.userType);

    // 7. Return response
    return {
      accessToken: token,
      account: this.mapToResponse(entity, profile),
    };
  }

  /**
   * Logout - invalidates session.
   * Note: JWT is stateless, client should delete token.
   * In production: add token to blacklist/Redis.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logout(_token?: string): boolean {
    // JWT is stateless - no server-side invalidation needed.
    // Client should delete token from storage.
    return true;
  }

  /**
   * Validates JWT token and returns payload.
   */
  validateToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  /**
   * Gets account by ID (for guards/middleware).
   */
  async getAccountById(accountId: number): Promise<Account | null> {
    return this.accountRepository.findOne({ where: { accountId } });
  }

  // ==================== Private Helpers ====================

  private generateToken(domain: AccountDomainModel): string {
    const payload: JwtPayload = {
      id: domain.accountId!,
      email: domain.email,
    };
    return this.jwtService.sign(payload);
  }

  private async fetchProfile(
    accountId: number,
    userType: UserType,
  ): Promise<PetOwner | Employee | null> {
    if (userType === UserType.PET_OWNER) {
      return this.petOwnerRepository.findOne({ where: { accountId } });
    }
    return this.employeeRepository.findOne({ where: { accountId } });
  }

  private mapToResponse(
    account: Account,
    profile: PetOwner | Employee | null,
  ): AccountResponseDto {
    return {
      accountId: account.accountId,
      email: account.email,
      userType: account.userType,
      fullName: profile?.fullName ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
      address: profile?.address ?? null,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  /**
   * Request password reset - generates token and sends email
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Find account
    const account = await this.accountRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if email exists or not (security best practice)
    if (!account) {
      return;
    }

    // Get user profile for name
    const profile = await this.fetchProfile(
      account.accountId,
      account.userType,
    );
    const userName = profile?.fullName || 'Người dùng';

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    // Save token to database
    await this.passwordResetTokenRepository.save({
      email: email.toLowerCase(),
      token: resetToken,
      expiresAt,
      isUsed: false,
    });

    // Send email
    await this.emailService.sendPasswordResetEmail(email, resetToken, userName);
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find valid token
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token, isUsed: false },
    });

    if (!resetToken) {
      I18nException.badRequest('errors.auth.invalidResetToken');
    }

    // Check if token expired
    if (new Date() > resetToken.expiresAt) {
      I18nException.badRequest('errors.auth.expiredResetToken');
    }

    // Find account
    const account = await this.accountRepository.findOne({
      where: { email: resetToken.email },
    });

    if (!account) {
      I18nException.notFound('errors.account.notFound');
    }

    // Update password using domain model
    const domain = AccountMapper.toDomain(account);
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    domain.changePassword(newPasswordHash);

    // Save updated password hash
    account.passwordHash = domain.passwordHash;
    await this.accountRepository.save(account);

    // Mark token as used
    resetToken.isUsed = true;
    await this.passwordResetTokenRepository.save(resetToken);
  }
}
