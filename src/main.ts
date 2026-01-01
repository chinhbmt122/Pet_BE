import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe with i18n support
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      // pass transform options through to class-transformer (supported by types)
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        // Transform validation errors to i18n-compatible format
        const errors = validationErrors.map((error) => {
          const constraints = error.constraints || {};
          const constraintKeys = Object.keys(constraints);

          if (constraintKeys.length > 0) {
            const firstConstraint = constraintKeys[0];

            // Map class-validator constraint to i18n key
            const i18nKeyMap: Record<string, string> = {
              isNotEmpty: 'validation.isNotEmpty',
              isString: 'validation.isString',
              isNumber: 'validation.isNumber',
              isInt: 'validation.isInt',
              isBoolean: 'validation.isBoolean',
              isEmail: 'validation.isEmail',
              isDate: 'validation.isDate',
              isEnum: 'validation.isEnum',
              isArray: 'validation.isArray',
              minLength: 'validation.minLength',
              maxLength: 'validation.maxLength',
              min: 'validation.min',
              max: 'validation.max',
              matches: 'validation.matches',
              isPhoneNumber: 'validation.isPhoneNumber',
              isUrl: 'validation.isUrl',
              isUUID: 'validation.isUUID',
              isPositive: 'validation.isPositive',
              isNegative: 'validation.isNegative',
              arrayMinSize: 'validation.arrayMinSize',
              arrayMaxSize: 'validation.arrayMaxSize',
              isIn: 'validation.isIn',
              isNotIn: 'validation.isNotIn',
            };

            const i18nKey = i18nKeyMap[firstConstraint] || 'validation.matches';

            return {
              i18nKey,
              args: {
                property: error.property,
                value: error.value,
                ...error.constraints,
              },
              // Keep original message as fallback for backward compatibility
              message: constraints[firstConstraint],
            };
          }

          return {
            message: `Validation failed for ${error.property}`,
          };
        });

        return new BadRequestException(errors);
      },
    }),
  );
  app.enableCors({
    credentials: true,
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:4200',
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
