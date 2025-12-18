import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Payment, PaymentMethod } from '../entities/payment.entity';
import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import type { IPaymentGatewayService } from './interfaces/payment-gateway.interface';
import { CreateInvoiceDto, InvoiceResponseDto } from '../dto/invoice';
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
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
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
   * Creates invoice from appointment with itemized charges.
   * Auto-calculates amounts from appointment service prices.
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

    // 4. Calculate invoice amounts from service
    const servicePrice = Number(appointment.service.basePrice);
    const subtotal = servicePrice;

    // Apply discount (TODO: implement discount code lookup)
    let discount = 0;
    if (dto.discountCode) {
      // TODO: Look up discount code and calculate discount amount
      // For now, placeholder implementation
      discount = 0;
    }

    // Calculate tax (10% VAT - should come from config)
    const tax = (subtotal - discount) * this.TAX_RATE;

    // Calculate total
    const totalAmount = subtotal - discount + tax;

    // 5. Auto-generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // 6. Create invoice entity
    const invoice = this.invoiceRepository.create({
      appointmentId: dto.appointmentId,
      invoiceNumber,
      issueDate: new Date(),
      subtotal,
      discount,
      tax,
      totalAmount,
      notes: dto.notes,
      status: InvoiceStatus.PENDING,
    });

    // 7. Persist invoice
    const savedInvoice = await this.invoiceRepository.save(invoice);

    // 8. Return DTO
    return InvoiceResponseDto.fromEntity(savedInvoice);
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
      throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found`);
    }

    // 2. Validate invoice status
    if (!invoice.canPayByCash()) {
      throw new BadRequestException(
        `Cannot process payment: invoice status is ${invoice.status}`,
      );
    }

    // 3. Validate payment amount
    if (dto.amount !== Number(invoice.totalAmount)) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) does not match invoice total (${invoice.totalAmount})`,
      );
    }

    // 4. Validate payment method and create payment
    if (dto.paymentMethod !== PaymentMethod.CASH) {
      throw new BadRequestException(
        `Use initiateOnlinePayment for ${dto.paymentMethod} payments`,
      );
    }

    if (!dto.receivedBy) {
      throw new BadRequestException('receivedBy is required for cash payments');
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
   * @throws InvoiceNotFoundException, PaymentGatewayException
   */
  async initiateOnlinePayment(
    dto: InitiateOnlinePaymentDto,
  ): Promise<{ paymentUrl: string; paymentId: number }> {
    // 1. Find invoice
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceId: dto.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found`);
    }

    // 2. Validate invoice status
    if (!invoice.canStartOnlinePayment()) {
      throw new BadRequestException(
        `Cannot start online payment: invoice status is ${invoice.status}`,
      );
    }

    // 3. Generate idempotency key
    const idempotencyKey = `${dto.invoiceId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 4. Create payment (online payment)
    const payment = Payment.createOnlinePayment({
      invoiceId: dto.invoiceId,
      amount: Number(invoice.totalAmount),
      paymentMethod: dto.paymentMethod,
      idempotencyKey,
    });

    // Start online payment process
    payment.startOnlinePayment();
    invoice.startOnlinePayment();

    // 5. Persist payment and invoice updates
    const savedPayment = await this.paymentRepository.save(payment);
    await this.invoiceRepository.save(invoice);

    // 6. Generate payment URL via gateway service
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

    const verification = await this.getGateway(
      this.DEFAULT_GATEWAY,
    ).verifyCallback(callbackDto as any);

    if (!verification.isValid) {
      throw new BadRequestException('Invalid callback signature');
    }

    // 2. Find payment by order ID (payment ID stored in vnp_TxnRef)
    const paymentId = parseInt(callbackDto.vnp_TxnRef);
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
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
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // 2. Validate refund can be processed
    if (!payment.canRefund()) {
      throw new BadRequestException(
        `Cannot refund: payment status is ${payment.paymentStatus}`,
      );
    }

    // 3. Validate refund amount
    if (dto.amount > Number(payment.amount)) {
      throw new BadRequestException(
        `Refund amount (${dto.amount}) cannot exceed payment amount (${payment.amount})`,
      );
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
        throw new BadRequestException(
          `Refund failed: ${refundResponse.message}`,
        );
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
   * Retrieves complete invoice details including line items.
   */
  async getInvoiceById(invoiceId: number): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceId },
      relations: ['appointment', 'appointment.service'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    return InvoiceResponseDto.fromEntity(invoice);
  }

  /**
   * Retrieves invoices by status (Pending, Processing, Paid, Failed).
   */
  async getInvoicesByStatus(status: string): Promise<InvoiceResponseDto[]> {
    // Validate status
    if (!Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      throw new BadRequestException(`Invalid invoice status: ${status}`);
    }

    const invoices = await this.invoiceRepository.find({
      where: { status: status as InvoiceStatus },
      relations: ['appointment'],
    });

    return invoices.map((invoice) => InvoiceResponseDto.fromEntity(invoice));
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
   */
  async generateReceipt(paymentId: number): Promise<any> {
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
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
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
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
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
   * Generates unique invoice number with format: INV-YYYYMMDD-XXXXX
   */
  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    // Count invoices created today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await this.invoiceRepository.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    // Generate sequential number (padded to 5 digits)
    const sequenceNumber = String(count + 1).padStart(5, '0');

    return `INV-${dateStr}-${sequenceNumber}`;
  }

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
