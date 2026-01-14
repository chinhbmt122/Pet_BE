import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from '../controllers/employee.controller';
import { EmployeeService } from '../services/employee.service';
import { EmployeeFactory } from '../factories/employee.factory';
import { AccountFactory } from '../factories/account.factory';
import { Account } from '../entities/account.entity';
import { Employee } from '../entities/employee.entity';
import { Manager } from '../entities/manager.entity';
import { Receptionist } from '../entities/receptionist.entity';
import { CareStaff } from '../entities/care-staff.entity';
import { Veterinarian } from '../entities/veterinarian.entity';
import { Appointment } from 'src/entities/appointment.entity';

/**
 * EmployeeModule
 *
 * Handles Employee operations:
 * - Employee creation (Manager only)
 * - Employee profile management
 * - Availability management
 * - Role-based queries
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Employee,
      Manager,
      Appointment,
      Receptionist,
      CareStaff,
      Veterinarian,
    ]),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeFactory, AccountFactory],
  exports: [EmployeeService, EmployeeFactory],
})
export class EmployeeModule {}
