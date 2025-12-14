import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.module';
import { AccountModule } from './modules/account.module';
import { PetOwnerModule } from './modules/pet-owner.module';
import { EmployeeModule } from './modules/employee.module';
import { AppointmentModule } from './modules/appointment.module';
import { PetModule } from './modules/pet.module';
import { ScheduleModule } from './modules/schedule.module';
import { ServiceModule } from './modules/service.module';
import { PaymentModule } from './modules/payment.module';
import { MedicalRecordModule } from './modules/medical-record.module';
import { ReportModule } from './modules/report.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './middleware/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './middleware/filters/global.filter';
import { AuthGuard } from './middleware/guards/auth.guard';
import { RolesGuard } from './middleware/guards/roles.guard';
import { RequestLoggerMiddleware } from './middleware/interceptors/requestLog.interceptor';

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
    PetOwnerModule,
    EmployeeModule,
    AppointmentModule,
    PetModule,
    ScheduleModule,
    ServiceModule,
    PaymentModule,
    MedicalRecordModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
