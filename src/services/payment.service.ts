import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Payment, PaymentMethod } from '../entities/payment.entity';
import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import type { IPaymentGatewayService } from './interfaces/payment-gateway.interface';
import { InvoiceDomainModel } from '../domain/invoice.domain';
import { PaymentDomainModel } from '../domain/payment.domain';
import { InvoiceMapper } from '../mappers/invoice.mapper';
import { PaymentMapper } from '../mappers/payment.mapper';
import { CreateInvoiceDto, InvoiceResponseDto } from '../dto/invoice';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  InitiateOnlinePaymentDto,
  VNPayCallbackDto,
  ProcessRefundDto,
  GetPaymentHistoryQueryDto,
} from '../dto/payment';

/**
 * PaymentService (PaymentManager)
 *
 * Handles invoice generation from completed appointments.
 * Records payment transactions (cash, bank transfer, and online via VNPay).
 * Integrates with payment gateways via IPaymentGatewayService interface.
 * Manages payment callbacks and transaction records.
 * Follows DDD pattern with domain models and mappers.
 */
@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentGatewayArchive)
    private readonly paymentGatewayArchiveRepository: Repository<PaymentGatewayArchive>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @Inject('IPaymentGatewayService')
    private readonly gatewayService: IPaymentGatewayService,
  ) {}

  /**
   * Creates invoice from appointment with itemized charges.
   * @throws AppointmentNotFoundException, InvoiceAlreadyExistsException
   */
  async generateInvoice(dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    // 1. Find appointment with service relation
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId: dto.appointmentId },
      relations: ['service', 'invoice'],
    });

    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${dto.appointmentId} not found`,
      );
    }

    // 2. Check if invoice already exists
    if (appointment.invoice) {
      throw new ConflictException(
        `Invoice already exists for appointment ${dto.appointmentId}`,
      );
    }

    // 3. Validate appointment status
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        `Cannot generate invoice: appointment status is ${appointment.status}, expected COMPLETED`,
      );
    }

    // 4. Create invoice domain model
    const invoiceDomain = InvoiceDomainModel.create({
      appointmentId: dto.appointmentId,
      invoiceNumber: dto.invoiceNumber,
      subtotal: dto.subtotal,
      discount: dto.discount,
      tax: dto.tax,
      totalAmount: dto.totalAmount,
      notes: dto.notes,
    });

    // 5. Persist invoice
    const invoiceEntity = InvoiceMapper.toPersistence(invoiceDomain);
    const savedInvoice = await this.invoiceRepository.save(invoiceEntity);

    // 6. Convert to domain and return DTO
    const savedDomain = InvoiceMapper.toDomain(savedInvoice);
    return InvoiceResponseDto.fromDomain(savedDomain);
  }

  /**
   * Processes cash/bank transfer payment and updates invoice status.
   * @throws PaymentProcessingException, InsufficientFundsException
   */
  async processPayment(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // 1. Find invoice
    const invoiceEntity = await this.invoiceRepository.findOne({
      where: { invoiceId: dto.invoiceId },
    });

    if (!invoiceEntity) {
      throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found`);
    }

    const invoiceDomain = InvoiceMapper.toDomain(invoiceEntity);

    // 2. Validate invoice status
    if (!invoiceDomain.canPayByCash()) {
      throw new BadRequestException(
        `Cannot process payment: invoice status is ${invoiceDomain.status}`,
      );
    }

    // 3. Validate payment amount
    if (dto.amount !== invoiceDomain.totalAmount) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) does not match invoice total (${invoiceDomain.totalAmount})`,
      );
    }

    // 4. Create payment domain model (cash payment)
    let paymentDomain: PaymentDomainModel;

    if (dto.paymentMethod === PaymentMethod.CASH) {
      if (!dto.receivedBy) {
        throw new BadRequestException(
          'receivedBy is required for cash payments',
        );
      }
      paymentDomain = PaymentDomainModel.createCashPayment({
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        receivedBy: dto.receivedBy,
        notes: dto.notes,
      });
      // Process cash payment immediately
      paymentDomain.processCash();
    } else {
      throw new BadRequestException(
        `Use initiateOnlinePayment for ${dto.paymentMethod} payments`,
      );
    }

    // 5. Update invoice status
    invoiceDomain.payByCash();

    // 6. Persist changes (payment first, then invoice)
    const paymentEntity = PaymentMapper.toPersistence(paymentDomain);
    const savedPayment = await this.paymentRepository.save(paymentEntity);

    const invoiceUpdateEntity = InvoiceMapper.toPersistence(invoiceDomain);
    await this.invoiceRepository.save(invoiceUpdateEntity);

    // 7. Return payment DTO
    const savedPaymentDomain = PaymentMapper.toDomain(savedPayment);
    return PaymentResponseDto.fromDomain(savedPaymentDomain);
  }

  /**
   * Initiates online payment and returns payment URL.
   * @throws InvoiceNotFoundException, PaymentGatewayException
   */
  async initiateOnlinePayment(
    dto: InitiateOnlinePaymentDto,
  ): Promise<{ paymentUrl: string; paymentId: number }> {
    // 1. Find invoice
    const invoiceEntity = await this.invoiceRepository.findOne({
      where: { invoiceId: dto.invoiceId },
    });

    if (!invoiceEntity) {
      throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found`);
    }

    const invoiceDomain = InvoiceMapper.toDomain(invoiceEntity);

    // 2. Validate invoice status
    if (!invoiceDomain.canStartOnlinePayment()) {
      throw new BadRequestException(
        `Cannot start online payment: invoice status is ${invoiceDomain.status}`,
      );
    }

    // 3. Generate idempotency key
    const idempotencyKey = `${dto.invoiceId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 4. Create payment domain model (online payment)
    const paymentDomain = PaymentDomainModel.createOnlinePayment({
      invoiceId: dto.invoiceId,
      amount: invoiceDomain.totalAmount,
      paymentMethod: dto.paymentMethod,
      idempotencyKey,
    });

    // Start online payment process
    paymentDomain.startOnlinePayment();
    invoiceDomain.startOnlinePayment();

    // 5. Persist payment and invoice updates
    const paymentEntity = PaymentMapper.toPersistence(paymentDomain);
    const savedPayment = await this.paymentRepository.save(paymentEntity);

    const invoiceUpdateEntity = InvoiceMapper.toPersistence(invoiceDomain);
    await this.invoiceRepository.save(invoiceUpdateEntity);

    // 6. Generate payment URL via gateway service
    const paymentUrlResponse = await this.gatewayService.generatePaymentUrl({
      orderId: savedPayment.paymentId.toString(),
      amount: invoiceDomain.totalAmount,
      orderDescription: `Payment for invoice ${invoiceDomain.invoiceNumber}`,
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
    const verification = await this.gatewayService.verifyCallback(
      callbackDto as any,
    );

    if (!verification.isValid) {
      throw new BadRequestException('Invalid callback signature');
    }

    // 2. Find payment by order ID (payment ID stored in vnp_TxnRef)
    const paymentId = parseInt(callbackDto.vnp_TxnRef);
    const paymentEntity = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['invoice'],
    });

    if (!paymentEntity) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    const paymentDomain = PaymentMapper.toDomain(paymentEntity);
    const invoiceDomain = InvoiceMapper.toDomain(paymentEntity.invoice);

    // 3. Update payment and invoice based on callback result
    if (verification.status === 'SUCCESS') {
      paymentDomain.markSuccess(
        verification.transactionId!,
        verification.rawData,
      );
      invoiceDomain.markPaid();
    } else {
      paymentDomain.markFailed(verification.rawData);
      invoiceDomain.markFailed();
    }

    // 4. Persist updates
    const paymentUpdateEntity = PaymentMapper.toPersistence(paymentDomain);
    await this.paymentRepository.save(paymentUpdateEntity);

    const invoiceUpdateEntity = InvoiceMapper.toPersistence(invoiceDomain);
    await this.invoiceRepository.save(invoiceUpdateEntity);

    // 5. Archive gateway response
    await this.archiveGatewayResponse(
      paymentId,
      this.gatewayService.getGatewayName(),
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
    const paymentEntity = await this.paymentRepository.findOne({
      where: { paymentId },
    });

    if (!paymentEntity) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    const paymentDomain = PaymentMapper.toDomain(paymentEntity);

    // 2. Validate refund can be processed
    if (!paymentDomain.canRefund()) {
      throw new BadRequestException(
        `Cannot refund: payment status is ${paymentDomain.paymentStatus}`,
      );
    }

    // 3. Validate refund amount
    if (dto.amount > paymentDomain.amount) {
      throw new BadRequestException(
        `Refund amount (${dto.amount}) cannot exceed payment amount (${paymentDomain.amount})`,
      );
    }

    // 4. Process refund via gateway (if online payment)
    if (
      paymentDomain.paymentMethod !== PaymentMethod.CASH &&
      paymentDomain.transactionId
    ) {
      const refundResponse = await this.gatewayService.initiateRefund({
        transactionId: paymentDomain.transactionId,
        amount: dto.amount,
        reason: dto.reason,
        orderId: paymentId.toString(),
      });

      if (!refundResponse.success) {
        throw new BadRequestException(
          `Refund failed: ${refundResponse.message}`,
        );
      }

      // Archive refund gateway response
      await this.archiveGatewayResponse(
        paymentId,
        this.gatewayService.getGatewayName(),
        refundResponse.rawData,
        new Date(),
      );
    }

    // 5. Update payment domain
    paymentDomain.refund(dto.amount, dto.reason);

    // 6. Persist changes
    const paymentUpdateEntity = PaymentMapper.toPersistence(paymentDomain);
    const savedPayment = await this.paymentRepository.save(paymentUpdateEntity);

    // 7. Return DTO
    const savedPaymentDomain = PaymentMapper.toDomain(savedPayment);
    return PaymentResponseDto.fromDomain(savedPaymentDomain);
  }

  /**
   * Retrieves complete invoice details including line items.
   */
  async getInvoiceById(invoiceId: number): Promise<InvoiceResponseDto> {
    const invoiceEntity = await this.invoiceRepository.findOne({
      where: { invoiceId },
      relations: ['appointment', 'appointment.service'],
    });

    if (!invoiceEntity) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    const invoiceDomain = InvoiceMapper.toDomain(invoiceEntity);
    return InvoiceResponseDto.fromDomain(invoiceDomain);
  }

  /**
   * Retrieves invoices by status (Pending, Processing, Paid, Failed).
   */
  async getInvoicesByStatus(status: string): Promise<InvoiceResponseDto[]> {
    // Validate status
    if (!Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      throw new BadRequestException(`Invalid invoice status: ${status}`);
    }

    const invoiceEntities = await this.invoiceRepository.find({
      where: { status: status as InvoiceStatus },
      relations: ['appointment'],
    });

    const invoiceDomains = InvoiceMapper.toDomainList(invoiceEntities);
    return invoiceDomains.map((domain) =>
      InvoiceResponseDto.fromDomain(domain),
    );
  }

  /**
   * Retrieves payment history for date range.
   */
  async getPaymentHistory(
    query: GetPaymentHistoryQueryDto,
  ): Promise<PaymentResponseDto[]> {
    const whereClause: any = {};

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

    const paymentEntities = await this.paymentRepository.find({
      where: whereClause,
      relations: ['invoice'],
      order: { paidAt: 'DESC' },
    });

    const paymentDomains = PaymentMapper.toDomainList(paymentEntities);
    return paymentDomains.map((domain) =>
      PaymentResponseDto.fromDomain(domain),
    );
  }

  /**
   * Generates payment receipt with transaction details.
   */
  async generateReceipt(paymentId: number): Promise<any> {
    const paymentEntity = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: [
        'invoice',
        'invoice.appointment',
        'invoice.appointment.service',
        'invoice.appointment.pet',
      ],
    });

    if (!paymentEntity) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // Build receipt object
    const receipt = {
      receiptNumber: `RCP-${paymentId}`,
      paymentId: paymentEntity.paymentId,
      invoiceNumber: paymentEntity.invoice.invoiceNumber,
      paymentDate: paymentEntity.paidAt,
      paymentMethod: paymentEntity.paymentMethod,
      amount: paymentEntity.amount,
      transactionId: paymentEntity.transactionId,
      status: paymentEntity.paymentStatus,
      service: paymentEntity.invoice.appointment?.service?.serviceName,
      petName: paymentEntity.invoice.appointment?.pet?.name,
      notes: paymentEntity.notes,
    };

    return receipt;
  }

  /**
   * Verifies payment status with payment gateway.
   */
  async verifyPayment(paymentId: number): Promise<any> {
    const paymentEntity = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['invoice'],
    });

    if (!paymentEntity) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // Only verify online payments
    if (paymentEntity.paymentMethod === PaymentMethod.CASH) {
      return {
        verified: true,
        status: paymentEntity.paymentStatus,
        message: 'Cash payment - no gateway verification needed',
      };
    }

    // Query gateway for transaction status
    const queryResult = await this.gatewayService.queryTransaction({
      orderId: paymentId.toString(),
      transactionDate: paymentEntity.createdAt,
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
}
