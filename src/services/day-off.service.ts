import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { DayOff } from '../entities/day-off.entity';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { Appointment } from '../entities/appointment.entity';
import {
  CreateDayOffDto,
  UpdateDayOffDto,
  DayOffResponseDto,
} from '../dto/day-off';

/**
 * DayOffService
 *
 * Manages day-off records (holidays/business closure dates).
 * Handles CRUD operations for day-off management.
 */
@Injectable()
export class DayOffService {
  constructor(
    @InjectRepository(DayOff)
    private readonly dayOffRepository: Repository<DayOff>,
    @InjectRepository(WorkSchedule)
    private readonly scheduleRepository: Repository<WorkSchedule>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Creates a new day-off record.
   * Clears all schedules on that date ONLY if there are no appointments.
   * If appointments exist, schedules are NOT cleared and user is notified.
   */
  async createDayOff(dto: CreateDayOffDto): Promise<DayOffResponseDto> {
    // Check if day-off already exists for this date
    const existingDayOff = await this.dayOffRepository.findOne({
      where: { date: new Date(dto.date) },
    });

    if (existingDayOff) {
      I18nException.conflict('errors.conflict.dayOffExists', {
        date: dto.date,
      });
    }

    const dayOff = this.dayOffRepository.create({
      date: new Date(dto.date),
      name: dto.name,
      description: dto.description,
    });

    const saved = await this.dayOffRepository.save(dayOff);

    // Check for appointments and clear schedules if possible
    await this.clearSchedulesOnDayOff(dto.date);

    return this.mapToResponseDto(saved);
  }

  /**
   * Clears work schedules on a specific date ONLY if there are NO appointments.
   * If any appointments exist on that date, NO schedules are cleared.
   */
  private async clearSchedulesOnDayOff(dateString: string): Promise<void> {
    const targetDate = new Date(dateString);

    // Get all schedules on this date
    const schedulesOnDate = await this.scheduleRepository.find({
      where: { workDate: targetDate },
    });

    if (schedulesOnDate.length === 0) {
      console.log(`[DayOffService] No schedules to clear on ${dateString}`);
      return;
    }

    // Check if ANY appointments exist on this date (active appointments only)
    const appointmentsOnDate = await this.appointmentRepository.find({
      where: {
        appointmentDate: targetDate,
        status: In(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']),
      },
    });

    // If there are ANY appointments, DO NOT clear any schedules
    if (appointmentsOnDate.length > 0) {
      console.log(
        `[DayOffService] Cannot clear schedules on ${dateString} - ${appointmentsOnDate.length} appointment(s) exist. Schedules preserved.`,
      );
      return;
    }

    // No appointments exist - safe to clear all schedules
    const scheduleIds = schedulesOnDate.map((s) => s.scheduleId);
    await this.scheduleRepository.delete(scheduleIds);

    console.log(
      `[DayOffService] Cleared all ${schedulesOnDate.length} schedules on ${dateString} (no appointments found)`,
    );
  }

  /**
   * Retrieves all day-off records.
   */
  async getAllDayOffs(): Promise<DayOffResponseDto[]> {
    const dayOffs = await this.dayOffRepository.find({
      order: { date: 'ASC' },
    });
    return dayOffs.map((dayOff) => this.mapToResponseDto(dayOff));
  }

  /**
   * Retrieves day-offs within a date range.
   */
  async getDayOffsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<DayOffResponseDto[]> {
    const dayOffs = await this.dayOffRepository.find({
      where: {
        date: Between(new Date(startDate), new Date(endDate)),
      },
      order: { date: 'ASC' },
    });
    return dayOffs.map((dayOff) => this.mapToResponseDto(dayOff));
  }

  /**
   * Retrieves a single day-off by ID.
   */
  async getDayOffById(id: number): Promise<DayOffResponseDto> {
    const dayOff = await this.dayOffRepository.findOne({
      where: { dayOffId: id },
    });

    if (!dayOff) {
      I18nException.notFound('errors.notFound.dayOff', { id });
    }

    return this.mapToResponseDto(dayOff);
  }

  /**
   * Updates an existing day-off record.
   */
  async updateDayOff(
    id: number,
    dto: UpdateDayOffDto,
  ): Promise<DayOffResponseDto> {
    const dayOff = await this.dayOffRepository.findOne({
      where: { dayOffId: id },
    });

    if (!dayOff) {
      I18nException.notFound('errors.notFound.dayOff', { id });
    }

    // If date is being updated, check for conflicts
    if (dto.date && dto.date !== dayOff.date.toISOString().split('T')[0]) {
      const existingDayOff = await this.dayOffRepository.findOne({
        where: { date: new Date(dto.date) },
      });

      if (existingDayOff && existingDayOff.dayOffId !== id) {
        I18nException.conflict('errors.conflict.dayOffExists', {
          date: dto.date,
        });
      }
    }

    // Update fields
    if (dto.date) {
      dayOff.date = new Date(dto.date);
    }
    if (dto.name) {
      dayOff.name = dto.name;
    }
    if (dto.description !== undefined) {
      dayOff.description = dto.description;
    }

    const updated = await this.dayOffRepository.save(dayOff);
    return this.mapToResponseDto(updated);
  }

  /**
   * Deletes a day-off record.
   */
  async deleteDayOff(id: number): Promise<void> {
    const dayOff = await this.dayOffRepository.findOne({
      where: { dayOffId: id },
    });

    if (!dayOff) {
      I18nException.notFound('errors.notFound.dayOff', { id });
    }

    await this.dayOffRepository.remove(dayOff);
  }

  /**
   * Checks if a specific date is a day-off.
   */
  async isDayOff(date: string): Promise<boolean> {
    const dayOff = await this.dayOffRepository.findOne({
      where: { date: new Date(date) },
    });
    return !!dayOff;
  }

  /**
   * Checks if there are appointments on a specific date.
   * Used to warn managers before creating day-offs.
   */
  async checkAppointmentsOnDate(
    date: string,
  ): Promise<{ hasAppointments: boolean; count: number }> {
    const targetDate = new Date(date);
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: targetDate,
        status: In(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']),
      },
    });

    return {
      hasAppointments: appointments.length > 0,
      count: appointments.length,
    };
  }

  /**
   * Maps entity to response DTO.
   */
  private mapToResponseDto(dayOff: DayOff): DayOffResponseDto {
    console.log('Mapping DayOff entity to DayOffResponseDto:', dayOff);
    return {
      dayOffId: dayOff.dayOffId,
      date: new Date(dayOff.date).toISOString().split('T')[0],
      name: dayOff.name,
      description: dayOff.description,
      createdAt: dayOff.createdAt,
      updatedAt: dayOff.updatedAt,
    };
  }
}
