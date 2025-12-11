import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';
import { Pet } from '../entities/pet.entity';
import { Appointment } from '../entities/appointment.entity';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { Service } from '../entities/service.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { VaccineType } from '../entities/vaccine-type.entity';
import { VaccinationHistory } from '../entities/vaccination-history.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';
import { ServiceCategory } from 'src/entities/service-category.entity';

/**
 * DatabaseModule
 *
 * Configures TypeORM connection using environment variables.
 * Imports all entities and enables synchronization for development.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/../**/*.entity.js'],
        synchronize: configService.get('NODE_ENV') === 'development', // Disable in production
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
