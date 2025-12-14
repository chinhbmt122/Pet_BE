import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../entities/pet.entity';
import { Employee } from '../entities/employee.entity';
import { Service } from '../entities/service.entity';
import { AppointmentDomainModel } from '../domain/appointment.domain';

/**
 * Input DTO for creating appointments
 */
export interface CreateAppointmentInput {
  petId: number;
  employeeId: number;
  serviceId: number;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  notes?: string;
  estimatedCost?: number;
}

/**
 * AppointmentFactory
 *
 * Factory for creating appointments with cross-entity validation.
 * Validates that Pet, Employee, and Service exist before creating.
 *
 * Features:
 * - Cross-entity validation (async DB checks)
 * - Time ordering validation
 * - Uses AppointmentDomainModel.create() internally
 *
 * @see Story 4-3: Appointment Factory
 */
@Injectable()
export class AppointmentFactory {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  /**
   * Creates a new appointment with validated references.
   * Validates that pet, employee, and service exist before creating.
   *
   * @param input - Appointment creation input
   * @returns AppointmentDomainModel with PENDING status
   * @throws NotFoundException if pet/employee/service not found
   * @throws BadRequestException if time ordering is invalid
   */
  async createAppointment(
    input: CreateAppointmentInput,
  ): Promise<AppointmentDomainModel> {
    // 1. Validate time ordering
    this.validateTimeOrder(input.startTime, input.endTime);

    // 2. Validate references exist (async DB checks)
    await this.validateReferences(input);

    // 3. Create domain model via static factory
    return AppointmentDomainModel.create({
      petId: input.petId,
      employeeId: input.employeeId,
      serviceId: input.serviceId,
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes,
      estimatedCost: input.estimatedCost,
    });
  }

  /**
   * Validates time ordering (end must be after start)
   */
  private validateTimeOrder(startTime: string, endTime: string): void {
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  /**
   * Validates that referenced entities exist in database
   */
  private async validateReferences(
    input: CreateAppointmentInput,
  ): Promise<void> {
    // Check pet exists
    const pet = await this.petRepository.findOne({
      where: { petId: input.petId },
    });
    if (!pet) {
      throw new NotFoundException(`Pet with ID ${input.petId} not found`);
    }

    // Check employee exists
    const employee = await this.employeeRepository.findOne({
      where: { employeeId: input.employeeId },
    });
    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${input.employeeId} not found`,
      );
    }

    // Check service exists
    const service = await this.serviceRepository.findOne({
      where: { serviceId: input.serviceId },
    });
    if (!service) {
      throw new NotFoundException(
        `Service with ID ${input.serviceId} not found`,
      );
    }
  }
}
