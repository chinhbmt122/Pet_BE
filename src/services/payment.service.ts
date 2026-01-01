import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Payment, PaymentMethod } from '../entities/payment.entity';
import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { UserType } from '../entities/account.entity';
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

/**
 * PaymentService (PaymentManager)
 *
 * Handles invoice generation from completed appointments.
 * Records payment transactions (cash, bank transfer, and online via VNPay).
 * Integrates with payment gateways via IPaymentGatewayService interface.
 * Manages payment callbacks and transaction records.
 * Uses Active Record pattern with business logic in entities.
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
    user?: { accountId: number; userType: UserType },
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

    // 2. If PET_OWNER, validate they own this invoice
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (
        !petOwner ||
        invoice.appointment?.pet?.ownerId !== petOwner.petOwnerId
      ) {
        I18nException.notFound('errors.notFound.invoice', {
          id: dto.invoiceId,
        });
      }
    }

    // 3. Validate invoice status
    if (!invoice.canStartOnlinePayment()) {
      I18nException.badRequest('errors.badRequest.invalidInvoiceStatus', {
        status: invoice.status,
      });
    }

    // 4. Generate idempotency key
    const idempotencyKey = `${dto.invoiceId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 5. Create payment (online payment)
    const payment = Payment.createOnlinePayment({
      invoiceId: dto.invoiceId,
      amount: Number(invoice.totalAmount),
      paymentMethod: dto.paymentMethod,
      idempotencyKey,
    });

    // Start online payment process
    payment.startOnlinePayment();
    invoice.startOnlinePayment();

    // 6. Persist payment and invoice updates
    const savedPayment = await this.paymentRepository.save(payment);
    await this.invoiceRepository.save(invoice);

    // 7. Generate payment URL via gateway service
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
  async handlePaymentCallback(
    callbackDto: VNPayCallbackDto,
  ): Promise<{ success: boolean; message: string }> {
    // 1. Verify callback signature

    const callbackData: PaymentCallbackData = { ...callbackDto };
    const verification = await this.getGateway(
      this.DEFAULT_GATEWAY,
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
      relations: ['invoice'],
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
      invoice.markFailed();
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

    return {
      success: verification.status === 'SUCCESS',
      message: verification.message,
    };
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
  async generateReceipt(
    paymentId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<any> {
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

    // If PET_OWNER, validate they own the invoice
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (
        !petOwner ||
        payment.invoice?.appointment?.pet?.ownerId !== petOwner.petOwnerId
      ) {
        I18nException.notFound('errors.notFound.payment', {
          id: paymentId,
        });
      }
    }

    // Build receipt object
    const receipt = {
      receiptNumber: `RCP-${paymentId}`,
      paymentId: payment.paymentId,
      invoiceNumber: payment.invoice.invoiceNumber,
      paymentDate: payment.paidAt,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      transactionId: payment.transactionId,
      status: payment.paymentStatus,
      service: payment.invoice.appointment?.service?.serviceName,
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
}
