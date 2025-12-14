import { VaccinationHistory } from '../entities/vaccination-history.entity';
import { VaccinationHistoryDomainModel } from '../domain/vaccination-history.domain';

/**
 * VaccinationHistory Mapper (Data Mapper Pattern)
 */
export class VaccinationHistoryMapper {
  static toDomain(entity: VaccinationHistory): VaccinationHistoryDomainModel {
    return VaccinationHistoryDomainModel.reconstitute({
      id: entity.vaccinationId,
      petId: entity.petId,
      vaccineTypeId: entity.vaccineTypeId,
      medicalRecordId: entity.medicalRecordId,
      batchNumber: entity.batchNumber,
      site: entity.site,
      administeredBy: entity.administeredBy,
      reactions: entity.reactions,
      administrationDate: entity.administrationDate,
      nextDueDate: entity.nextDueDate,
      notes: entity.notes,
      createdAt: entity.createdAt,
      vaccineBoosterIntervalMonths:
        entity.vaccineType?.boosterIntervalMonths ?? null,
    });
  }

  static toPersistence(
    domain: VaccinationHistoryDomainModel,
  ): Partial<VaccinationHistory> {
    const entity: Partial<VaccinationHistory> = {
      petId: domain.petId,
      vaccineTypeId: domain.vaccineTypeId,
      medicalRecordId: domain.medicalRecordId ?? undefined,
      batchNumber: domain.batchNumber ?? undefined,
      site: domain.site ?? undefined,
      administeredBy: domain.administeredBy ?? undefined,
      reactions: domain.reactions ?? undefined,
      administrationDate: domain.administrationDate,
      nextDueDate: domain.nextDueDate ?? undefined,
      notes: domain.notes ?? undefined,
    };

    if (domain.id !== null) {
      entity.vaccinationId = domain.id;
    }

    return entity;
  }

  static toDomainList(
    entities: VaccinationHistory[],
  ): VaccinationHistoryDomainModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
