import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentController } from '../controllers/appointment.controller';
import { AppointmentService } from '../services/appointment.service';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentService as AppointmentServiceEntity } from '../entities/appointment-service.entity';
import { Pet } from '../entities/pet.entity';
import { Employee } from '../entities/employee.entity';
import { Service } from '../entities/service.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { AppointmentFactory } from '../factories/appointment.factory';
import { EmailModule } from './email.module';

/**
 * AppointmentModule
 *
 * Handles appointment booking, cancellation, and status updates.
 * Manages appointment lifecycle: Pending → Confirmed → In-Progress → Completed/Cancelled.
 * Coordinates with ScheduleManager for availability and NotificationService for confirmations.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentServiceEntity,
      Pet,
      Employee,
      Service,
      PetOwner,
    ]),
    ScheduleModule.forRoot(),
    EmailModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentFactory],
  exports: [AppointmentService, AppointmentFactory],
})
export class AppointmentModule {}
