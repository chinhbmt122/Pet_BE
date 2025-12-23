import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindOptionsWhere } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Pet } from '../entities/pet.entity';
import { Employee } from '../entities/employee.entity';
import { Service } from '../entities/service.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment';

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
  ) {}

  // ============================================
  // APPOINTMENT CRUD
  // ============================================

  /**
   * Creates new appointment with validation
   */
  async createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
    // Validate pet exists
    const pet = await this.petRepository.findOne({
      where: { petId: dto.petId },
    });
    if (!pet) {
      throw new NotFoundException(`Pet with ID ${dto.petId} not found`);
    }

    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { employeeId: dto.employeeId },
    });
    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${dto.employeeId} not found`,
      );
    }

    // Validate service exists
    const service = await this.serviceRepository.findOne({
      where: { serviceId: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${dto.serviceId} not found`);
    }

    // Validate time (end must be after start)
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('End time must be after start time');
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
        throw new ConflictException(
          `Employee has a conflicting appointment at ${conflict.startTime} - ${conflict.endTime}`,
        );
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
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }

    // Validate employee if being updated
    if (dto.employeeId && dto.employeeId !== appointment.employeeId) {
      const employee = await this.employeeRepository.findOne({
        where: { employeeId: dto.employeeId },
      });
      if (!employee) {
        throw new NotFoundException(
          `Employee with ID ${dto.employeeId} not found`,
        );
      }
    }

    // Validate time if being updated
    const startTime = dto.startTime ?? appointment.startTime;
    const endTime = dto.endTime ?? appointment.endTime;
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    Object.assign(appointment, dto);
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Gets appointment by ID
   */
  async getAppointmentById(appointmentId: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
      relations: ['pet', 'employee', 'service'],
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }
    return appointment;
  }

  /**
   * Gets all appointments with optional filters
   */
  async getAllAppointments(filters?: {
    status?: AppointmentStatus;
    petId?: number;
    employeeId?: number;
    date?: Date;
  }): Promise<Appointment[]> {
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
      relations: ['pet', 'employee', 'service'],
      order: { appointmentDate: 'DESC', startTime: 'ASC' },
    });
  }

  /**
   * Gets appointments by status
   */
  async getAppointmentsByStatus(
    status: AppointmentStatus,
  ): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { status },
      relations: ['pet', 'employee', 'service'],
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
   * Gets appointments by employee ID
   */
  async getAppointmentsByEmployee(employeeId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { employeeId },
      relations: ['pet', 'service'],
      order: { appointmentDate: 'DESC', startTime: 'ASC' },
    });
  }

  /**
   * Gets appointments by date
   */
  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { appointmentDate: date },
      relations: ['pet', 'employee', 'service'],
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
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Can only delete pending appointments');
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
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Can only confirm pending appointments');
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
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Can only start confirmed appointments');
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
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Can only complete in-progress appointments',
      );
    }

    appointment.status = AppointmentStatus.COMPLETED;
    if (actualCost !== undefined) {
      appointment.actualCost = actualCost;
    }
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Cancels appointment (any status → CANCELLED)
   */
  async cancelAppointment(
    appointmentId: number,
    reason?: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed appointments');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
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
