import { WorkSchedule } from '../entities/work-schedule.entity';
import { WorkScheduleDomainModel } from '../domain/work-schedule.domain';

/**
 * WorkSchedule Mapper (Data Mapper Pattern)
 */
export class WorkScheduleMapper {
  static toDomain(entity: WorkSchedule): WorkScheduleDomainModel {
    return WorkScheduleDomainModel.reconstitute({
      id: entity.scheduleId,
      employeeId: entity.employeeId,
      workDate: entity.workDate,
      startTime: entity.startTime,
      endTime: entity.endTime,
      breakStart: entity.breakStart,
      breakEnd: entity.breakEnd,
      isAvailable: entity.isAvailable,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: WorkScheduleDomainModel): Partial<WorkSchedule> {
    const entity: Partial<WorkSchedule> = {
      employeeId: domain.employeeId,
      workDate: domain.workDate,
      startTime: domain.startTime,
      endTime: domain.endTime,
      breakStart: domain.breakStart ?? undefined,
      breakEnd: domain.breakEnd ?? undefined,
      isAvailable: domain.isAvailable,
      notes: domain.notes ?? undefined,
    };

    if (domain.id !== null) {
      entity.scheduleId = domain.id;
    }

    return entity;
  }

  static toDomainList(entities: WorkSchedule[]): WorkScheduleDomainModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
