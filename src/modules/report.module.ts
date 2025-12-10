import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from '../controllers/report.controller';
import { ReportService } from '../services/report.service';
import { Appointment } from '../entities/appointment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Service } from '../entities/service.entity';

/**
 * ReportModule
 *
 * Generates statistical reports for management decision-making.
 * Calculates number of services per month categorized by service type.
 * Computes total monthly revenue.
 * Aggregates data from appointments and invoices repositories.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Invoice, Service])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
