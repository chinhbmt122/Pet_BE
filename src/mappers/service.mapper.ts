import { Service } from '../entities/service.entity';
import { ServiceDomainModel } from '../domain/service.domain';

/**
 * Service Mapper (Data Mapper Pattern)
 */
export class ServiceMapper {
    static toDomain(entity: Service): ServiceDomainModel {
        return ServiceDomainModel.reconstitute({
            id: entity.serviceId,
            serviceName: entity.serviceName,
            categoryId: entity.categoryId,
            description: entity.description,
            basePrice: Number(entity.basePrice),
            estimatedDuration: entity.estimatedDuration,
            requiredStaffType: entity.requiredStaffType,
            isAvailable: entity.isAvailable,
            isBoardingService: entity.isBoardingService,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        });
    }

    static toPersistence(domain: ServiceDomainModel): Partial<Service> {
        const entity: Partial<Service> = {
            serviceName: domain.serviceName,
            categoryId: domain.categoryId,
            description: domain.description ?? undefined,
            basePrice: domain.basePrice,
            estimatedDuration: domain.estimatedDuration,
            requiredStaffType: domain.requiredStaffType,
            isAvailable: domain.isAvailable,
            isBoardingService: domain.isBoardingService,
        };

        if (domain.id !== null) {
            entity.serviceId = domain.id;
        }

        return entity;
    }

    static toDomainList(entities: Service[]): ServiceDomainModel[] {
        return entities.map((entity) => this.toDomain(entity));
    }
}
