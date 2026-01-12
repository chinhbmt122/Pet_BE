import { Appointment } from '../entities/appointment.entity';
import { AppointmentDomainModel } from '../domain/appointment.domain';

/**
 * Appointment Mapper (Data Mapper Pattern)
 *
 * Converts between Appointment persistence entity and AppointmentDomainModel.
 * Part of Full DDD implementation per ADR-002.
 */
export class AppointmentMapper {
  /**
   * Convert persistence entity to domain model
   */
  static toDomain(entity: Appointment): AppointmentDomainModel {
    // Get primary service ID from appointmentServices (backward compatibility)
    const primaryServiceId = entity.appointmentServices?.[0]?.serviceId ?? 0;

    return AppointmentDomainModel.reconstitute({
      id: entity.appointmentId,
      status: entity.status,
      petId: entity.petId,
      employeeId: entity.employeeId,
      serviceId: primaryServiceId,
      appointmentDate: entity.appointmentDate,
      startTime: entity.startTime,
      endTime: entity.endTime,
      notes: entity.notes,
      cancellationReason: entity.cancellationReason,
      cancelledAt: entity.cancelledAt,
      estimatedCost: entity.estimatedCost,
      actualCost: entity.actualCost,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Convert domain model to persistence entity (for saving).
   * Returns partial entity - TypeORM will merge with existing.
   */
  static toPersistence(domain: AppointmentDomainModel): Partial<Appointment> {
    const entity: Partial<Appointment> = {
      // State fields
      status: domain.status,
      cancellationReason: domain.cancellationReason ?? undefined,
      cancelledAt: domain.cancelledAt ?? undefined,

      // Update fields
      notes: domain.notes ?? '',
      estimatedCost: domain.estimatedCost ?? 0,
      actualCost: domain.actualCost ?? 0,

      // Reschedule fields
      appointmentDate: domain.appointmentDate,
      startTime: domain.startTime,
      endTime: domain.endTime,
      employeeId: domain.employeeId,
    };

    // Include ID if it exists (for updates)
    if (domain.id !== null) {
      entity.appointmentId = domain.id;
    }

    return entity;
  }

  /**
   * Convert array of entities to domain models
   */
  static toDomainList(entities: Appointment[]): AppointmentDomainModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
