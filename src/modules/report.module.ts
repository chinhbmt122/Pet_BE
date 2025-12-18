import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from '../controllers/report.controller';
import { ReportService } from '../services/report.service';
import { Appointment } from '../entities/appointment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Service } from '../entities/service.entity';
import { Pet } from 'src/entities/pet.entity';
import { PetOwner } from 'src/entities/pet-owner.entity';
import { CageAssignment } from 'src/entities/cage-assignment.entity';
import { Employee } from 'src/entities/employee.entity';

/**
 * ReportModule
 *
 * Generates statistical reports for management decision-making.
 * Calculates number of services per month categorized by service type.
 * Computes total monthly revenue.
 * Aggregates data from appointments and invoices repositories.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Invoice,
      Service,
      Pet,
      PetOwner,
      CageAssignment,
      Employee,
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
