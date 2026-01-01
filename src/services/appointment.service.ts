import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindOptionsWhere } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Pet } from '../entities/pet.entity';
import { Employee } from '../entities/employee.entity';
import { Service } from '../entities/service.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment';
import { UserType } from '../entities/account.entity';

/**
 * AppointmentService (Pure Anemic Pattern)
 *
 * Manages appointments with business logic in service layer.
 * Handles appointment lifecycle: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED/CANCELLED.
 */
@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
  ) {}

  // ============================================
  // APPOINTMENT CRUD
  // ============================================

  /**
   * Creates new appointment with validation.
   * If PET_OWNER, validates they own the pet.
   */
  async createAppointment(
    dto: CreateAppointmentDto,
    user?: { accountId: number; userType: UserType },
  ): Promise<Appointment> {
    // Validate pet exists
    const pet = await this.petRepository.findOne({
      where: { petId: dto.petId },
    });
    if (!pet) {
      I18nException.notFound('errors.notFound.pet', { id: dto.petId });
    }

    // If PET_OWNER, validate they own the pet
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!petOwner || pet.ownerId !== petOwner.petOwnerId) {
        I18nException.notFound('errors.notFound.pet', { id: dto.petId });
      }
    }

    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { employeeId: dto.employeeId },
    });
    if (!employee) {
      I18nException.notFound('errors.notFound.employee', {
        id: dto.employeeId,
      });
    }

    // Validate service exists
    const service = await this.serviceRepository.findOne({
      where: { serviceId: dto.serviceId },
    });
    if (!service) {
      I18nException.notFound('errors.notFound.service', { id: dto.serviceId });
    }

    // Validate time (end must be after start)
    if (dto.endTime <= dto.startTime) {
      I18nException.badRequest('errors.badRequest.endTimeAfterStartTime');
    }

    // Check for schedule conflicts
    const appointmentDate = new Date(dto.appointmentDate);
    const conflict = await this.appointmentRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        appointmentDate,
        status: Not(AppointmentStatus.CANCELLED),
      },
    });

    if (conflict) {
      // Check time overlap
      if (
        (dto.startTime >= conflict.startTime &&
          dto.startTime < conflict.endTime) ||
        (dto.endTime > conflict.startTime && dto.endTime <= conflict.endTime) ||
        (dto.startTime <= conflict.startTime && dto.endTime >= conflict.endTime)
      ) {
        I18nException.conflict('errors.badRequest.conflictingAppointment', {
          time: `${conflict.startTime} - ${conflict.endTime}`,
        });
      }
    }

    // Create appointment
    const appointment = this.appointmentRepository.create({
      petId: dto.petId,
      employeeId: dto.employeeId,
      serviceId: dto.serviceId,
      appointmentDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      notes: dto.notes ?? undefined,
      estimatedCost: dto.estimatedCost ?? service.basePrice,
      status: AppointmentStatus.PENDING,
    });

    return this.appointmentRepository.save(appointment);
  }

  /**
   * Creates appointment for current user.
   * - PET_OWNER: Validates pet ownership
   * - VET/RECEPTIONIST: Can create appointment for any pet
   */
  async createMyAppointment(
    dto: CreateAppointmentDto,
    user: { accountId: number; userType: UserType },
  ): Promise<Appointment> {
    // Validate pet exists
    const pet = await this.petRepository.findOne({
      where: { petId: dto.petId },
    });
    if (!pet) {
      I18nException.notFound('errors.notFound.pet', { id: dto.petId });
    }

    // If PET_OWNER, validate they own the pet
    if (user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!petOwner) {
        I18nException.notFound('errors.notFound.owner');
      }
      if (pet.ownerId !== petOwner.petOwnerId) {
        I18nException.notFound('errors.notFound.pet', { id: dto.petId });
      }
    }
    // VET, RECEPTIONIST, and other staff can create appointments for any pet

    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { employeeId: dto.employeeId },
    });
    if (!employee) {
      I18nException.notFound('errors.notFound.employee', {
        id: dto.employeeId,
      });
    }

    // Validate service exists
    const service = await this.serviceRepository.findOne({
      where: { serviceId: dto.serviceId },
    });
    if (!service) {
      I18nException.notFound('errors.notFound.service', { id: dto.serviceId });
    }

    // Validate time (end must be after start)
    if (dto.endTime <= dto.startTime) {
      I18nException.badRequest('errors.badRequest.endTimeAfterStartTime');
    }

    // Check for schedule conflicts
    const appointmentDate = new Date(dto.appointmentDate);
    const conflict = await this.appointmentRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        appointmentDate,
        status: Not(AppointmentStatus.CANCELLED),
      },
    });

    if (conflict) {
      // Check time overlap
      if (
        (dto.startTime >= conflict.startTime &&
          dto.startTime < conflict.endTime) ||
        (dto.endTime > conflict.startTime && dto.endTime <= conflict.endTime) ||
        (dto.startTime <= conflict.startTime && dto.endTime >= conflict.endTime)
      ) {
        I18nException.conflict('errors.badRequest.conflictingAppointment', {
          time: `${conflict.startTime} - ${conflict.endTime}`,
        });
      }
    }

    // Create appointment
    const appointment = this.appointmentRepository.create({
      petId: dto.petId,
      employeeId: dto.employeeId,
      serviceId: dto.serviceId,
      appointmentDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      notes: dto.notes ?? undefined,
      estimatedCost: dto.estimatedCost ?? service.basePrice,
      status: AppointmentStatus.PENDING,
    });

    return this.appointmentRepository.save(appointment);
  }

  /**
   * Updates appointment details
   */
  async updateAppointment(
    appointmentId: number,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
    });
    if (!appointment) {
      I18nException.notFound('errors.notFound.appointment', {
        id: appointmentId,
      });
    }

    // Validate employee if being updated
    if (dto.employeeId && dto.employeeId !== appointment.employeeId) {
      const employee = await this.employeeRepository.findOne({
        where: { employeeId: dto.employeeId },
      });
      if (!employee) {
        I18nException.notFound('errors.notFound.employee', {
          id: dto.employeeId,
        });
      }
    }

    // Validate time if being updated
    const startTime = dto.startTime ?? appointment.startTime;
    const endTime = dto.endTime ?? appointment.endTime;
    if (endTime <= startTime) {
      I18nException.badRequest('errors.badRequest.endTimeAfterStartTime');
    }

    Object.assign(appointment, dto);
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Gets appointment by ID
   * If user is PET_OWNER, validates they own the pet
   */
  async getAppointmentById(
    appointmentId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
      relations: ['pet', 'employee', 'service', 'pet.owner'],
    });
    if (!appointment) {
      I18nException.notFound('errors.notFound.appointment', {
        id: appointmentId,
      });
    }

    // If PET_OWNER, validate ownership
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!petOwner || appointment.pet?.ownerId !== petOwner.petOwnerId) {
        I18nException.notFound('errors.notFound.appointment', {
          id: appointmentId,
        });
      }
    }

    return appointment;
  }

  /**
   * Gets all appointments with optional filters
   * If user is PET_OWNER, returns only their pet's appointments
   */
  async getAllAppointments(
    user?: { accountId: number; userType: UserType },
    filters?: {
      status?: AppointmentStatus;
      petId?: number;
      employeeId?: number;
      date?: Date;
    },
  ): Promise<Appointment[]> {
    // If PET_OWNER, filter to only their pets' appointments
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
        relations: ['pets'],
      });
      if (!petOwner || !petOwner.pets?.length) {
        return [];
      }
      const petIds = petOwner.pets.map((pet) => pet.petId);

      const qb = this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.pet', 'pet')
        .leftJoinAndSelect('pet.owner', 'owner')
        .leftJoinAndSelect('appointment.employee', 'employee')
        .leftJoinAndSelect('appointment.service', 'service')
        .where('appointment.petId IN (:...petIds)', { petIds });

      // Apply filters
      if (filters?.status) {
        qb.andWhere('appointment.status = :status', { status: filters.status });
      }
      if (filters?.petId) {
        qb.andWhere('appointment.petId = :petId', { petId: filters.petId });
      }
      if (filters?.employeeId) {
        qb.andWhere('appointment.employeeId = :employeeId', {
          employeeId: filters.employeeId,
        });
      }
      if (filters?.date) {
        qb.andWhere('appointment.appointmentDate = :date', {
          date: filters.date,
        });
      }

      return qb
        .orderBy('appointment.appointmentDate', 'DESC')
        .addOrderBy('appointment.startTime', 'ASC')
        .getMany();
    }

    // Staff sees all with filters
    const where: FindOptionsWhere<Appointment> = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.petId) {
      where.petId = filters.petId;
    }
    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters?.date) {
      where.appointmentDate = filters.date;
    }

    return this.appointmentRepository.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: [
        'pet',
        'employee',
        'service',
        'pet.owner',
        'pet.owner.account',
      ],
      order: { appointmentDate: 'DESC', startTime: 'ASC' },
    });
  }

  /**
   * Gets appointments for the current user
   * - PET_OWNER: Returns appointments for their pets
   * - VET/CARE_STAFF: Returns appointments assigned to them
   * - RECEPTIONIST/MANAGER: Returns all appointments
   */
  async getMyAppointments(
    user: { accountId: number; userType: UserType },
    status?: AppointmentStatus,
  ): Promise<Appointment[]> {
    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('pet.owner', 'owner')
      .leftJoinAndSelect('appointment.employee', 'employee')
      .leftJoinAndSelect('appointment.service', 'service');

    // PET_OWNER: Only their pets' appointments
    if (user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
        relations: ['pets'],
      });
      if (!petOwner || !petOwner.pets?.length) {
        return [];
      }
      const petIds = petOwner.pets.map((pet) => pet.petId);
      qb.where('appointment.petId IN (:...petIds)', { petIds });
    }
    // VET/CARE_STAFF: Only appointments assigned to them
    else if (
      user.userType === UserType.VETERINARIAN ||
      user.userType === UserType.CARE_STAFF
    ) {
      const employee = await this.employeeRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!employee) {
        return [];
      }
      qb.where('appointment.employeeId = :employeeId', {
        employeeId: employee.employeeId,
      });
    }
    // RECEPTIONIST/MANAGER: All appointments (no filter needed)

    if (status) {
      qb.andWhere('appointment.status = :status', { status });
    }

    return qb
      .orderBy('appointment.appointmentDate', 'DESC')
      .addOrderBy('appointment.startTime', 'ASC')
      .getMany();
  }

  /**
   * Gets appointments by status
   */
  async getAppointmentsByStatus(
    status: AppointmentStatus,
  ): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { status },
      relations: [
        'pet',
        'employee',
        'service',
        'pet.owner',
        'pet.owner.account',
      ],
      order: { appointmentDate: 'DESC', startTime: 'ASC' },
    });
  }

  /**
   * Gets appointments by pet ID
   */
  async getAppointmentsByPet(petId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { petId },
      relations: ['employee', 'service'],
      order: { appointmentDate: 'DESC', startTime: 'ASC' },
    });
  }

  /**
   * Gets appointments by employee ID.
   * VET/CARE_STAFF can only see their own appointments.
   */
  async getAppointmentsByEmployee(
    employeeId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<Appointment[]> {
    // VET/CARE_STAFF can only see their own appointments
    if (
      user &&
      (user.userType === UserType.VETERINARIAN ||
        user.userType === UserType.CARE_STAFF)
    ) {
      const employee = await this.employeeRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!employee || employee.employeeId !== employeeId) {
        I18nException.notFound('errors.notFound.resource');
      }
    }

    return this.appointmentRepository.find({
      where: { employeeId },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'service',
        'employee',
      ],
      order: { appointmentDate: 'DESC', startTime: 'ASC' },
    });
  }

  /**
   * Gets appointments by date
   */
  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { appointmentDate: date },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'employee',
        'service',
      ],
      order: { startTime: 'ASC' },
    });
  }

  /**
   * Deletes appointment (only if pending)
   */
  async deleteAppointment(appointmentId: number): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
    });
    if (!appointment) {
      I18nException.notFound('errors.notFound.appointment', {
        id: appointmentId,
      });
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      I18nException.badRequest('errors.badRequest.canOnlyDeletePending');
    }

    await this.appointmentRepository.remove(appointment);
  }

  // ============================================
  // STATE TRANSITIONS
  // ============================================

  /**
   * Confirms appointment (PENDING → CONFIRMED)
   */
  async confirmAppointment(appointmentId: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
    });
    if (!appointment) {
      I18nException.notFound('errors.notFound.appointment', {
        id: appointmentId,
      });
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      I18nException.badRequest('errors.badRequest.canOnlyConfirmPending');
    }

    appointment.status = AppointmentStatus.CONFIRMED;
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Starts appointment (CONFIRMED → IN_PROGRESS)
   */
  async startAppointment(appointmentId: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
    });
    if (!appointment) {
      I18nException.notFound('errors.notFound.appointment', {
        id: appointmentId,
      });
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      I18nException.badRequest('errors.badRequest.canOnlyStartConfirmed');
    }

    appointment.status = AppointmentStatus.IN_PROGRESS;
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Completes appointment (IN_PROGRESS → COMPLETED)
   */
  async completeAppointment(
    appointmentId: number,
    actualCost?: number,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
    });
    if (!appointment) {
      I18nException.notFound('errors.notFound.appointment', {
        id: appointmentId,
      });
    }

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      I18nException.badRequest('errors.badRequest.canOnlyCompleteInProgress');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    if (actualCost !== undefined) {
      appointment.actualCost = actualCost;
    }
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Cancels appointment (any status → CANCELLED)
   * If PET_OWNER, validates they own the pet.
   */
  async cancelAppointment(
    appointmentId: number,
    reason?: string,
    user?: { accountId: number; userType: UserType },
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
      relations: ['pet'],
    });
    if (!appointment) {
      I18nException.notFound('errors.notFound.appointment', {
        id: appointmentId,
      });
    }

    // If PET_OWNER, validate ownership
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!petOwner || appointment.pet?.ownerId !== petOwner.petOwnerId) {
        I18nException.notFound('errors.notFound.appointment', {
          id: appointmentId,
        });
      }
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      I18nException.badRequest('errors.badRequest.cannotCancelCompleted');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      I18nException.badRequest('errors.badRequest.alreadyCancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = reason ?? null;
    appointment.cancelledAt = new Date();
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Gets appointments by date range
   */
  async getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date,
    employeeId?: number,
  ): Promise<Appointment[]> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.employee', 'employee')
      .leftJoinAndSelect('appointment.service', 'service')
      .where('appointment.appointmentDate >= :startDate', { startDate })
      .andWhere('appointment.appointmentDate <= :endDate', { endDate });

    if (employeeId) {
      queryBuilder.andWhere('appointment.employeeId = :employeeId', {
        employeeId,
      });
    }

    return queryBuilder
      .orderBy('appointment.appointmentDate', 'ASC')
      .addOrderBy('appointment.startTime', 'ASC')
      .getMany();
  }
}
