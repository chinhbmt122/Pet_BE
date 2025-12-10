import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from '../controllers/appointment.controller';
import { AppointmentService } from '../services/appointment.service';
import { Appointment } from '../entities/appointment.entity';

/**
 * AppointmentModule
 *
 * Handles appointment booking, cancellation, and status updates.
 * Manages appointment lifecycle: Pending → Confirmed → In-Progress → Completed/Cancelled.
 * Coordinates with ScheduleManager for availability and NotificationService for confirmations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Appointment])],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
