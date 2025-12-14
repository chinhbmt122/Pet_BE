import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from '../controllers/employee.controller';
import { EmployeeService } from '../services/employee.service';
import { EmployeeFactory } from '../factories/employee.factory';
import { AccountFactory } from '../factories/account.factory';
import { Account } from '../entities/account.entity';
import { Employee } from '../entities/employee.entity';

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
    imports: [TypeOrmModule.forFeature([Account, Employee])],
    controllers: [EmployeeController],
    providers: [EmployeeService, EmployeeFactory, AccountFactory],
    exports: [EmployeeService, EmployeeFactory],
})
export class EmployeeModule { }
