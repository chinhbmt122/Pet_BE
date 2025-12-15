import { DataSourceOptions } from 'typeorm';
import path from 'path';
import dotenv from 'dotenv';
import { Account } from '../../src/entities/account.entity';
import { Employee } from '../../src/entities/employee.entity';
import { CareStaff } from '../../src/entities/care-staff.entity';
import { Veterinarian } from '../../src/entities/veterinarian.entity';
import { Manager } from '../../src/entities/manager.entity';
import { Receptionist } from '../../src/entities/receptionist.entity';
import { PetOwner } from '../../src/entities/pet-owner.entity';
import { Pet } from '../../src/entities/pet.entity';
import { ServiceCategory } from '../../src/entities/service-category.entity';
import { Service } from '../../src/entities/service.entity';
import { Cage } from '../../src/entities/cage.entity';
import { CageAssignment } from '../../src/entities/cage-assignment.entity';
import { WorkSchedule } from '../../src/entities/work-schedule.entity';
import { Appointment } from '../../src/entities/appointment.entity';
import { MedicalRecord } from '../../src/entities/medical-record.entity';
import { VaccineType } from '../../src/entities/vaccine-type.entity';
import { VaccinationHistory } from '../../src/entities/vaccination-history.entity';
import { Payment } from '../../src/entities/payment.entity';
import { Invoice } from '../../src/entities/invoice.entity';
import { PaymentGatewayArchive } from '../../src/entities/payment-gateway-archive.entity';
import { AuditLog } from '../../src/entities/audit-log.entity';

// Ensure test env variables are loaded if available
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

export function getTestDatabaseConfig(): DataSourceOptions {
  if (process.env.DATABASE_TYPE === 'postgres') {
    const dbName = process.env.DB_NAME || 'pet_care_test_db';
    const host = process.env.DB_HOST || 'localhost';

    // Safety guard: refuse to run destructive schema operations on non-test DBs
    if (
      (process.env.DB_DROP_SCHEMA === 'true' ||
        process.env.DB_SYNCHRONIZE === 'true') &&
      !/test/i.test(dbName) &&
      host !== 'localhost' &&
      host !== '127.0.0.1'
    ) {
      throw new Error(
        `Refusing to enable destructive DB operations on non-test DB: DB_NAME=${dbName}, DB_HOST=${host}. Set DB_NAME to include 'test' or DB_HOST to localhost to proceed.`,
      );
    }

    // Build an ordered entity list via sequential requires to guarantee module evaluation order
    const entitiesOrdered = [
      Account,
      Employee,
      CareStaff,
      Veterinarian,
      Manager,
      Receptionist,
      PetOwner,
      Pet,
      ServiceCategory,
      Service,
      Cage,
      CageAssignment,
      WorkSchedule,
      Appointment,
      MedicalRecord,
      VaccineType,
      VaccinationHistory,
      Payment,
      Invoice,
      PaymentGatewayArchive,
      AuditLog,
    ];

    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5433),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres123',
      database: dbName,
      entities: entitiesOrdered,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      dropSchema: process.env.DB_DROP_SCHEMA === 'true',
      logging: process.env.DB_LOGGING === 'true',
    } as DataSourceOptions;
  }

  // Default to sqlite in-memory for fast local runs
  return {
    type: 'sqlite',
    database: ':memory:',
    entities: [path.join(__dirname, '../../src/**/*.entity{.ts,.js}')],
    synchronize: true,
    dropSchema: true,
    logging: false,
  } as DataSourceOptions;
}
