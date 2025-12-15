import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleController } from '../controllers/schedule.controller';
import { ScheduleService } from '../services/schedule.service';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { Employee } from '../entities/employee.entity';

/**
 * ScheduleModule
 *
 * Manages staff work schedules and service assignments.
 * Handles schedule creation, updates, deletion, and conflict checking.
 * Provides staff availability information for appointment booking system.
 */
@Module({
  imports: [TypeOrmModule.forFeature([WorkSchedule, Employee])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
