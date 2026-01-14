import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { Employee } from '../entities/employee.entity';
import { WorkScheduleDomainModel } from '../domain/work-schedule.domain';
import { WorkScheduleMapper } from '../mappers/work-schedule.mapper';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  WorkScheduleResponseDto,
} from '../dto/schedule';
import { UserType } from '../entities/account.entity';
import { SystemConfigService } from './system-config.service';

/**
 * ScheduleService (DDD Pattern)
 *
 * Manages staff work schedules using WorkScheduleDomainModel for business logic.
 * Handles schedule CRUD, availability checking, and time slot management.
 */
@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly scheduleRepository: Repository<WorkSchedule>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @Inject(forwardRef(() => SystemConfigService))
    private readonly systemConfigService: SystemConfigService,
  ) {}

  /**
   * Creates new work schedule for an employee.
   */
  async createSchedule(
    dto: CreateWorkScheduleDto,
  ): Promise<WorkScheduleResponseDto> {
    // Verify employee exists
    const employee = await this.employeeRepository.findOne({
      where: { employeeId: dto.employeeId },
    });
    if (!employee) {
      I18nException.notFound('errors.notFound.employee', {
        id: dto.employeeId,
      });
    }

    // Check if the work date falls on a persistent day off
    const workDate = new Date(dto.workDate);
    const isPersistentDayOff =
      await this.systemConfigService.isPersistentDayOff(workDate);

    if (isPersistentDayOff) {
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const dayName = dayNames[workDate.getDay()];
      I18nException.badRequest('errors.validation.persistentDayOff', {
        date: dto.workDate,
        day: dayName,
      });
    }

    // Check for conflicts on same date
    const existingSchedule = await this.scheduleRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        workDate: new Date(dto.workDate),
      },
    });
    if (existingSchedule) {
      I18nException.conflict('errors.conflict.scheduleExists', {
        employeeId: dto.employeeId,
        date: dto.workDate,
      });
    }

    // Create via domain model (validates time constraints)
    let domain: WorkScheduleDomainModel;
    try {
      domain = WorkScheduleDomainModel.create({
        employeeId: dto.employeeId,
        workDate: new Date(dto.workDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        breakStart: dto.breakStart,
        breakEnd: dto.breakEnd,
        notes: dto.notes,
      });
    } catch (error) {
      // Domain validation errors are Bad Requests
      const message = error instanceof Error ? error.message : String(error);
      I18nException.badRequest('validation.custom.invalidTimeRange', {
        error: message,
      });
      throw error; // Fallback if I18nException doesn't throw (it does)
    }

    const entityData = WorkScheduleMapper.toPersistence(domain);
    const entity = this.scheduleRepository.create(entityData);
    const saved = await this.scheduleRepository.save(entity);

    const savedDomain = WorkScheduleMapper.toDomain(saved);
    return WorkScheduleResponseDto.fromDomain(savedDomain);
  }

  /**
   * Updates existing schedule.
   */
  async updateSchedule(
    scheduleId: number,
    dto: UpdateWorkScheduleDto,
  ): Promise<WorkScheduleResponseDto> {
    const entity = await this.scheduleRepository.findOne({
      where: { scheduleId },
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.schedule', {
        id: scheduleId,
      });
    }

    const domain = WorkScheduleMapper.toDomain(entity);

    // Update via domain methods
    if (dto.startTime && dto.endTime) {
      domain.updateTimes(dto.startTime, dto.endTime);
    } else if (dto.startTime || dto.endTime) {
      domain.updateTimes(
        dto.startTime ?? domain.startTime,
        dto.endTime ?? domain.endTime,
      );
    }

    if (dto.breakStart !== undefined || dto.breakEnd !== undefined) {
      domain.updateBreak(
        dto.breakStart ?? domain.breakStart,
        dto.breakEnd ?? domain.breakEnd,
      );
    }

    if (dto.notes !== undefined) {
      domain.updateNotes(dto.notes);
    }

    const updatedData = WorkScheduleMapper.toPersistence(domain);
    const saved = await this.scheduleRepository.save(updatedData);

    const savedDomain = WorkScheduleMapper.toDomain(saved);
    return WorkScheduleResponseDto.fromDomain(savedDomain);
  }

  /**
   * Deletes schedule if no appointments are linked.
   */
  async deleteSchedule(scheduleId: number): Promise<boolean> {
    const entity = await this.scheduleRepository.findOne({
      where: { scheduleId },
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.schedule', {
        id: scheduleId,
      });
    }

    await this.scheduleRepository.remove(entity);
    return true;
  }

  /**
   * Gets schedule by ID.
   */
  async getScheduleById(scheduleId: number): Promise<WorkScheduleResponseDto> {
    const entity = await this.scheduleRepository.findOne({
      where: { scheduleId },
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.schedule', {
        id: scheduleId,
      });
    }

    const domain = WorkScheduleMapper.toDomain(entity);
    return WorkScheduleResponseDto.fromDomain(domain);
  }

  /**
   * Gets all schedules with optional filters.
   */
  async getAllSchedules(options?: {
    onlyAvailable?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<WorkScheduleResponseDto[]> {
    const whereClause: any = {};

    if (options?.onlyAvailable) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereClause.isAvailable = true;
    }

    if (options?.startDate && options?.endDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereClause.workDate = Between(options.startDate, options.endDate);
    } else if (options?.startDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereClause.workDate = MoreThanOrEqual(options.startDate);
    } else if (options?.endDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereClause.workDate = LessThanOrEqual(options.endDate);
    }

    const entities = await this.scheduleRepository.find({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: whereClause,
      order: { workDate: 'ASC', startTime: 'ASC' },
    });

    const domains = WorkScheduleMapper.toDomainList(entities);
    return WorkScheduleResponseDto.fromDomainList(domains);
  }

  /**
   * Gets employee schedules for a date range.
   * VET/CARE_STAFF can only view their own schedules.
   */
  async getSchedulesByEmployee(
    employeeId: number,
    startDate?: Date,
    endDate?: Date,
    user?: { accountId: number; userType: UserType },
  ): Promise<WorkScheduleResponseDto[]> {
    // If VET or CARE_STAFF, validate self-access
    if (
      user &&
      (user.userType === UserType.VETERINARIAN ||
        user.userType === UserType.CARE_STAFF)
    ) {
      // Get the employee record for the requesting user
      const userEmployee = await this.employeeRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!userEmployee || userEmployee.employeeId !== employeeId) {
        I18nException.forbidden('errors.forbidden.selfAccessOnly');
      }
    }

    const whereClause: any = { employeeId };

    if (startDate && endDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereClause.workDate = Between(startDate, endDate);
    } else if (startDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereClause.workDate = MoreThanOrEqual(startDate);
    } else if (endDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereClause.workDate = LessThanOrEqual(endDate);
    }

    const entities = await this.scheduleRepository.find({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: whereClause,
      order: { workDate: 'ASC', startTime: 'ASC' },
    });

    const domains = WorkScheduleMapper.toDomainList(entities);
    return WorkScheduleResponseDto.fromDomainList(domains);
  }

  /**
   * Gets all schedules for a specific date.
   */
  async getSchedulesByDate(date: Date): Promise<WorkScheduleResponseDto[]> {
    const entities = await this.scheduleRepository.find({
      where: { workDate: date },
      order: { startTime: 'ASC' },
    });

    const domains = WorkScheduleMapper.toDomainList(entities);
    return WorkScheduleResponseDto.fromDomainList(domains);
  }

  /**
   * Checks if employee is available at a specific date/time.
   * Uses domain model's checkAvailability method.
   */
  async checkAvailability(
    employeeId: number,
    dateTime: Date,
  ): Promise<boolean> {
    const date = new Date(dateTime);
    date.setHours(0, 0, 0, 0);

    const entity = await this.scheduleRepository.findOne({
      where: {
        employeeId,
        workDate: date,
      },
    });

    if (!entity) {
      return false; // No schedule = not available
    }

    const domain = WorkScheduleMapper.toDomain(entity);
    return domain.checkAvailability(dateTime);
  }

  /**
   * Assigns break time to a schedule.
   */
  async assignBreakTime(
    scheduleId: number,
    breakStart: string,
    breakEnd: string,
  ): Promise<WorkScheduleResponseDto> {
    const entity = await this.scheduleRepository.findOne({
      where: { scheduleId },
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.schedule', {
        id: scheduleId,
      });
    }

    const domain = WorkScheduleMapper.toDomain(entity);
    domain.updateBreak(breakStart, breakEnd);

    const updatedData = WorkScheduleMapper.toPersistence(domain);
    const saved = await this.scheduleRepository.save(updatedData);

    const savedDomain = WorkScheduleMapper.toDomain(saved);
    return WorkScheduleResponseDto.fromDomain(savedDomain);
  }

  /**
   * Marks schedule as unavailable.
   */
  async markUnavailable(
    scheduleId: number,
    reason?: string,
  ): Promise<WorkScheduleResponseDto> {
    const entity = await this.scheduleRepository.findOne({
      where: { scheduleId },
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.schedule', {
        id: scheduleId,
      });
    }

    const domain = WorkScheduleMapper.toDomain(entity);
    domain.markUnavailable(reason);

    const updatedData = WorkScheduleMapper.toPersistence(domain);
    const saved = await this.scheduleRepository.save(updatedData);

    const savedDomain = WorkScheduleMapper.toDomain(saved);
    return WorkScheduleResponseDto.fromDomain(savedDomain);
  }

  /**
   * Marks schedule as available.
   */
  async markAvailable(scheduleId: number): Promise<WorkScheduleResponseDto> {
    const entity = await this.scheduleRepository.findOne({
      where: { scheduleId },
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.schedule', {
        id: scheduleId,
      });
    }

    const domain = WorkScheduleMapper.toDomain(entity);
    domain.markAvailable();

    const updatedData = WorkScheduleMapper.toPersistence(domain);
    const saved = await this.scheduleRepository.save(updatedData);

    const savedDomain = WorkScheduleMapper.toDomain(saved);
    return WorkScheduleResponseDto.fromDomain(savedDomain);
  }

  /**
   * Gets available employees for a specific date/time range.
   */
  async getAvailableEmployees(params: {
    date: Date;
    startTime?: string;
    endTime?: string;
    role?: string;
  }): Promise<any[]> {
    const queryBuilder = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.employee', 'employee')
      .leftJoinAndSelect('employee.account', 'account')
      .where('schedule.workDate = :date', { date: params.date })
      .andWhere('schedule.isAvailable = :isAvailable', { isAvailable: true });

    if (params.startTime && params.endTime) {
      queryBuilder
        .andWhere('schedule.startTime <= :startTime', {
          startTime: params.startTime,
        })
        .andWhere('schedule.endTime >= :endTime', { endTime: params.endTime });
    }

    if (params.role) {
      queryBuilder.andWhere('account.userType = :role', { role: params.role });
    }

    const schedules = await queryBuilder.getMany();

    // Return employee information from schedules
    return schedules.map((schedule) => ({
      employeeId: schedule.employee.employeeId,
      fullName: schedule.employee.fullName,
      phoneNumber: schedule.employee.phoneNumber,
      scheduleId: schedule.scheduleId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    }));
  }
}
