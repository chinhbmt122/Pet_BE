import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.module';
import { AccountModule } from './modules/account.module';
import { AppointmentModule } from './modules/appointment.module';
import { PetModule } from './modules/pet.module';
import { ScheduleModule } from './modules/schedule.module';
import { ServiceModule } from './modules/service.module';
import { PaymentModule } from './modules/payment.module';
import { MedicalRecordModule } from './modules/medical-record.module';
import { ReportModule } from './modules/report.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Database configuration
    DatabaseModule,
    // Feature modules
    AccountModule,
    AppointmentModule,
    PetModule,
    ScheduleModule,
    ServiceModule,
    PaymentModule,
    MedicalRecordModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
