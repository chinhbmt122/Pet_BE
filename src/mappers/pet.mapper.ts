import { Pet } from '../entities/pet.entity';
import { PetDomainModel } from '../domain/pet.domain';

/**
 * Pet Mapper (Data Mapper Pattern)
 *
 * Converts between Pet persistence entity and PetDomainModel.
 */
export class PetMapper {
  static toDomain(entity: Pet): PetDomainModel {
    return PetDomainModel.reconstitute({
      id: entity.petId,
      ownerId: entity.ownerId,
      name: entity.name,
      species: entity.species,
      breed: entity.breed,
      birthDate: entity.birthDate,
      gender: entity.gender,
      weight: entity.weight ? Number(entity.weight) : null,
      color: entity.color,
      initialHealthStatus: entity.initialHealthStatus,
      specialNotes: entity.specialNotes,

      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  static toPersistence(domain: PetDomainModel): Partial<Pet> {
    const entity: Partial<Pet> = {
      ownerId: domain.ownerId,
      name: domain.name,
      species: domain.species,
      breed: domain.breed ?? undefined,
      birthDate: domain.birthDate ?? undefined,
      gender: domain.gender,
      weight: domain.weight ?? undefined,
      color: domain.color ?? undefined,
      initialHealthStatus: domain.initialHealthStatus ?? undefined,
      specialNotes: domain.specialNotes ?? undefined,

    };

    if (domain.id !== null) {
      entity.petId = domain.id;
    }

    return entity;
  }

  static toDomainList(entities: Pet[]): PetDomainModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
