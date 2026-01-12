import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import path from 'path';

// Import guards
import { AuthGuard } from '../../src/middleware/guards/auth.guard';
import { RolesGuard } from '../../src/middleware/guards/roles.guard';

// Import all entities
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
import { AppointmentService } from '../../src/entities/appointment-service.entity';
import { MedicalRecord } from '../../src/entities/medical-record.entity';
import { VaccineType } from '../../src/entities/vaccine-type.entity';
import { VaccinationHistory } from '../../src/entities/vaccination-history.entity';
import { Payment } from '../../src/entities/payment.entity';
import { Invoice } from '../../src/entities/invoice.entity';
import { PaymentGatewayArchive } from '../../src/entities/payment-gateway-archive.entity';
import { AuditLog } from '../../src/entities/audit-log.entity';

// Import all modules needed
import { AccountModule } from '../../src/modules/account.module';
import { AppointmentModule } from '../../src/modules/appointment.module';
import { PetModule } from '../../src/modules/pet.module';
import { ServiceModule } from '../../src/modules/service.module';
import { EmployeeModule } from '../../src/modules/employee.module';
import { ScheduleModule } from '../../src/modules/schedule.module';
import { MedicalRecordModule } from '../../src/modules/medical-record.module';
import { ServiceCategoryModule } from '../../src/modules/service-category.module';
import { PetOwnerModule } from '../../src/modules/pet-owner.module';
import { CageModule } from '../../src/modules/cage.module';
import { PaymentModule } from '../../src/modules/payment.module';

/**
 * Integration Test Helper
 * Creates a test app with real database connection (Docker PostgreSQL)
 */

const entities = [
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
  PaymentGatewayArchive,
  AuditLog,
];

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
      }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'), // Test DB port
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres123',
        database: process.env.DB_NAME || 'pet_care_test_db', // Test DB name
        entities,
        synchronize: true,
        dropSchema: false,
        logging: false,
      }),
      TypeOrmModule.forFeature(entities),
      AccountModule,
      AppointmentModule,
      PetModule,
      ServiceModule,
      EmployeeModule,
      ScheduleModule,
      MedicalRecordModule,
      ServiceCategoryModule,
      PetOwnerModule,
      CageModule,
      PaymentModule,
    ],
    providers: [
      {
        provide: APP_GUARD,
        useClass: AuthGuard,
      },
      {
        provide: APP_GUARD,
        useClass: RolesGuard,
      },
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply same pipes as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Clean all tables using TRUNCATE CASCADE
 * Use this for complete cleanup between test suites
 * Note: This is slower than transaction rollback
 */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);

  // Clean all tables in reverse order to avoid FK constraints
  const entities = dataSource.entityMetadatas;

  for (const entity of entities.reverse()) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`);
  }
}

// ===== Transaction-Based Test Context (Faster Cleanup) =====

/**
 * Transaction Test Context
 * 
 * Wraps each test in a transaction that is rolled back after the test.
 * This is 10-50x faster than TRUNCATE for test cleanup.
 * 
 * Usage:
 * ```typescript
 * let ctx: TransactionTestContext;
 * 
 * beforeEach(async () => {
 *   ctx = await createTransactionTestContext(app);
 * });
 * 
 * afterEach(async () => {
 *   await ctx.rollback();
 * });
 * 
 * it('should do something', async () => {
 *   // Use ctx.manager for database operations
 *   await ctx.manager.save(Account, { ... });
 * });
 * ```
 */
export interface TransactionTestContext {
  /** QueryRunner managing the transaction */
  queryRunner: QueryRunner;
  /** EntityManager scoped to this transaction */
  manager: QueryRunner['manager'];
  /** Rollback the transaction (cleanup) */
  rollback: () => Promise<void>;
  /** Get DataSource for direct access */
  dataSource: DataSource;
}

/**
 * Creates a transaction test context for faster test cleanup
 * 
 * @param app - NestJS application instance
 * @returns TransactionTestContext for test interactions
 */
export async function createTransactionTestContext(
  app: INestApplication,
): Promise<TransactionTestContext> {
  const dataSource = app.get(DataSource);
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  return {
    queryRunner,
    manager: queryRunner.manager,
    dataSource,
    rollback: async () => {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    },
  };
}

/**
 * Helper to setup beforeEach/afterEach with transaction context
 * 
 * @example
 * ```typescript
 * describe('MyTest', () => {
 *   const { getContext, setup, teardown } = useTransactionContext();
 * 
 *   beforeAll(async () => { app = await createTestApp(); });
 *   beforeEach(async () => { await setup(app); });
 *   afterEach(async () => { await teardown(); });
 * 
 *   it('test', async () => {
 *     const ctx = getContext();
 *     await ctx.manager.save(...);
 *   });
 * });
 * ```
 */
export function useTransactionContext() {
  let context: TransactionTestContext | null = null;

  return {
    getContext: (): TransactionTestContext => {
      if (!context) {
        throw new Error('Transaction context not initialized. Call setup() in beforeEach.');
      }
      return context;
    },
    setup: async (app: INestApplication): Promise<TransactionTestContext> => {
      context = await createTransactionTestContext(app);
      return context;
    },
    teardown: async (): Promise<void> => {
      if (context) {
        await context.rollback();
        context = null;
      }
    },
  };
}

