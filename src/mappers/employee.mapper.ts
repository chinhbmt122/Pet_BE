/**
 * Employee Mapper
 *
 * Bidirectional mapping between Employee hierarchy (persistence) and domain models.
 * Handles polymorphic conversion based on role discriminator.
 *
 * @see epics.md → ADR-001, ADR-003 (Inheritance, Polymorphism, Data Mapper)
 */

import { Employee } from '../entities/employee.entity';
import { Veterinarian } from '../entities/veterinarian.entity';
import { CareStaff } from '../entities/care-staff.entity';
import { Manager } from '../entities/manager.entity';
import { Receptionist } from '../entities/receptionist.entity';
import {
  EmployeeDomainModel,
  VeterinarianDomainModel,
  CareStaffDomainModel,
  ManagerDomainModel,
  ReceptionistDomainModel,
  EmployeeRole,
} from '../domain/employee.domain';

export class EmployeeMapper {
  /**
   * Convert persistence entity to domain model (polymorphic)
   */
  static toDomain(entity: Employee): EmployeeDomainModel {
    // Determine type based on instanceof or discriminator
    if (entity instanceof Veterinarian) {
      return VeterinarianDomainModel.reconstitute({
        employeeId: entity.employeeId,
        accountId: entity.accountId,
        fullName: entity.fullName,
        phoneNumber: entity.phoneNumber,
        address: entity.address,
        hireDate: entity.hireDate,
        salary: Number(entity.salary),
        isAvailable: entity.isAvailable,
        createdAt: entity.createdAt,
        licenseNumber: entity.licenseNumber,
        expertise: entity.expertise,
      });
    }

    if (entity instanceof CareStaff) {
      return CareStaffDomainModel.reconstitute({
        employeeId: entity.employeeId,
        accountId: entity.accountId,
        fullName: entity.fullName,
        phoneNumber: entity.phoneNumber,
        address: entity.address,
        hireDate: entity.hireDate,
        salary: Number(entity.salary),
        isAvailable: entity.isAvailable,
        createdAt: entity.createdAt,
        skills: entity.skills ?? [],
      });
    }

    if (entity instanceof Manager) {
      return ManagerDomainModel.reconstitute({
        employeeId: entity.employeeId,
        accountId: entity.accountId,
        fullName: entity.fullName,
        phoneNumber: entity.phoneNumber,
        address: entity.address,
        hireDate: entity.hireDate,
        salary: Number(entity.salary),
        isAvailable: entity.isAvailable,
        createdAt: entity.createdAt,
      });
    }

    if (entity instanceof Receptionist) {
      return ReceptionistDomainModel.reconstitute({
        employeeId: entity.employeeId,
        accountId: entity.accountId,
        fullName: entity.fullName,
        phoneNumber: entity.phoneNumber,
        address: entity.address,
        hireDate: entity.hireDate,
        salary: Number(entity.salary),
        isAvailable: entity.isAvailable,
        createdAt: entity.createdAt,
      });
    }

    throw new Error(
      `Unknown employee type for entity with id ${entity.employeeId}`,
    );
  }

  /**
   * Convert domain model to persistence entity (polymorphic)
   * Returns partial entity for TypeORM save/update.
   *
   * Note: createdAt is NOT included because TypeORM manages it
   * automatically via @CreateDateColumn decorator.
   */
  static toPersistence(domain: EmployeeDomainModel): Partial<Employee> {
    const base: Partial<Employee> = {
      accountId: domain.accountId,
      fullName: domain.fullName,
      phoneNumber: domain.phoneNumber,
      address: domain.address ?? undefined,
      hireDate: domain.hireDate,
      salary: domain.salary,
      isAvailable: domain.isEmployeeAvailable(),
    };

    if (domain.employeeId !== null) {
      base.employeeId = domain.employeeId;
    }

    // Add role-specific fields
    if (domain instanceof VeterinarianDomainModel) {
      return {
        ...base,
        licenseNumber: domain.licenseNumber,
        expertise: domain.expertise,
      } as Partial<Veterinarian>;
    }

    if (domain instanceof CareStaffDomainModel) {
      return {
        ...base,
        skills: domain.skills,
      } as Partial<CareStaff>;
    }

    // Manager and Receptionist have no extra fields
    return base;
  }

  /**
   * Get the entity class for a given role
   */
  static getEntityClass(role: EmployeeRole): typeof Employee {
    switch (role) {
      case 'VETERINARIAN':
        return Veterinarian;
      case 'CARE_STAFF':
        return CareStaff;
      case 'MANAGER':
        return Manager;
      case 'RECEPTIONIST':
        return Receptionist;
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }

  /**
   * Convert array of entities to domain models
   */
  static toDomainList(entities: Employee[]): EmployeeDomainModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
