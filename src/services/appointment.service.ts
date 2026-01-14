import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Not,
  FindOptionsWhere,
  DataSource,
  Between,
} from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { AppointmentService as AppointmentServiceEntity } from '../entities/appointment-service.entity';
import { Pet } from '../entities/pet.entity';
import { Employee } from '../entities/employee.entity';
import { Service } from '../entities/service.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment';
import { UserType } from '../entities/account.entity';
import { InvoiceService } from './invoice.service';
import { EmailService } from './email.service';
import {
  OwnershipValidationHelper,
  UserContext,
} from './helpers/ownership-validation.helper';

/**
 * Validated appointment creation data.
 * Result of pre-creation validation to avoid code duplication.
 */
interface ValidatedAppointmentData {
  pet: Pet;
  employee: Employee;
  serviceDetails: Array<{
    service: Service;
    quantity: number;
    notes?: string;
  }>;
  totalEstimatedCost: number;
  appointmentDate: Date;
}

/**
 * AppointmentService
 *
 * Manages appointments with business logic in service layer.
 * Handles appointment lifecycle: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED/CANCELLED.
 *
 * @refactored Phase 1 - Uses OwnershipValidationHelper for pet ownership checks
 */
@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentServiceEntity)
    private readonly appointmentServiceRepository: Repository<AppointmentServiceEntity>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    @Inject(forwardRef(() => InvoiceService))
    private readonly invoiceService: InvoiceService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
    private readonly ownershipHelper: OwnershipValidationHelper,
  ) {}

  // ============================================
  // PRIVATE VALIDATION HELPERS (DRY - Phase 1 Refactoring)
  // ============================================

  /**
   * Validates pet exists and optionally validates ownership for PET_OWNER users.
   * Delegates to shared OwnershipValidationHelper.
   * @throws NotFoundException if pet not found or ownership validation fails
   */
  private async validatePetAndOwnership(
    petId: number,
    user?: UserContext,
  ): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: { petId },
    });
    if (!pet) {
      I18nException.notFound('errors.notFound.pet', { id: petId });
      throw new NotFoundException(`Pet not found`); // Unreachable but for type safety
    }

    // Delegate ownership validation to shared helper
    await this.ownershipHelper.validatePetOwnership(petId, user);

    return pet;
  }

  /**
   * Validates employee exists.
   * @throws NotFoundException if employee not found
   */
  private async validateEmployee(employeeId: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { employeeId },
    });
    if (!employee) {
      I18nException.notFound('errors.notFound.employee', { id: employeeId });
      throw new NotFoundException(`Employee not found`); // Unreachable but for type safety
    }
    return employee;
  }

  /**
   * Validates all services exist and calculates total estimated cost.
   * @throws NotFoundException if any service not found
   */
  private async validateServicesAndCalculateCost(
    services: CreateAppointmentDto['services'],
  ): Promise<{
    serviceDetails: ValidatedAppointmentData['serviceDetails'];
    totalEstimatedCost: number;
  }> {
    const serviceDetails: ValidatedAppointmentData['serviceDetails'] = [];
    let totalEstimatedCost = 0;

    for (const serviceDto of services) {
      const service = await this.serviceRepository.findOne({
        where: { serviceId: serviceDto.serviceId },
      });
      if (!service) {
        I18nException.notFound('errors.notFound.service', {
          id: serviceDto.serviceId,
        });
        throw new NotFoundException(`Service not found`);
      }
      const quantity = serviceDto.quantity || 1;
      totalEstimatedCost += service.basePrice * quantity;
      serviceDetails.push({
        service,
        quantity,
        notes: serviceDto.notes,
      });
    }

    return { serviceDetails, totalEstimatedCost };
  }

  /**
   * Validates time constraints and checks for schedule conflicts.
   * @throws BadRequestException if end time is before start time
   * @throws ConflictException if there's a schedule conflict
   */
  private async validateTimeAndCheckConflicts(
    dto: CreateAppointmentDto,
  ): Promise<Date> {
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

    return appointmentDate;
  }

  /**
   * Orchestrates all appointment creation validations.
   * Single entry point for validation logic - eliminates duplication.
   */
  private async validateAppointmentCreation(
    dto: CreateAppointmentDto,
    user?: { accountId: number; userType: UserType },
  ): Promise<ValidatedAppointmentData> {
    const pet = await this.validatePetAndOwnership(dto.petId, user);
    const employee = await this.validateEmployee(dto.employeeId);
    const { serviceDetails, totalEstimatedCost } =
      await this.validateServicesAndCalculateCost(dto.services);
    const appointmentDate = await this.validateTimeAndCheckConflicts(dto);

    return {
      pet,
      employee,
      serviceDetails,
      totalEstimatedCost,
      appointmentDate,
    };
  }

  /**
   * Saves appointment and related services within a transaction.
   * Single entry point for persistence logic - eliminates duplication.
   */
  private async saveAppointmentWithServices(
    dto: CreateAppointmentDto,
    validatedData: ValidatedAppointmentData,
  ): Promise<Appointment> {
    return await this.dataSource.transaction(async (manager) => {
      // Create appointment
      const appointment = manager.create(Appointment, {
        petId: dto.petId,
        employeeId: dto.employeeId,
        appointmentDate: validatedData.appointmentDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        notes: dto.notes ?? undefined,
        estimatedCost: dto.estimatedCost ?? validatedData.totalEstimatedCost,
        status: AppointmentStatus.PENDING,
      });

      const savedAppointment = await manager.save(Appointment, appointment);

      // Create appointment-service junction records
      for (const { service, quantity, notes } of validatedData.serviceDetails) {
        const appointmentService = manager.create(AppointmentServiceEntity, {
          appointmentId: savedAppointment.appointmentId,
          serviceId: service.serviceId,
          quantity,
          unitPrice: service.basePrice,
          notes: notes ?? null,
        });
        await manager.save(AppointmentServiceEntity, appointmentService);
      }

      // Load and return appointment with services
      const result = await manager.findOne(Appointment, {
        where: { appointmentId: savedAppointment.appointmentId },
        relations: ['appointmentServices', 'appointmentServices.service'],
      });
      if (!result) {
        throw new Error('Failed to load created appointment');
      }
      return result;
    });
  }

  // ============================================
  // APPOINTMENT CRUD
  // ============================================

  /**
   * Creates new appointment with validation.
   * If PET_OWNER, validates they own the pet.
   * Supports multiple services per appointment.
   *
   * @refactored Uses validateAppointmentCreation() and saveAppointmentWithServices() helpers
   */
  async createAppointment(
    dto: CreateAppointmentDto,
    user?: { accountId: number; userType: UserType },
  ): Promise<Appointment> {
    const validatedData = await this.validateAppointmentCreation(dto, user);
    return this.saveAppointmentWithServices(dto, validatedData);
  }

  /**
   * Creates appointment for current user.
   * - PET_OWNER: Validates pet ownership
   * - VET/RECEPTIONIST: Can create appointment for any pet
   *
   * @refactored Uses validateAppointmentCreation() and saveAppointmentWithServices() helpers
   */
  async createMyAppointment(
    dto: CreateAppointmentDto,
    user: { accountId: number; userType: UserType },
  ): Promise<Appointment> {
    const validatedData = await this.validateAppointmentCreation(dto, user);
    return this.saveAppointmentWithServices(dto, validatedData);
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
      relations: ['pet', 'employee', 'appointmentServices', 'pet.owner'],
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
        .leftJoinAndSelect(
          'appointment.appointmentServices',
          'appointmentServices',
        )
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
        'appointmentServices',
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
      .leftJoinAndSelect(
        'appointment.appointmentServices',
        'appointmentServices',
      );

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
        'appointmentServices',
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
      relations: ['employee', 'appointmentServices'],
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
        'appointmentServices',
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
        'appointmentServices',
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
   * Sends email notification to pet owner
   */
  async confirmAppointment(appointmentId: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'appointmentServices',
        'appointmentServices.service',
      ],
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
    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Send confirmation email
    await this.sendAppointmentStatusEmail(
      appointment,
      'CONFIRMED',
      'Lịch hẹn của bạn đã được xác nhận',
    );

    return savedAppointment;
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
   * Automatically generates invoice after completion (FR-028)
   *
   * Uses database transaction to ensure atomic operation:
   * - Both appointment completion AND invoice creation succeed, OR
   * - Both operations rollback on failure
   *
   * @throws NotFoundException if appointment doesn't exist
   * @throws BadRequestException if appointment is not IN_PROGRESS
   * @throws ConflictException if invoice already exists
   */
  async completeAppointment(
    appointmentId: number,
    actualCost?: number,
  ): Promise<Appointment> {
    // Use QueryRunner for transactional control
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Load appointment with service relation for pricing
      const appointment = await queryRunner.manager.findOne(Appointment, {
        where: { appointmentId },
        relations: ['appointmentServices'],
      });

      if (!appointment) {
        I18nException.notFound('errors.notFound.appointment', {
          id: appointmentId,
        });
      }

      if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
        I18nException.badRequest('errors.badRequest.canOnlyCompleteInProgress');
      }

      // Update appointment status
      appointment.status = AppointmentStatus.COMPLETED;
      if (actualCost !== undefined) {
        appointment.actualCost = actualCost;
      }
      const completedAppointment = await queryRunner.manager.save(appointment);

      // Delegate to InvoiceService (Single Responsibility Principle)
      await this.invoiceService.createInvoice(
        {
          appointmentId,
          notes: `Auto-generated for completed appointment ${appointmentId}`,
        },
        queryRunner.manager, // Pass transaction manager for atomic operation
      );

      // Commit transaction - both operations succeeded
      await queryRunner.commitTransaction();
      return completedAppointment;
    } catch (error) {
      // Rollback transaction on any failure
      await queryRunner.rollbackTransaction();
      throw error; // Re-throw to maintain error contract
    } finally {
      // Release database connection
      await queryRunner.release();
    }
  }

  /**
   * Cancels appointment (PENDING/CONFIRMED → CANCELLED)
   * Uses shared helper for ownership validation (Phase 1).
   */
  async cancelAppointment(
    appointmentId: number,
    reason?: string,
    user?: UserContext,
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

    // Use shared helper for ownership validation (Phase 1)
    await this.ownershipHelper.validateAppointmentOwnership(appointment, user);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      I18nException.badRequest('errors.badRequest.cannotCancelCompleted');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      I18nException.badRequest('errors.badRequest.alreadyCancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = reason ?? null;
    appointment.cancelledAt = new Date();
    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Load relations for email if not already loaded
    const appointmentWithRelations = await this.appointmentRepository.findOne({
      where: { appointmentId },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'appointmentServices',
        'appointmentServices.service',
      ],
    });

    // Send cancellation email
    if (appointmentWithRelations) {
      await this.sendAppointmentStatusEmail(
        appointmentWithRelations,
        'CANCELLED',
        reason ? `Lịch hẹn đã bị hủy. Lý do: ${reason}` : 'Lịch hẹn đã bị hủy',
      );
    }

    return savedAppointment;
  }

  /**
   * Helper method to send appointment status update email
   */
  private async sendAppointmentStatusEmail(
    appointment: Appointment,
    status: string,
    statusMessage: string,
  ): Promise<void> {
    try {
      if (appointment.pet?.owner?.account?.email) {
        const appointmentDate = new Date(appointment.appointmentDate);
        const formattedDate = appointmentDate.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        const services =
          appointment.appointmentServices
            ?.map((as) => as.service?.serviceName)
            .filter(Boolean)
            .join(', ') || 'Dịch vụ';

        this.emailService
          .sendAppointmentStatusUpdateEmail(
            appointment.pet.owner.account.email,
            {
              ownerName: appointment.pet.owner.fullName,
              petName: appointment.pet.name,
              serviceName: services,
              appointmentDate: formattedDate,
              appointmentTime: appointment.startTime,
              status,
              statusMessage,
            },
          )
          .catch((err) =>
            this.logger.warn(`[EMAIL] Status email failed: ${err}`),
          );

        this.logger.log(
          `[EMAIL] Status update email sent for appointment ${appointment.appointmentId}`,
        );
      }
    } catch (error) {
      // Log but don't fail the operation if email fails
      this.logger.error(
        `[EMAIL] Failed to send status email for appointment ${appointment.appointmentId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
      .leftJoinAndSelect(
        'appointment.appointmentServices',
        'appointmentServices',
      )
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

  /**
   * Sends email reminders for upcoming appointments
   * Runs daily at 9:00 AM
   */
  @Cron('0 9 * * *')
  async sendAppointmentReminders(): Promise<void> {
    this.logger.log('[CRON] Starting appointment reminder job');

    try {
      // Get appointments for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const upcomingAppointments = await this.appointmentRepository.find({
        where: {
          appointmentDate: Between(tomorrow, dayAfterTomorrow),
          status: AppointmentStatus.CONFIRMED,
        },
        relations: [
          'pet',
          'pet.owner',
          'pet.owner.account',
          'appointmentServices',
          'appointmentServices.service',
        ],
      });

      this.logger.log(
        `[CRON] Found ${upcomingAppointments.length} appointments for reminders`,
      );

      for (const appointment of upcomingAppointments) {
        try {
          if (appointment.pet?.owner?.account?.email) {
            // Convert string date to Date object for formatting
            const appointmentDate = new Date(appointment.appointmentDate);
            const formattedDate = appointmentDate.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });

            const services =
              appointment.appointmentServices
                ?.map((as) => as.service?.serviceName)
                .filter(Boolean)
                .join(', ') || 'Dịch vụ';

            this.emailService
              .sendAppointmentReminderEmail(
                appointment.pet.owner.account.email,
                {
                  ownerName: appointment.pet.owner.fullName,
                  petName: appointment.pet.name,
                  serviceName: services,
                  appointmentDate: formattedDate,
                  appointmentTime: appointment.startTime,
                },
              )
              .catch((err) =>
                this.logger.warn(`[EMAIL] Reminder failed: ${err}`),
              );

            this.logger.log(
              `[CRON] Reminder sent for appointment ${appointment.appointmentId}`,
            );
          }
        } catch (emailError) {
          this.logger.error(
            `[CRON] Failed to send reminder for appointment ${appointment.appointmentId}: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
            emailError instanceof Error ? emailError.stack : undefined,
          );
        }
      }

      this.logger.log('[CRON] Appointment reminder job completed');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `[CRON] Appointment reminder job failed: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
