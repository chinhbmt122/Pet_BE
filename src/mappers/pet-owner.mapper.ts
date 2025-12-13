/**
 * PetOwner Mapper
 *
 * Bidirectional mapping between PetOwner (persistence) and PetOwnerDomainModel (domain).
 *
 * @see epics.md → ADR-001 (Domain/Persistence Separation)
 */

import { PetOwner } from '../entities/pet-owner.entity';
import { PetOwnerDomainModel } from '../domain/pet-owner.domain';

export class PetOwnerMapper {
    /**
     * Convert persistence entity to domain model
     */
    static toDomain(entity: PetOwner): PetOwnerDomainModel {
        return PetOwnerDomainModel.reconstitute({
            petOwnerId: entity.petOwnerId,
            accountId: entity.accountId,
            preferredContactMethod: entity.preferredContactMethod,
            emergencyContact: entity.emergencyContact,
            registrationDate: entity.registrationDate,
        });
    }

    /**
     * Convert domain model to persistence entity.
     *
     * Note: registrationDate is NOT included because TypeORM manages it
     * automatically via @CreateDateColumn decorator.
     */
    static toPersistence(domain: PetOwnerDomainModel): Partial<PetOwner> {
        const entity: Partial<PetOwner> = {
            accountId: domain.accountId,
            preferredContactMethod: domain.preferredContactMethod,
            emergencyContact: domain.emergencyContact ?? undefined,
        };

        if (domain.petOwnerId !== null) {
            entity.petOwnerId = domain.petOwnerId;
        }

        return entity;
    }

    /**
     * Convert array of entities to domain models
     */
    static toDomainList(entities: PetOwner[]): PetOwnerDomainModel[] {
        return entities.map((entity) => this.toDomain(entity));
    }
}
