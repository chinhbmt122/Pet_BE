import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { I18nValidationPipe } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe with i18n support
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      // pass transform options through to class-transformer (supported by types)
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({
    credentials: true,
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:4200',
      // Add production frontend URL from environment
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
  });

  // LƯU Ý: ==================================================
  // Middlewares, Guards, and Filters được đăng ký trong AppModule

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
bootstrap().catch((error: unknown) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
