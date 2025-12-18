import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { InvoiceService } from '../services/invoice.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceResponseDto,
} from '../dto/invoice';

/**
 * InvoiceController
 *
 * Handles invoice management and payment status transitions.
 * Routes: /api/invoices
 */
@ApiTags('Invoice Management')
@Controller('api/invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  // ============================================
  // INVOICE CRUD
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create new invoice for appointment' })
  @ApiResponse({
    status: 201,
    description: 'Invoice created',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({
    status: 409,
    description: 'Invoice already exists for appointment',
  })
  async createInvoice(
    @Body() dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.createInvoice(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({
    status: 200,
    description: 'List of all invoices',
    type: [InvoiceResponseDto],
  })
  async getAllInvoices(): Promise<InvoiceResponseDto[]> {
    return this.invoiceService.getAllInvoices();
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue invoices (unpaid after 30 days)' })
  @ApiResponse({
    status: 200,
    description: 'List of overdue invoices',
    type: [InvoiceResponseDto],
  })
  async getOverdueInvoices(): Promise<InvoiceResponseDto[]> {
    return this.invoiceService.getOverdueInvoices();
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Get invoices by status' })
  @ApiQuery({
    name: 'status',
    enum: ['PENDING', 'PROCESSING_ONLINE', 'PAID', 'FAILED'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of invoices by status',
    type: [InvoiceResponseDto],
  })
  async getInvoicesByStatus(
    @Query('status') status: string,
  ): Promise<InvoiceResponseDto[]> {
    return this.invoiceService.getInvoicesByStatus(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.getInvoiceById(id);
  }

  @Get('number/:invoiceNumber')
  @ApiOperation({ summary: 'Get invoice by invoice number' })
  @ApiParam({ name: 'invoiceNumber', type: String })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceByNumber(
    @Param('invoiceNumber') invoiceNumber: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.getInvoiceByNumber(invoiceNumber);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get invoice by appointment ID' })
  @ApiParam({ name: 'appointmentId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceByAppointment(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.getInvoiceByAppointment(appointmentId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update invoice details (discount, tax, notes)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Invoice updated',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async updateInvoice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.updateInvoice(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice (only if not paid)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Invoice deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete paid invoice' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async deleteInvoice(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.invoiceService.deleteInvoice(id);
    return { message: 'Invoice deleted successfully' };
  }

  // ============================================
  // PAYMENT STATUS TRANSITIONS
  // ============================================

  @Put(':id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Invoice marked as paid',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invoice already paid' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async markAsPaid(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.markAsPaid(id);
  }

  @Put(':id/mark-failed')
  @ApiOperation({ summary: 'Mark invoice payment as failed' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Invoice marked as failed',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot mark paid invoice as failed',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async markAsFailed(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.markAsFailed(id);
  }

  @Put(':id/mark-processing')
  @ApiOperation({ summary: 'Mark invoice as processing (online payment)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Invoice marked as processing',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot process already paid invoice',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async markAsProcessing(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.markAsProcessing(id);
  }
}
