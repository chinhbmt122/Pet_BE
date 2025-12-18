import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { CreateInvoiceDto, InvoiceResponseDto } from '../dto/invoice';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  InitiateOnlinePaymentDto,
  VNPayCallbackDto,
  ProcessRefundDto,
  GetPaymentHistoryQueryDto,
} from '../dto/payment';
import { InvoiceStatus } from '../entities/types/entity.types';

/**
 * PaymentController
 *
 * Manages payment processing and invoice endpoints.
 * Routes: GET /api/invoices/:id, POST /api/payments, GET /api/payments/history
 */
@ApiTags('Payment')
@Controller('api')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * POST /api/invoices/generate
   * Creates invoice from appointment with itemized charges.
   * @throws AppointmentNotFoundException, InvoiceAlreadyExistsException
   */
  @Post('invoices/generate')
  @ApiOperation({ summary: 'Generate invoice from appointment' })
  @ApiResponse({
    status: 201,
    description: 'Invoice generated',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'Invoice already exists' })
  async generateInvoice(
    @Body() dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return await this.paymentService.generateInvoice(dto);
  }

  /**
   * GET /api/invoices/:id
   * Retrieves complete invoice details including line items.
   */
  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', description: 'Invoice ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceResponseDto> {
    return await this.paymentService.getInvoiceById(id);
  }

  /**
   * GET /api/invoices
   * Retrieves invoices by status (Pending, Processing, Paid, Failed).
   */
  @Get('invoices')
  @ApiOperation({ summary: 'Get invoices by status' })
  @ApiQuery({
    name: 'status',
    enum: InvoiceStatus,
    description: 'Invoice status',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoices retrieved',
    type: [InvoiceResponseDto],
  })
  async getInvoicesByStatus(
    @Query('status') status: string,
  ): Promise<InvoiceResponseDto[]> {
    return await this.paymentService.getInvoicesByStatus(status);
  }

  /**
   * POST /api/payments
   * Processes cash/bank transfer payment and updates invoice status.
   * @throws PaymentProcessingException, InsufficientFundsException
   */
  @Post('payments')
  @ApiOperation({ summary: 'Process cash payment' })
  @ApiResponse({
    status: 201,
    description: 'Payment processed',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Payment processing failed' })
  async processPayment(
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return await this.paymentService.processPayment(dto);
  }

  /**
   * POST /api/payments/online/initiate
   * Initiates VNPay online payment and returns payment URL (UC-23).
   * @throws InvoiceNotFoundException, PaymentGatewayException
   */
  @Post('payments/online/initiate')
  @ApiOperation({ summary: 'Initiate online payment (VNPay)' })
  @ApiResponse({ status: 200, description: 'Payment URL generated' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async initiateOnlinePayment(
    @Body() dto: InitiateOnlinePaymentDto,
  ): Promise<{ paymentUrl: string; paymentId: number }> {
    return await this.paymentService.initiateOnlinePayment(dto);
  }

  /**
   * POST /api/payments/vnpay/callback
   * Processes VNPay payment callback and updates invoice status (UC-23).
   * @throws InvalidCallbackException, InvoiceNotFoundException
   */
  @Post('payments/vnpay/callback')
  @ApiOperation({ summary: 'VNPay payment callback (webhook)' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  @ApiResponse({ status: 400, description: 'Invalid callback' })
  async handlePaymentCallback(
    @Body() dto: VNPayCallbackDto,
  ): Promise<{ success: boolean; message: string }> {
    return await this.paymentService.handlePaymentCallback(dto);
  }

  /**
   * GET /api/payments/history
   * Retrieves payment history for date range.
   */
  @Get('payments/history')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved',
    type: [PaymentResponseDto],
  })
  async getPaymentHistory(
    @Query() query: GetPaymentHistoryQueryDto,
  ): Promise<PaymentResponseDto[]> {
    return await this.paymentService.getPaymentHistory(query);
  }

  /**
   * POST /api/payments/:id/refund
   * Processes full or partial refund through payment gateway.
   * @throws PaymentNotFoundException, RefundException
   */
  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Process refund' })
  @ApiParam({ name: 'id', description: 'Payment ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Refund processed',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async processRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessRefundDto,
  ): Promise<PaymentResponseDto> {
    return await this.paymentService.processRefund(id, dto);
  }

  /**
   * GET /api/payments/:id/receipt
   * Generates payment receipt with transaction details.
   */
  @Get('payments/:id/receipt')
  @ApiOperation({ summary: 'Generate payment receipt' })
  @ApiParam({ name: 'id', description: 'Payment ID', type: Number })
  @ApiResponse({ status: 200, description: 'Receipt generated' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async generateReceipt(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.paymentService.generateReceipt(id);
  }

  /**
   * GET /api/payments/:id/verify
   * Verifies payment status with payment gateway.
   */
  @Get('payments/:id/verify')
  @ApiOperation({ summary: 'Verify payment status' })
  @ApiParam({ name: 'id', description: 'Payment ID', type: Number })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPayment(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.paymentService.verifyPayment(id);
  }
}
