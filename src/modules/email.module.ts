import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { EmailService } from '../services/email.service';
import { EmailQueueProcessor } from '../services/email-queue.processor';
import { EmailLog } from '../entities/email-log.entity';

/**
 * EmailModule
 *
 * Provides email functionality throughout the application.
 * Configures SMTP settings, templates, email queue, and logging.
 *
 * Features:
 * - Async email processing with Bull Queue
 * - Redis-backed job queue
 * - Automatic retry mechanism
 * - Email logging and auditing
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EmailLog]),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST', 'smtp.gmail.com'),
          port: configService.get('MAIL_PORT', 587),
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"${configService.get('MAIL_FROM_NAME', 'PAW LOVERS')}" <${configService.get('MAIL_FROM_ADDRESS', 'noreply@pawlovers.com')}>`,
        },
        template: {
          dir: join(process.cwd(), 'src', 'templates', 'emails'),
          adapter: new HandlebarsAdapter({
            eq: (a: any, b: any) => a === b,
          }),
          options: {
            strict: true,
          },
        },
      }),
    }),
    BullModule.registerQueueAsync({
      name: 'email-queue',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3, // Retry up to 3 times
          backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5 seconds delay
          },
          removeOnComplete: true, // Clean up completed jobs
          removeOnFail: false, // Keep failed jobs for debugging
        },
      }),
    }),
  ],
  providers: [EmailService, EmailQueueProcessor],
  exports: [EmailService],
})
export class EmailModule {}
