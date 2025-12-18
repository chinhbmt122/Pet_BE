/**
 * Account Domain Model
 *
 * Pure domain model with strict encapsulation.
 * Separated from TypeORM persistence entity per ADR-001.
 *
 * @see epics.md → ADR-001, ADR-003 (Encapsulation, SOLID principles)
 */

import * as bcrypt from 'bcrypt';
import { UserType } from '../entities/types/entity.types';

export class AccountDomainModel {
  // Private fields for strict encapsulation (Thin Account - auth only)
  private readonly _accountId: number | null;
  private readonly _email: string;
  private _passwordHash: string;
  private readonly _userType: UserType;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  /**
   * Private constructor - use static factory methods
   */
  private constructor(props: {
    accountId: number | null;
    email: string;
    passwordHash: string;
    userType: UserType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._accountId = props.accountId;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._userType = props.userType;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ===== Static Factory Methods =====

  /**
   * Create a new account (not yet persisted)
   */
  static create(props: {
    email: string;
    passwordHash: string;
    userType: UserType;
  }): AccountDomainModel {
    const now = new Date();
    return new AccountDomainModel({
      accountId: null,
      email: props.email,
      passwordHash: props.passwordHash,
      userType: props.userType,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from persistence (loaded from DB)
   */
  static reconstitute(props: {
    accountId: number;
    email: string;
    passwordHash: string;
    userType: UserType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AccountDomainModel {
    return new AccountDomainModel(props);
  }

  // ===== Getters (Read-Only Access) =====

  get accountId(): number | null {
    return this._accountId;
  }

  get email(): string {
    return this._email;
  }

  /**
   * Password hash getter - required for AccountMapper.toPersistence()
   * Design Decision: Exposed for Data Mapper pattern. Hash is one-way
   * encrypted so exposure risk is minimal.
   */
  get passwordHash(): string {
    return this._passwordHash;
  }

  /**
   * User type getter - READ ONLY, no setter/changer method provided.
   * Design Decision: userType is an INVARIANT (part of account identity).
   * Changing from PET_OWNER to VETERINARIAN would require deleting
   * PetOwner record and creating Employee record - essentially a new identity.
   * If role change is needed, create a new account instead.
   */
  get userType(): UserType {
    return this._userType;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== Domain Methods =====

  /**
   * Validates password against stored hash
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this._passwordHash);
  }

  /**
   * Checks if account is currently active
   */
  isAccountActive(): boolean {
    return this._isActive;
  }

  /**
   * Deactivates the account (soft disable)
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Reactivates the account
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Checks if account is a staff member (not pet owner)
   */
  isStaff(): boolean {
    return this._userType !== UserType.PET_OWNER;
  }

  /**
   * Checks if account has manager privileges
   */
  isManager(): boolean {
    return this._userType === UserType.MANAGER;
  }

  /**
   * Checks if account is a veterinarian
   */
  isVeterinarian(): boolean {
    return this._userType === UserType.VETERINARIAN;
  }

  /**
   * Changes password (expects already hashed password)
   */
  changePassword(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
  }
}
