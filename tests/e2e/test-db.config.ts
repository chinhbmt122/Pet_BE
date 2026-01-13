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
import { InvoiceItem } from '../../src/entities/invoice-item.entity';
import { PaymentGatewayArchive } from '../../src/entities/payment-gateway-archive.entity';
import { AuditLog } from '../../src/entities/audit-log.entity';
import { AppointmentService } from '../../src/entities/appointment-service.entity';
import { PasswordResetToken } from '../../src/entities/password-reset-token.entity';
import { EmailLog } from '../../src/entities/email-log.entity';

// Ensure test env variables are loaded if available
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

function sanitizeSchemaName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

function makeUniqueTestSchema(): string {
  const fromEnv = process.env.DB_SCHEMA;
  if (fromEnv && fromEnv.trim()) {
    const sanitized = sanitizeSchemaName(fromEnv.trim());
    return sanitized || 'public';
  }

  // Default to the built-in schema.
  // TypeORM does not create schemas automatically, so randomly-generated schemas
  // will fail in CI unless explicitly provisioned.
  return 'public';
}

export function getTestDatabaseConfig(): DataSourceOptions {
  if (process.env.DATABASE_TYPE === 'postgres') {
    const dbName = process.env.DB_NAME || 'pet_care_test_db';
    const host = process.env.DB_HOST || 'localhost';
    const schema = makeUniqueTestSchema();

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
      AppointmentService,
      MedicalRecord,
      VaccineType,
      VaccinationHistory,
      Payment,
      Invoice,
      InvoiceItem,
      PaymentGatewayArchive,
      AuditLog,
      PasswordResetToken,
      EmailLog,
    ];

    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5433),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres123',
      database: dbName,
      schema,
      entities: entitiesOrdered,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      dropSchema: process.env.DB_DROP_SCHEMA === 'true',
      logging: process.env.DB_LOGGING === 'true',
      // Ensure unqualified raw SQL (e.g. TRUNCATE TABLE "employees") resolves
      // to the same schema where TypeORM created tables.
      extra: {
        options: `-c search_path=${schema},public`,
      },
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
