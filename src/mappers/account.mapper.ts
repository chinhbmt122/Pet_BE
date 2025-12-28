/**
 * Account Mapper
 *
 * Bidirectional mapping between Account (persistence) and AccountDomainModel (domain).
 * Implements Data Mapper pattern per ADR-003.
 *
 * @see epics.md → ADR-001 (Domain/Persistence Separation)
 */

import { Account } from '../entities/account.entity';
import { AccountDomainModel } from '../domain/account.domain';
import { AccountResponseDto } from '../dto/account';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';

export class AccountMapper {
  /**
   * Convert persistence entity to domain model
   */
  static toDomain(entity: Account): AccountDomainModel {
    return AccountDomainModel.reconstitute({
      accountId: entity.accountId,
      email: entity.email,
      passwordHash: entity.passwordHash,
      userType: entity.userType,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Convert domain model to persistence entity (for saving)
   * Returns partial entity - TypeORM will merge with existing.
   *
   * Note: createdAt/updatedAt are NOT included because TypeORM manages them
   * automatically via @CreateDateColumn and @UpdateDateColumn decorators.
   */
  static toPersistence(domain: AccountDomainModel): Partial<Account> {
    const entity: Partial<Account> = {
      email: domain.email,
      passwordHash: domain.passwordHash,
      userType: domain.userType,
      isActive: domain.isActive,
    };

    // Include accountId if it exists (for updates)
    if (domain.accountId !== null) {
      entity.accountId = domain.accountId;
    }

    return entity;
  }

  /**
   * Convert array of entities to domain models
   */
  static toDomainList(entities: Account[]): AccountDomainModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Convert Account entity to AccountResponseDto
   * Maps account + profile data to response DTO for API responses
   */
  static toResponseDto(
    account: Account,
    profile?: PetOwner | Employee | null,
  ): AccountResponseDto {
    const response: AccountResponseDto = {
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

    // Include petOwner if profile is PetOwner
    if (profile && 'petOwnerId' in profile) {
      response.petOwner = {
        petOwnerId: profile.petOwnerId,
      };
    }

    // Include employee if profile is Employee
    if (profile && 'employeeId' in profile) {
      response.employee = {
        employeeId: profile.employeeId,
      };
    }

    return response;
  }
}
