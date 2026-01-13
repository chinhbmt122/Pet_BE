import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindOptionsWhere, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { AppointmentService as AppointmentServiceEntity } from '../entities/appointment-service.entity';
import { Pet } from '../entities/pet.entity';
import { Employee } from '../entities/employee.entity';
import { Service } from '../entities/service.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment';
import { UserType } from '../entities/account.entity';
import { EmailService } from './email.service';

/**
 * AppointmentService (Pure Anemic Pattern)
 *
 * Manages appointments with business logic in service layer.
 * Handles appointment lifecycle: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED/CANCELLED.
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
    private readonly emailService: EmailService,
  ) {}

  // ============================================
  // APPOINTMENT CRUD
  // ============================================

  /**
   * Creates new appointment with validation.
   * If PET_OWNER, validates they own the pet.
   * Supports both legacy serviceId and new services array.
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

    // Prepare services array - support both legacy and new format
    let servicesToCreate = dto.services || [];
    
    // Backward compatibility: if serviceId provided but no services array, use legacy format
    if (dto.serviceId && (!dto.services || dto.services.length === 0)) {
      servicesToCreate = [{ serviceId: dto.serviceId, quantity: 1, notes: undefined }];
    }

    // Validate we have at least one service
    if (servicesToCreate.length === 0) {
      I18nException.badRequest('errors.badRequest.noServices');
    }

    // Validate all services exist and calculate total cost
    let totalEstimatedCost = 0;
    const validatedServices: Array<{ serviceId: number; quantity: number; notes?: string; service: Service }> = [];
    
    for (const serviceItem of servicesToCreate) {
      const service = await this.serviceRepository.findOne({
        where: { serviceId: serviceItem.serviceId },
      });
      if (!service) {
        I18nException.notFound('errors.notFound.service', { id: serviceItem.serviceId });
      }
      totalEstimatedCost += service.basePrice * serviceItem.quantity;
      validatedServices.push({ ...serviceItem, service });
    }

    // Legacy: For backward compatibility, set first service as main service
    const firstService = validatedServices[0].service;

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

    // Create appointment (keep serviceId for backward compatibility)
    const appointment = this.appointmentRepository.create({
      petId: dto.petId,
      employeeId: dto.employeeId,
      serviceId: firstService.serviceId, // Legacy field
      appointmentDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      notes: dto.notes ?? undefined,
      estimatedCost: dto.estimatedCost ?? totalEstimatedCost,
      status: AppointmentStatus.PENDING,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Create appointment services (multi-service support)
    const appointmentServices = validatedServices.map(item =>
      this.appointmentServiceRepository.create({
        appointmentId: savedAppointment.appointmentId,
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitPrice: item.service.basePrice,
        notes: item.notes || null,
      }),
    );

    await this.appointmentServiceRepository.save(appointmentServices);

    return savedAppointment;
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

    // Prepare services array - support both legacy and new format
    let servicesToCreate = dto.services || [];
    
    // Backward compatibility: if serviceId provided but no services array, use legacy format
    if (dto.serviceId && (!dto.services || dto.services.length === 0)) {
      servicesToCreate = [{ serviceId: dto.serviceId, quantity: 1, notes: undefined }];
    }

    // Validate we have at least one service
    if (servicesToCreate.length === 0) {
      I18nException.badRequest('errors.badRequest.noServices');
    }

    // Validate all services exist and calculate total cost
    let totalEstimatedCost = 0;
    const validatedServices: Array<{ serviceId: number; quantity: number; notes?: string; service: Service }> = [];
    
    for (const serviceItem of servicesToCreate) {
      const service = await this.serviceRepository.findOne({
        where: { serviceId: serviceItem.serviceId },
      });
      if (!service) {
        I18nException.notFound('errors.notFound.service', { id: serviceItem.serviceId });
      }
      totalEstimatedCost += service.basePrice * serviceItem.quantity;
      validatedServices.push({ ...serviceItem, service });
    }

    // Legacy: For backward compatibility, set first service as main service
    const firstService = validatedServices[0].service;

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

    // Create appointment (keep serviceId for backward compatibility)
    const appointment = this.appointmentRepository.create({
      petId: dto.petId,
      employeeId: dto.employeeId,
      serviceId: firstService.serviceId, // Legacy field
      appointmentDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      notes: dto.notes ?? undefined,
      estimatedCost: dto.estimatedCost ?? totalEstimatedCost,
      status: AppointmentStatus.PENDING,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Create appointment services (multi-service support)
    const appointmentServices = validatedServices.map(item =>
      this.appointmentServiceRepository.create({
        appointmentId: savedAppointment.appointmentId,
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitPrice: item.service.basePrice,
        notes: item.notes || null,
      }),
    );

    await this.appointmentServiceRepository.save(appointmentServices);

    return savedAppointment;
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
    console.log('============================================');
    console.log(`CONFIRM APPOINTMENT #${appointmentId} - START`);
    console.log('============================================');
    
    this.logger.log(`[CONFIRM] ===== METHOD CALLED for appointment ${appointmentId} =====`);
    
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'employee',
        'service',
      ],
    });
    
    this.logger.log(`[CONFIRM] Appointment loaded: ${appointment ? 'EXISTS' : 'NULL'}`);
    
    this.logger.log(`[CONFIRM] Appointment loaded: ${appointment ? 'EXISTS' : 'NULL'}`);
    if (!appointment) {
      this.logger.error(`[CONFIRM] Appointment ${appointmentId} not found!`);
      I18nException.notFound('errors.notFound.appointment', {
        id: appointmentId,
      });
    }

    this.logger.log(`[CONFIRM] Current status: ${appointment.status}`);
    if (appointment.status !== AppointmentStatus.PENDING) {
      this.logger.warn(`[CONFIRM] Cannot confirm - status is ${appointment.status}, not PENDING`);
      I18nException.badRequest('errors.badRequest.canOnlyConfirmPending');
    }

    this.logger.log(`[CONFIRM] Changing status from ${appointment.status} to CONFIRMED`);
    const oldStatus = appointment.status;
    appointment.status = AppointmentStatus.CONFIRMED;
    const savedAppointment = await this.appointmentRepository.save(appointment);
    this.logger.log(`[CONFIRM] Status saved successfully`);

    // Send confirmation email
    this.logger.log(`[CONFIRM] Starting email sending for appointment ${appointmentId}`);
    this.logger.log(`[CONFIRM] Pet: ${appointment.pet ? 'EXISTS' : 'NULL'}`);
    this.logger.log(`[CONFIRM] Owner: ${appointment.pet?.owner ? 'EXISTS' : 'NULL'}`);
    this.logger.log(`[CONFIRM] Account: ${appointment.pet?.owner?.account ? 'EXISTS' : 'NULL'}`);
    
    try {
      if (appointment.pet?.owner?.account) {
        const ownerEmail = appointment.pet.owner.account.email;
        this.logger.log(`[CONFIRM] Sending email to: ${ownerEmail}`);
        
        // Format date properly
        const appointmentDate = new Date(appointment.appointmentDate);
        const formattedDate = appointmentDate.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        this.logger.log(`[CONFIRM] Formatted date: ${formattedDate}`);
        
        await this.emailService.sendAppointmentStatusUpdateEmail(
          ownerEmail,
          {
            ownerName: appointment.pet.owner.fullName,
            petName: appointment.pet.name,
            serviceName: appointment.service.serviceName,
            appointmentDate: formattedDate,
            appointmentTime: appointment.startTime,
            status: AppointmentStatus.CONFIRMED,
            statusMessage: 'Lịch hẹn của bạn đã được xác nhận',
          },
        );
        this.logger.log(`[CONFIRM] Email sent successfully to ${ownerEmail}`);
      } else {
        this.logger.warn(`[CONFIRM] Cannot send email - missing pet/owner/account data`);
      }
    } catch (emailError) {
      console.error('============ EMAIL ERROR ============');
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      console.error('=====================================');
      this.logger.error(
        `[CONFIRM] Failed to send confirmation email for appointment ${appointmentId}: ${emailError.message}`,
        emailError.stack,
      );
      // Don't fail the operation if email fails
    }

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
   */
  async completeAppointment(
    appointmentId: number,
    actualCost?: number,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'employee',
        'service',
      ],
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
    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Send completion email
    try {
      if (appointment.pet?.owner?.account) {
        const appointmentDate = new Date(appointment.appointmentDate);
        const formattedDate = appointmentDate.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        await this.emailService.sendAppointmentStatusUpdateEmail(
          appointment.pet.owner.account.email,
          {
            ownerName: appointment.pet.owner.fullName,
            petName: appointment.pet.name,
            serviceName: appointment.service.serviceName,
            appointmentDate: formattedDate,
            appointmentTime: appointment.startTime,
            status: AppointmentStatus.COMPLETED,
            statusMessage: actualCost 
              ? `Lịch hẹn đã hoàn thành. Chi phí thực tế: ${actualCost.toLocaleString('vi-VN')}đ`
              : 'Lịch hẹn đã hoàn thành',
          },
        );
        this.logger.log(`[COMPLETE] Completion email sent to ${appointment.pet.owner.account.email}`);
      }
    } catch (emailError) {
      console.error('============ COMPLETE EMAIL ERROR ============');
      console.error('Error:', emailError.message);
      console.error('==============================================');
      this.logger.error(
        `[COMPLETE] Failed to send completion email: ${emailError.message}`,
        emailError.stack,
      );
    }

    return savedAppointment;
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
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'employee',
        'service',
      ],
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

    const oldStatus = appointment.status;
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = reason ?? null;
    appointment.cancelledAt = new Date();
    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Send cancellation email
    try {
      if (appointment.pet?.owner?.account) {
        const appointmentDate = new Date(appointment.appointmentDate);
        const formattedDate = appointmentDate.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        await this.emailService.sendAppointmentStatusUpdateEmail(
          appointment.pet.owner.account.email,
          {
            ownerName: appointment.pet.owner.fullName,
            petName: appointment.pet.name,
            serviceName: appointment.service.serviceName,
            appointmentDate: formattedDate,
            appointmentTime: appointment.startTime,
            status: AppointmentStatus.CANCELLED,
            statusMessage: reason
              ? `Lịch hẹn đã bị hủy. Lý do: ${reason}`
              : 'Lịch hẹn đã bị hủy',
          },
        );
        this.logger.log(`[CANCEL] Cancellation email sent to ${appointment.pet.owner.account.email}`);
      }
    } catch (emailError) {
      console.error('============ CANCEL EMAIL ERROR ============');
      console.error('Error:', emailError.message);
      console.error('============================================');
      this.logger.error(
        `Failed to send cancellation email for appointment ${appointmentId}: ${emailError.message}`,
        emailError.stack,
      );
      // Don't fail the operation if email fails
    }

    return savedAppointment;
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

  // ============================================
  // SCHEDULED TASKS (CRON JOBS)
  // ============================================

  /**
   * Sends appointment reminders for appointments in the next 18-30 hours.
   * Runs daily at 9:00 AM (Vietnam timezone).
   * This ensures reminders are sent once per day, roughly 24 hours before appointment.
   */
  @Cron('0 9 * * *') // Every day at 9:00 AM
  async sendAppointmentReminders(): Promise<void> {
    try {
      this.logger.log('============================================');
      this.logger.log('Starting appointment reminder cron job');

      // Calculate time range: 18-30 hours from now
      // This gives a window for appointments tomorrow
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(now.getHours() + 18); // 18 hours from now

      const endTime = new Date(now);
      endTime.setHours(now.getHours() + 30); // 30 hours from now

      this.logger.log(
        `Searching for CONFIRMED appointments between ${startTime.toISOString()} and ${endTime.toISOString()}`,
      );

      // Find CONFIRMED appointments in the time range
      const appointments = await this.appointmentRepository.find({
        where: {
          appointmentDate: Between(startTime, endTime),
          status: AppointmentStatus.CONFIRMED,
        },
        relations: [
          'pet',
          'pet.owner',
          'pet.owner.account',
          'employee',
          'service',
        ],
      });

      this.logger.log(`Found ${appointments.length} appointments to remind`);

      let successCount = 0;
      let failureCount = 0;

      // Send reminder emails
      for (const appointment of appointments) {
        try {
          if (appointment.pet?.owner?.account) {
            // Format date consistently
            const appointmentDate = new Date(appointment.appointmentDate);
            const formattedDate = appointmentDate.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });

            await this.emailService.sendAppointmentReminderEmail(
              appointment.pet.owner.account.email,
              {
                ownerName: appointment.pet.owner.fullName,
                petName: appointment.pet.name,
                serviceName: appointment.service.serviceName,
                appointmentDate: formattedDate,
                appointmentTime: `${appointment.startTime} - ${appointment.endTime}`,
                veterinarianName: appointment.employee.fullName,
              },
            );

            successCount++;
            this.logger.log(
              `✓ Sent reminder for appointment #${appointment.appointmentId} to ${appointment.pet.owner.account.email}`,
            );
          }
        } catch (emailError) {
          failureCount++;
          this.logger.error(
            `✗ Failed to send reminder for appointment #${appointment.appointmentId}: ${emailError.message}`,
            emailError.stack,
          );
          // Continue with other appointments even if one fails
        }
      }

      this.logger.log('============================================');
      this.logger.log(
        `Appointment reminder cron job completed: ${successCount} sent, ${failureCount} failed`,
      );
    } catch (error) {
      this.logger.error(
        `Error in appointment reminder cron job: ${error.message}`,
        error.stack,
      );
    }
  }
}
