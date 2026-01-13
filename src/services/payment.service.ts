import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment.entity';
import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import type {
  IPaymentGatewayService,
  PaymentCallbackData,
} from './interfaces/payment-gateway.interface';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  InitiateOnlinePaymentDto,
  VNPayCallbackDto,
  ProcessRefundDto,
  GetPaymentHistoryQueryDto,
} from '../dto/payment';
import { VNPayService } from './vnpay.service';
import { EmailService } from './email.service';
import {
  OwnershipValidationHelper,
  UserContext,
} from './helpers/ownership-validation.helper';

/**
 * PaymentService (PaymentManager)
 *
 * Handles invoice generation from completed appointments.
 * Records payment transactions (cash, bank transfer, and online via VNPay).
 * Integrates with payment gateways via IPaymentGatewayService interface.
 * Manages payment callbacks and transaction records.
 * Uses Active Record pattern with business logic in entities.
 *
 * @refactored Phase 1 - Uses OwnershipValidationHelper for pet ownership checks
 */
@Injectable()
export class PaymentService {
  // Remove this for production
  DEFAULT_GATEWAY = PaymentMethod.VNPAY;
  TAX_RATE = 0.1;

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentGatewayArchive)
    private readonly paymentGatewayArchiveRepository: Repository<PaymentGatewayArchive>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    private readonly vnpayService: VNPayService,
    private readonly ownershipHelper: OwnershipValidationHelper,
    private readonly emailService: EmailService,
  ) {}

  getGateway(paymentMethod: PaymentMethod): IPaymentGatewayService {
    switch (paymentMethod) {
      case PaymentMethod.VNPAY:
        return this.vnpayService;
      // case PaymentMethod.MOMO:
      //   return this.momoService;
      default:
        return this.vnpayService; // Default gateway
    }
  }

  /**
   * Processes cash/bank transfer payment and updates invoice status.
   * @throws PaymentProcessingException, InsufficientFundsException
   */
  async processPayment(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // 1. Find invoice
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceId: dto.invoiceId },
    });

    if (!invoice) {
      I18nException.notFound('errors.notFound.invoice', {
        id: dto.invoiceId,
      });
    }

    // 2. Validate invoice status
    if (!invoice.canPayByCash()) {
      I18nException.badRequest('errors.badRequest.invalidInvoiceStatus', {
        status: invoice.status,
      });
    }

    // 3. Validate payment amount
    if (dto.amount !== Number(invoice.totalAmount)) {
      I18nException.badRequest('errors.badRequest.paymentAmountMismatch', {
        amount: dto.amount,
        total: invoice.totalAmount,
      });
    }

    // 4. Validate payment method and create payment
    if (dto.paymentMethod !== PaymentMethod.CASH) {
      I18nException.badRequest('errors.badRequest.useOnlinePaymentMethod', {
        method: dto.paymentMethod,
      });
    }

    if (!dto.receivedBy) {
      I18nException.badRequest('errors.badRequest.missingRequiredField', {
        field: 'receivedBy',
      });
    }

    const payment = Payment.createCashPayment({
      invoiceId: dto.invoiceId,
      amount: dto.amount,
      receivedBy: dto.receivedBy,
      notes: dto.notes,
    });

    // Process cash payment immediately
    payment.processCash();

    // 5. Update invoice status
    invoice.payByCash();

    // 6. Persist changes (payment first, then invoice)
    const savedPayment = await this.paymentRepository.save(payment);
    await this.invoiceRepository.save(invoice);

    // 7. Return payment DTO
    return PaymentResponseDto.fromEntity(savedPayment);
  }

  /**
   * Initiates online payment and returns payment URL.
   * If PET_OWNER, validates they own the invoice.
   * @throws InvoiceNotFoundException, PaymentGatewayException
   */
  async initiateOnlinePayment(
    dto: InitiateOnlinePaymentDto,
    user?: UserContext,
  ): Promise<{ paymentUrl: string; paymentId: number }> {
    // 1. Find invoice with appointment and pet relations
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceId: dto.invoiceId },
      relations: ['appointment', 'appointment.pet'],
    });

    if (!invoice) {
      I18nException.notFound('errors.notFound.invoice', {
        id: dto.invoiceId,
      });
    }

    // 2. Validate ownership via helper
    await this.ownershipHelper.validateAppointmentOwnership(
      invoice.appointment,
      user,
    );

    // 3. Check for existing processing payment and cancel it (allow re-initiation)
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        invoiceId: dto.invoiceId,
        paymentStatus: PaymentStatus.PROCESSING,
      },
    });

    if (existingPayment) {
      // Cancel the previous pending payment
      existingPayment.markFailed({
        reason: 'Cancelled - New payment initiated',
      });
      await this.paymentRepository.save(existingPayment);

      // Reset invoice to PENDING to allow new payment
      invoice.status = InvoiceStatus.PENDING;
      await this.invoiceRepository.save(invoice);
    }

    // 4. Validate invoice status
    if (!invoice.canStartOnlinePayment()) {
      I18nException.badRequest('errors.badRequest.invalidInvoiceStatus', {
        status: invoice.status,
      });
    }

    // 5. Generate idempotency key
    const idempotencyKey = `${dto.invoiceId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 6. Create payment (online payment)
    const payment = Payment.createOnlinePayment({
      invoiceId: dto.invoiceId,
      amount: Number(invoice.totalAmount),
      paymentMethod: dto.paymentMethod,
      idempotencyKey,
    });

    // Start online payment process
    payment.startOnlinePayment();
    invoice.startOnlinePayment();

    // 7. Persist payment and invoice updates
    const savedPayment = await this.paymentRepository.save(payment);
    await this.invoiceRepository.save(invoice);

    // 8. Generate payment URL via gateway service
    const paymentUrlResponse = await this.getGateway(
      this.DEFAULT_GATEWAY,
    ).generatePaymentUrl({
      orderId: savedPayment.paymentId.toString(),
      amount: Number(invoice.totalAmount),
      orderDescription: `Payment for invoice ${invoice.invoiceNumber}`,
      returnUrl: dto.returnUrl || '',
      ipAddress: dto.ipAddress || '127.0.0.1',
      locale: dto.locale || 'vn',
    });

    return {
      paymentUrl: paymentUrlResponse.paymentUrl,
      paymentId: savedPayment.paymentId,
    };
  }

  /**
   * Processes payment gateway callback and updates invoice status.
   * @throws InvalidCallbackException, InvoiceNotFoundException
   */
  async handleVNPayCallback(
    callbackDto: VNPayCallbackDto,
  ): Promise<{ success: boolean; message: string }> {
    // 1. Verify callback signature

    const callbackData: PaymentCallbackData = { ...callbackDto };
    const verification = await this.getGateway(
      PaymentMethod.VNPAY,
    ).verifyCallback(callbackData);

    if (!verification.isValid) {
      I18nException.badRequest('errors.badRequest.invalidValue', {
        field: 'signature',
      });
    }

    // 2. Find payment by order ID (payment ID stored in vnp_TxnRef)
    const paymentId = parseInt(callbackDto.vnp_TxnRef);
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['invoice', 'invoice.appointment', 'invoice.appointment.pet', 'invoice.appointment.pet.owner', 'invoice.appointment.pet.owner.account'],
    });

    if (!payment) {
      I18nException.notFound('errors.notFound.payment', {
        id: paymentId,
      });
    }

    const invoice = payment.invoice;

    // 3. Update payment and invoice based on callback result
    if (verification.status === 'SUCCESS') {
      payment.markSuccess(verification.transactionId!, verification.rawData);
      invoice.markPaid();
    } else {
      payment.markFailed(verification.rawData);
      // Keep invoice in PENDING status to allow retry
      // Only managers can mark invoice as FAILED
      invoice.status = InvoiceStatus.PENDING;
    }

    // 4. Persist updates
    await this.paymentRepository.save(payment);
    await this.invoiceRepository.save(invoice);

    // 5. Archive gateway response
    await this.archiveGatewayResponse(
      paymentId,
      this.getGateway(this.DEFAULT_GATEWAY).getGatewayName(),
      verification.rawData,
      new Date(),
    );

    // 6. Send email notification
    await this.sendPaymentEmail(payment, invoice, verification.status === 'SUCCESS');

    return {
      success: verification.status === 'SUCCESS',
      message: verification.message,
    };
  }

  /**
   * Handles VNPay IPN (Instant Payment Notification)
   * This is a server-to-server callback from VNPay to confirm payment status.
   * More reliable than return URL callback as it's not dependent on user's browser.
   *
   * @param ipnDto VNPay IPN callback data
   * @returns VNPay-compliant response {RspCode: '00', Message: 'success'}
   * @throws InvalidCallbackException, InvoiceNotFoundException
   */
  async handleVnpayIpn(
    ipnDto: VNPayCallbackDto,
  ): Promise<{ RspCode: string; Message: string }> {
    console.log('=== VNPay IPN Received ===');
    console.log('Order ID:', ipnDto.vnp_TxnRef);
    console.log('Response Code:', ipnDto.vnp_ResponseCode);

    try {
      // 1. Verify IPN signature using vnpayService
      const ipnData = { ...ipnDto };

      const verification = await this.vnpayService.verifyIpn(ipnData);

      // 2. If signature is invalid, return error response to VNPay
      if (!verification.isValid) {
        console.error('Invalid IPN signature');
        return this.vnpayService.generateIpnResponse(
          false,
          'Invalid signature',
        );
      }

      // 3. Find payment by order ID (payment ID stored in vnp_TxnRef)
      const paymentId = parseInt(ipnDto.vnp_TxnRef);
      const payment = await this.paymentRepository.findOne({
        where: { paymentId },
        relations: ['invoice'],
      });

      // 4. If payment not found, return error response
      if (!payment) {
        console.error('Payment not found:', paymentId);
        return this.vnpayService.generateIpnResponse(false, 'Order not found');
      }

      // 5. Check if already processed (idempotency)
      if (
        payment.paymentStatus === PaymentStatus.SUCCESS &&
        payment.transactionId === verification.transactionId
      ) {
        console.log('IPN already processed:', verification.transactionId);
        return this.vnpayService.generateIpnResponse(
          true,
          'Order already confirmed',
        );
      }

      // 6. Validate amount matches
      if (Number(payment.amount) !== verification.amount) {
        console.error('Amount mismatch:', {
          expected: payment.amount,
          received: verification.amount,
        });
        return this.vnpayService.generateIpnResponse(false, 'Invalid amount');
      }

      const invoice = payment.invoice;

      // 7. Update payment and invoice based on IPN result
      if (verification.status === 'SUCCESS') {
        payment.markSuccess(verification.transactionId!, verification.rawData);
        invoice.markPaid();
        console.log('Payment marked as SUCCESS');
      } else {
        payment.markFailed(verification.rawData);
        // Keep invoice in PENDING status to allow retry
        // Only managers can mark invoice as FAILED
        invoice.status = InvoiceStatus.PENDING;
        console.log('Payment marked as FAILED, invoice returned to PENDING');
      }

      // 8. Persist updates
      await this.paymentRepository.save(payment);
      await this.invoiceRepository.save(invoice);

      // 9. Archive gateway response
      await this.archiveGatewayResponse(
        paymentId,
        this.vnpayService.getGatewayName(),
        verification.rawData,
        new Date(),
      );

      console.log('IPN processed successfully');

      // 10. Return success response to VNPay
      return this.vnpayService.generateIpnResponse(
        true,
        verification.status === 'SUCCESS' ? 'Order confirmed' : 'Order failed',
      );
    } catch (error: any) {
      // Log error but still return response to VNPay to avoid retries
      console.error('Error processing IPN:', error);
      return this.vnpayService.generateIpnResponse(false, 'System error');
    }
  }

  /**
   * Processes full or partial refund through payment gateway.
   * @throws PaymentNotFoundException, RefundException
   */
  async processRefund(
    paymentId: number,
    dto: ProcessRefundDto,
  ): Promise<PaymentResponseDto> {
    // 1. Find payment
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
    });

    if (!payment) {
      I18nException.notFound('errors.notFound.payment', {
        id: paymentId,
      });
    }

    // 2. Validate refund can be processed
    if (!payment.canRefund()) {
      I18nException.badRequest('errors.badRequest.invalidPaymentStatus', {
        status: payment.paymentStatus,
      });
    }

    // 3. Validate refund amount
    if (dto.amount > Number(payment.amount)) {
      I18nException.badRequest('errors.badRequest.refundAmountExceeded', {
        refundAmount: dto.amount,
        paymentAmount: payment.amount,
      });
    }

    // 4. Process refund via gateway (if online payment)
    if (payment.paymentMethod !== PaymentMethod.CASH && payment.transactionId) {
      const refundResponse = await this.getGateway(
        this.DEFAULT_GATEWAY,
      ).initiateRefund({
        transactionId: payment.transactionId,
        amount: dto.amount,
        reason: dto.reason,
        orderId: paymentId.toString(),
      });

      if (!refundResponse.success) {
        I18nException.badRequest('errors.badRequest.refundFailed', {
          message: refundResponse.message,
        });
      }

      // Archive refund gateway response
      await this.archiveGatewayResponse(
        paymentId,
        this.getGateway(this.DEFAULT_GATEWAY).getGatewayName(),
        refundResponse.rawData,
        new Date(),
      );
    }

    // 5. Update payment
    payment.refund(dto.amount, dto.reason);

    // 6. Persist changes
    const savedPayment = await this.paymentRepository.save(payment);

    // 7. Return DTO
    return PaymentResponseDto.fromEntity(savedPayment);
  }

  /**
   * Retrieves payment history for date range.
   */
  async getPaymentHistory(
    query: GetPaymentHistoryQueryDto,
  ): Promise<PaymentResponseDto[]> {
    const whereClause: FindOptionsWhere<Payment> = {};

    // Add date range filter
    if (query.startDate && query.endDate) {
      whereClause.paidAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }

    // Note: customerId filter would require joining through invoice -> appointment -> pet -> petOwner
    // For simplicity, implementing basic date range filter
    // TODO: Add customerId filter with proper joins

    const payments = await this.paymentRepository.find({
      where: whereClause,
      relations: ['invoice'],
      order: { paidAt: 'DESC' },
    });

    return payments.map((payment) => PaymentResponseDto.fromEntity(payment));
  }

  /**
   * Generates payment receipt with transaction details.
   * If PET_OWNER, validates they own the invoice.
   */
  async generateReceipt(paymentId: number, user?: UserContext): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: [
        'invoice',
        'invoice.appointment',
        'invoice.appointment.service',
        'invoice.appointment.pet',
      ],
    });

    if (!payment) {
      I18nException.notFound('errors.notFound.payment', {
        id: paymentId,
      });
    }

    // Validate ownership via helper
    await this.ownershipHelper.validateAppointmentOwnership(
      payment.invoice?.appointment,
      user,
    );

    // Build receipt object
    const appointmentServices =
      payment.invoice.appointment?.appointmentServices || [];
    const services = appointmentServices
      .filter((as) => as.service)
      .map((as) => ({
        serviceId: as.service.serviceId,
        serviceName: as.service.serviceName,
        basePrice: Number(as.service.basePrice),
      }));

    const receipt = {
      receiptNumber: `RCP-${paymentId}`,
      paymentId: payment.paymentId,
      invoiceNumber: payment.invoice.invoiceNumber,
      paymentDate: payment.paidAt,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      transactionId: payment.transactionId,
      status: payment.paymentStatus,
      services, // ALL services
      petName: payment.invoice.appointment?.pet?.name,
      notes: payment.notes,
    };

    return receipt;
  }

  /**
   * Verifies payment status with payment gateway.
   */
  async verifyPayment(paymentId: number): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['invoice'],
    });

    if (!payment) {
      I18nException.notFound('errors.notFound.payment', {
        id: paymentId,
      });
    }

    // Only verify online payments
    if (payment.paymentMethod === PaymentMethod.CASH) {
      return {
        verified: true,
        status: payment.paymentStatus,
        message: 'Cash payment - no gateway verification needed',
      };
    }

    // Query gateway for transaction status
    const queryResult = await this.getGateway(
      this.DEFAULT_GATEWAY,
    ).queryTransaction({
      orderId: paymentId.toString(),
      transactionDate: payment.createdAt,
    });

    return {
      verified: queryResult.found,
      status: queryResult.status,
      transactionId: queryResult.transactionId,
      amount: queryResult.amount,
      gatewayData: queryResult.rawData,
    };
  }

  // ===== Private Helper Methods =====

  /**
   * Archives gateway response for compliance and debugging
   */
  private async archiveGatewayResponse(
    paymentId: number,
    gatewayName: string,
    gatewayResponse: object,
    transactionTimestamp: Date,
  ): Promise<void> {
    const archive = this.paymentGatewayArchiveRepository.create({
      paymentId,
      gatewayName,
      gatewayResponse,
      transactionTimestamp,
    });

    await this.paymentGatewayArchiveRepository.save(archive);
  }

  /**
   * Gets all payments with optional filters.
   */
  async getAllPayments(filters: {
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaymentResponseDto[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice');

    if (filters.status) {
      queryBuilder.andWhere('payment.status = :status', {
        status: filters.status,
      });
    }

    if (filters.method) {
      queryBuilder.andWhere('payment.paymentMethod = :method', {
        method: filters.method,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    const entities = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .getMany();

    return entities.map((entity) => PaymentResponseDto.fromEntity(entity));
  }

  /**
   * Helper method to send payment notification email
   */
  private async sendPaymentEmail(
    payment: Payment,
    invoice: Invoice,
    isSuccess: boolean,
  ): Promise<void> {
    try {
      const ownerEmail = invoice.appointment?.pet?.owner?.account?.email;
      const ownerName = invoice.appointment?.pet?.owner?.fullName || 'Quý khách';

      if (!ownerEmail) {
        console.log('[EMAIL] No owner email found for payment notification');
        return;
      }

      const paymentDate = new Date(payment.createdAt);
      const formattedDate = paymentDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      if (isSuccess) {
        await this.emailService.sendPaymentConfirmationEmail(ownerEmail, {
          ownerName,
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(payment.amount).toLocaleString('vi-VN') + ' VNĐ',
          paymentMethod: payment.paymentMethod,
          transactionId: payment.transactionId || 'N/A',
          paymentDate: formattedDate,
        });
        console.log(`[EMAIL] Payment confirmation sent to ${ownerEmail}`);
      } else {
        await this.emailService.sendPaymentFailedEmail(ownerEmail, {
          ownerName,
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(payment.amount).toLocaleString('vi-VN') + ' VNĐ',
          failureReason: 'Thanh toán không thành công. Vui lòng thử lại.',
          retryUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice.invoiceId}`,
        });
        console.log(`[EMAIL] Payment failed notification sent to ${ownerEmail}`);
      }
    } catch (error) {
      // Log but don't fail the operation if email fails
      console.error(
        `[EMAIL] Failed to send payment email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
