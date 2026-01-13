import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EmailLog } from '../entities/email-log.entity';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  emailType: string;
}

/**
 * EmailService
 *
 * Handles all email sending operations in the system.
 * Provides methods for different email types with logging and error handling.
 *
 * Features:
 * - Async email processing with Bull Queue
 * - Email logging for auditing
 * - Error handling with automatic retry
 * - Template-based emails with Handlebars
 * - Support for multiple email types
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send email with logging and error handling (async via queue)
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    this.logger.log(`[SEND EMAIL] Starting sendEmail for ${options.to}`);
    this.logger.log(
      `[SEND EMAIL] Template: ${options.template}, Type: ${options.emailType}`,
    );

    // Create email log entry
    const emailLog = this.emailLogRepository.create({
      recipient: options.to,
      emailType: options.emailType,
      subject: options.subject,
      status: 'pending',
      metadata: options.context,
    });

    const savedLog = await this.emailLogRepository.save(emailLog);
    this.logger.log(
      `[SEND EMAIL] Email log created with ID: ${savedLog.emailLogId}`,
    );

    // Add email to queue for async processing
    try {
      await this.emailQueue.add('send-email', {
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: {
          ...(options.context as Record<string, unknown>),
          appName: this.configService.get<string>('APP_NAME', 'PAW LOVERS'),
          currentYear: new Date().getFullYear(),
        },
        emailLogId: savedLog.emailLogId,
      });

      this.logger.log(
        `Email queued successfully for ${options.to} - Type: ${options.emailType}`,
      );
    } catch (error) {
      // If queueing fails, update log status
      emailLog.status = 'failed';
      emailLog.errorMessage =
        error instanceof Error ? error.message : 'Failed to queue email';
      await this.emailLogRepository.save(emailLog);

      this.logger.error(
        `Failed to queue email for ${options.to}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to: email,
      subject: 'Đặt lại mật khẩu - PAW LOVERS',
      template: 'reset-password',
      emailType: 'password_reset',
      context: {
        userName,
        resetUrl,
        expiryTime: '15 phút',
      },
    });
  }

  /**
   * Send registration success email
   */
  async sendRegistrationSuccessEmail(
    email: string,
    userName: string,
    userType: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Chào mừng bạn đến với PAW LOVERS',
      template: 'registration-success',
      emailType: 'registration_success',
      context: {
        userName,
        userType,
        loginUrl: `${this.configService.get('FRONTEND_URL')}/login`,
      },
    });
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminderEmail(
    email: string,
    appointmentDetails: {
      ownerName: string;
      petName: string;
      serviceName: string;
      appointmentDate: string;
      appointmentTime: string;
      veterinarianName?: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Nhắc nhở lịch hẹn - PAW LOVERS',
      template: 'appointment-reminder',
      emailType: 'appointment_reminder',
      context: appointmentDetails,
    });
  }

  /**
   * Send appointment status update email
   */
  async sendAppointmentStatusUpdateEmail(
    email: string,
    appointmentDetails: {
      ownerName: string;
      petName: string;
      serviceName: string;
      appointmentDate: string;
      appointmentTime: string;
      status: string;
      statusMessage: string;
    },
  ): Promise<void> {
    this.logger.log(
      `[EMAIL SERVICE] sendAppointmentStatusUpdateEmail called for ${email}`,
    );
    this.logger.log(
      `[EMAIL SERVICE] Details: ${JSON.stringify(appointmentDetails)}`,
    );

    await this.sendEmail({
      to: email,
      subject: 'Cập nhật lịch hẹn - PAW LOVERS',
      template: 'appointment-status-update',
      emailType: 'appointment_status_update',
      context: appointmentDetails,
    });

    this.logger.log(`[EMAIL SERVICE] sendEmail completed for ${email}`);
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(
    email: string,
    paymentDetails: {
      ownerName: string;
      invoiceNumber: string;
      amount: string;
      paymentMethod: string;
      transactionId: string;
      paymentDate: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Xác nhận thanh toán - PAW LOVERS',
      template: 'payment-confirmation',
      emailType: 'payment_confirmation',
      context: paymentDetails,
    });
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(
    email: string,
    invoiceDetails: {
      ownerName: string;
      invoiceNumber: string;
      issueDate: string;
      totalAmount: string;
      items: Array<{ name: string; quantity: number; price: string }>;
      invoiceUrl: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Hóa đơn #${invoiceDetails.invoiceNumber} - PAW LOVERS`,
      template: 'invoice',
      emailType: 'invoice',
      context: invoiceDetails,
    });
  }

  /**
   * Send medical record notification email
   */
  async sendMedicalRecordNotificationEmail(
    email: string,
    medicalDetails: {
      ownerName: string;
      petName: string;
      diagnosis: string;
      treatment: string;
      veterinarianName: string;
      recordDate: string;
      followUpDate?: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Hồ sơ y tế mới - PAW LOVERS',
      template: 'medical-record-notification',
      emailType: 'medical_record_notification',
      context: medicalDetails,
    });
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedEmail(
    email: string,
    paymentDetails: {
      ownerName: string;
      invoiceNumber: string;
      amount: string;
      failureReason: string;
      retryUrl: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Thanh toán thất bại - PAW LOVERS',
      template: 'payment-failed',
      emailType: 'payment_failed',
      context: paymentDetails,
    });
  }
}
