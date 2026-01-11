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
import { ServiceCategoryModule } from './modules/service-category.module';
import { CageModule } from './modules/cage.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './middleware/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './middleware/filters/global.filter';
import { AuthGuard } from './middleware/guards/auth.guard';
import { RolesGuard } from './middleware/guards/roles.guard';
import { RequestLoggerMiddleware } from './middleware/interceptors/requestLog.interceptor';
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // i18n configuration
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
      throwOnMissingKey: true,
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
    ServiceCategoryModule,
    PaymentModule,
    MedicalRecordModule,
    ReportModule,
    CageModule,
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
