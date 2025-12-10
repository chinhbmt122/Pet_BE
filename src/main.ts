import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './middleware/filters/http-exception.filter';
import { AllExceptionsFilter } from './middleware/filters/all-exceptions.filter';
import { LoggingInterceptor } from './middleware/interceptors/logging.interceptor';
import { TransformInterceptor } from './middleware/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Pet Care Service Management API')
    .setDescription('API documentation for Pet Care Service Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Account', 'User authentication and account management')
    .addTag('Appointment', 'Appointment booking and management')
    .addTag('Pet', 'Pet registration and profile management')
    .addTag('Schedule', 'Staff work schedule management')
    .addTag('Service', 'Service catalog and pricing')
    .addTag('Payment', 'Invoice and payment processing')
    .addTag('Medical Record', 'Medical records and vaccination tracking')
    .addTag('Report', 'Business intelligence and reporting')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
