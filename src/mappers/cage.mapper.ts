import { Cage } from '../entities/cage.entity';
import { CageDomainModel } from '../domain/cage.domain';

/**
 * Cage Mapper (Data Mapper Pattern)
 */
export class CageMapper {
    static toDomain(entity: Cage): CageDomainModel {
        return CageDomainModel.reconstitute({
            id: entity.cageId,
            cageNumber: entity.cageNumber,
            size: entity.size,
            location: entity.location,
            status: entity.status,
            dailyRate: Number(entity.dailyRate),
            notes: entity.notes,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        });
    }

    static toPersistence(domain: CageDomainModel): Partial<Cage> {
        const entity: Partial<Cage> = {
            cageNumber: domain.cageNumber,
            size: domain.size,
            location: domain.location ?? undefined,
            status: domain.status,
            dailyRate: domain.dailyRate,
            notes: domain.notes ?? undefined,
        };

        if (domain.id !== null) {
            entity.cageId = domain.id;
        }

        return entity;
    }

    static toDomainList(entities: Cage[]): CageDomainModel[] {
        return entities.map((entity) => this.toDomain(entity));
    }
}
