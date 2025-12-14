import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogDomainModel } from '../domain/audit-log.domain';

/**
 * AuditLog Mapper (Data Mapper Pattern)
 */
export class AuditLogMapper {
    static toDomain(entity: AuditLog): AuditLogDomainModel {
        return AuditLogDomainModel.reconstitute({
            id: entity.auditId,
            tableName: entity.tableName,
            recordId: entity.recordId,
            operation: entity.operation,
            changes: entity.changes,
            actorAccountId: entity.actorAccountId,
            actorType: entity.actorType,
            ipAddress: entity.ipAddress,
            changedAt: entity.changedAt,
        });
    }

    static toPersistence(domain: AuditLogDomainModel): Partial<AuditLog> {
        const entity: Partial<AuditLog> = {
            tableName: domain.tableName,
            recordId: domain.recordId,
            operation: domain.operation,
            changes: domain.changes ?? undefined,
            actorAccountId: domain.actorAccountId ?? undefined,
            actorType: domain.actorType ?? undefined,
            ipAddress: domain.ipAddress ?? undefined,
        };

        if (domain.id !== null) {
            entity.auditId = domain.id;
        }

        return entity;
    }

    static toDomainList(entities: AuditLog[]): AuditLogDomainModel[] {
        return entities.map((entity) => this.toDomain(entity));
    }
}
