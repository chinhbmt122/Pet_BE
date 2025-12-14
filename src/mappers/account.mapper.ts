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
            fullName: entity.fullName,
            phoneNumber: entity.phoneNumber,
            address: entity.address,
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
            fullName: domain.fullName,
            phoneNumber: domain.phoneNumber,
            address: domain.address ?? undefined,
            isActive: domain.isAccountActive(),
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
}
