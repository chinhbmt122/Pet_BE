import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
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
  ) {}

  /**
   * Creates new work schedule for an employee.
   */
  async createSchedule(dto: CreateWorkScheduleDto): Promise<WorkScheduleResponseDto> {
    // Verify employee exists
    const employee = await this.employeeRepository.findOne({
      where: { employeeId: dto.employeeId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }

    // Check for conflicts on same date
    const existingSchedule = await this.scheduleRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        workDate: new Date(dto.workDate),
      },
    });
    if (existingSchedule) {
      throw new ConflictException(
        `Schedule already exists for employee ${dto.employeeId} on ${dto.workDate}`,
      );
    }

    // Create via domain model (validates time constraints)
    const domain = WorkScheduleDomainModel.create({
      employeeId: dto.employeeId,
      workDate: new Date(dto.workDate),
      startTime: dto.startTime,
      endTime: dto.endTime,
      breakStart: dto.breakStart,
      breakEnd: dto.breakEnd,
      notes: dto.notes,
    });

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
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    const domain = WorkScheduleMapper.toDomain(entity);

    // Update via domain methods
    if (dto.startTime && dto.endTime) {
      domain.updateTimes(dto.startTime, dto.endTime);
    } else if (dto.startTime || dto.endTime) {
      domain.updateTimes(dto.startTime ?? domain.startTime, dto.endTime ?? domain.endTime);
    }

    if (dto.breakStart !== undefined || dto.breakEnd !== undefined) {
      domain.updateBreak(dto.breakStart ?? domain.breakStart, dto.breakEnd ?? domain.breakEnd);
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
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
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
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
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
      whereClause.isAvailable = true;
    }

    if (options?.startDate && options?.endDate) {
      whereClause.workDate = Between(options.startDate, options.endDate);
    } else if (options?.startDate) {
      whereClause.workDate = MoreThanOrEqual(options.startDate);
    } else if (options?.endDate) {
      whereClause.workDate = LessThanOrEqual(options.endDate);
    }

    const entities = await this.scheduleRepository.find({
      where: whereClause,
      order: { workDate: 'ASC', startTime: 'ASC' },
    });

    const domains = WorkScheduleMapper.toDomainList(entities);
    return WorkScheduleResponseDto.fromDomainList(domains);
  }

  /**
   * Gets employee schedules for a date range.
   */
  async getSchedulesByEmployee(
    employeeId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<WorkScheduleResponseDto[]> {
    const whereClause: any = { employeeId };

    if (startDate && endDate) {
      whereClause.workDate = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.workDate = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereClause.workDate = LessThanOrEqual(endDate);
    }

    const entities = await this.scheduleRepository.find({
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
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
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
  async markUnavailable(scheduleId: number, reason?: string): Promise<WorkScheduleResponseDto> {
    const entity = await this.scheduleRepository.findOne({
      where: { scheduleId },
    });
    if (!entity) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
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
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    const domain = WorkScheduleMapper.toDomain(entity);
    domain.markAvailable();

    const updatedData = WorkScheduleMapper.toPersistence(domain);
    const saved = await this.scheduleRepository.save(updatedData);

    const savedDomain = WorkScheduleMapper.toDomain(saved);
    return WorkScheduleResponseDto.fromDomain(savedDomain);
  }
}
