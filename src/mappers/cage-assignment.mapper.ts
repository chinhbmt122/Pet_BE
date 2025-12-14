import { CageAssignment } from '../entities/cage-assignment.entity';
import { CageAssignmentDomainModel } from '../domain/cage-assignment.domain';

/**
 * CageAssignment Mapper (Data Mapper Pattern)
 */
export class CageAssignmentMapper {
    static toDomain(entity: CageAssignment): CageAssignmentDomainModel {
        return CageAssignmentDomainModel.reconstitute({
            id: entity.assignmentId,
            cageId: entity.cageId,
            petId: entity.petId,
            checkInDate: entity.checkInDate,
            expectedCheckOutDate: entity.expectedCheckOutDate,
            actualCheckOutDate: entity.actualCheckOutDate,
            dailyRate: Number(entity.dailyRate),
            assignedById: entity.assignedById,
            status: entity.status,
            notes: entity.notes,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        });
    }

    static toPersistence(domain: CageAssignmentDomainModel): Partial<CageAssignment> {
        const entity: Partial<CageAssignment> = {
            cageId: domain.cageId,
            petId: domain.petId,
            checkInDate: domain.checkInDate,
            expectedCheckOutDate: domain.expectedCheckOutDate ?? undefined,
            actualCheckOutDate: domain.actualCheckOutDate ?? undefined,
            dailyRate: domain.dailyRate,
            assignedById: domain.assignedById ?? undefined,
            status: domain.status,
            notes: domain.notes ?? undefined,
        };

        if (domain.id !== null) {
            entity.assignmentId = domain.id;
        }

        return entity;
    }

    static toDomainList(entities: CageAssignment[]): CageAssignmentDomainModel[] {
        return entities.map((entity) => this.toDomain(entity));
    }
}
