import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DayOffController } from '../controllers/day-off.controller';
import { DayOffService } from '../services/day-off.service';
import { DayOff } from '../entities/day-off.entity';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { Appointment } from '../entities/appointment.entity';

/**
 * DayOffModule
 *
 * Manages day-off/holiday records.
 * Handles creation, retrieval, updates, and deletion of day-off dates.
 * Used for tracking business closure dates and holidays.
 *
 * When creating a day-off, automatically clears work schedules on that date
 * except for schedules with active appointments.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DayOff, WorkSchedule, Appointment])],
  controllers: [DayOffController],
  providers: [DayOffService],
  exports: [DayOffService],
})
export class DayOffModule {}
