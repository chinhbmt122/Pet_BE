import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog } from '../entities/email-log.entity';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  emailLogId: number;
}

/**
 * EmailQueueProcessor
 *
 * Background processor for email queue using Bull.
 * Handles async email sending with retry logic and error handling.
 *
 * Features:
 * - Async email processing
 * - Automatic retry on failure (3 attempts)
 * - Email log status updates
 * - Error logging with details
 */
@Processor('email-queue')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
  ) {}

  /**
   * Process email sending job
   */
  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, template, context, emailLogId } = job.data;

    this.logger.log(
      `Processing email job ${job.id} for ${to} (attempt ${job.attemptsMade + 1})`,
    );

    try {
      // Send email using MailerService
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });

      // Update email log status to 'sent'
      await this.emailLogRepository.update(emailLogId, {
        status: 'sent',
        sentAt: new Date(),
        retryCount: job.attemptsMade,
      });

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send email to ${to}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Update email log with error details
      await this.emailLogRepository.update(emailLogId, {
        status: 'failed',
        errorMessage,
        retryCount: job.attemptsMade + 1,
      });

      // Re-throw error to trigger Bull's retry mechanism
      throw error;
    }
  }
}
