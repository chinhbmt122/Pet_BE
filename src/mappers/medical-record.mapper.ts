import { MedicalRecord } from '../entities/medical-record.entity';
import { MedicalRecordDomainModel } from '../domain/medical-record.domain';

/**
 * MedicalRecord Mapper (Data Mapper Pattern)
 */
export class MedicalRecordMapper {
  static toDomain(entity: MedicalRecord): MedicalRecordDomainModel {
    return MedicalRecordDomainModel.reconstitute({
      id: entity.recordId,
      petId: entity.petId,
      veterinarianId: entity.veterinarianId,
      appointmentId: entity.appointmentId,
      examinationDate: entity.examinationDate,
      diagnosis: entity.diagnosis,
      treatment: entity.treatment,
      medicalSummary: entity.medicalSummary,
      followUpDate: entity.followUpDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(
    domain: MedicalRecordDomainModel,
  ): Partial<MedicalRecord> {
    const entity: Partial<MedicalRecord> = {
      petId: domain.petId,
      veterinarianId: domain.veterinarianId,
      appointmentId: domain.appointmentId ?? undefined,
      examinationDate: domain.examinationDate,
      diagnosis: domain.diagnosis,
      treatment: domain.treatment,
      medicalSummary: domain.medicalSummary ?? undefined,
      followUpDate: domain.followUpDate ?? undefined,
    };

    if (domain.id !== null) {
      entity.recordId = domain.id;
    }

    return entity;
  }

  static toDomainList(entities: MedicalRecord[]): MedicalRecordDomainModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
