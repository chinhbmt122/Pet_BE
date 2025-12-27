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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InvoiceService } from '../services/invoice.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceResponseDto,
} from '../dto/invoice';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { Account, UserType } from '../entities/account.entity';
import { GetUser } from '../middleware/decorators/user.decorator';

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
  // THIS SHIT ISN'T USED

  /**
   * POST /api/invoices/generate
   * Creates invoice from appointment with itemized charges.
   * @throws AppointmentNotFoundException, InvoiceAlreadyExistsException
   */
  @Post('generate')
  @RouteConfig({
    message: 'Generate invoice (Staff only)',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
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
    return await this.invoiceService.generateInvoice(dto);
  }

  // OLD API
  // /**
  //  * GET /api/invoices
  //  * Retrieves invoices by status (Pending, Processing, Paid, Failed).
  //  */
  // @Get('invoices')
  // @RouteConfig({
  //   message: 'Get invoices by status',
  //   requiresAuth: true,
  //   roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  // })
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get invoices by status' })
  // @ApiQuery({
  //   name: 'status',
  //   enum: InvoiceStatus,
  //   description: 'Invoice status',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Invoices retrieved',
  //   type: [InvoiceResponseDto],
  // })
  // async getInvoicesByStatus(
  //   @Query('status') status: string,
  //   @GetUser() user: Account,
  // ): Promise<InvoiceResponseDto[]> {
  //   return await this.paymentService.getInvoicesByStatus(status, user);
  // }

  @Post()
  @RouteConfig({
    message: 'Create new invoice',
    requiresAuth: true,
    roles: [UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
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
  @RouteConfig({
    message: 'Get all invoices',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all invoices with optional filters' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'PROCESSING_ONLINE', 'PAID', 'FAILED'],
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'includeAppointment', required: false, type: Boolean })
  @ApiQuery({ name: 'includePetOwner', required: false, type: Boolean })
  @ApiQuery({ name: 'includePet', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of all invoices',
    type: [InvoiceResponseDto],
  })
  async getAllInvoices(
    @GetUser() user: Account,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeAppointment') includeAppointment?: boolean,
    @Query('includePetOwner') includePetOwner?: boolean,
    @Query('includePet') includePet?: boolean,
  ): Promise<InvoiceResponseDto[]> {
    return this.invoiceService.getAllInvoices(user, {
      status,
      startDate,
      endDate,
      includeAppointment,
      includePetOwner,
      includePet,
    });
  }

  @Get('overdue')
  @RouteConfig({
    message: 'Get overdue invoices',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
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
  @RouteConfig({
    message: 'Get invoices by status',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
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
    @GetUser() user: Account,
  ): Promise<InvoiceResponseDto[]> {
    return this.invoiceService.getInvoicesByStatus(status, user);
  }

  @Get(':id')
  @RouteConfig({
    message: 'Get invoice by ID',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
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
    @GetUser() user: Account,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.getInvoiceById(id, user);
  }

  @Get('number/:invoiceNumber')
  @RouteConfig({
    message: 'Get invoice by number',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST, UserType.PET_OWNER],
  })
  @ApiBearerAuth()
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
    @GetUser() user: Account,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.getInvoiceByNumber(invoiceNumber, user);
  }

  @Get('appointment/:appointmentId')
  @RouteConfig({
    message: 'Get invoice by appointment',
    requiresAuth: true,
    roles: [UserType.MANAGER, UserType.RECEPTIONIST],
  })
  @ApiBearerAuth()
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
  @RouteConfig({
    message: 'Update invoice',
    requiresAuth: true,
    roles: [UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
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
  @RouteConfig({
    message: 'Delete invoice (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
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
  @RouteConfig({
    message: 'Mark invoice as paid',
    requiresAuth: true,
    roles: [UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
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
  @RouteConfig({
    message: 'Mark invoice as failed',
    requiresAuth: true,
    roles: [UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
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
  @RouteConfig({
    message: 'Mark invoice as processing',
    requiresAuth: true,
    roles: [UserType.PET_OWNER, UserType.RECEPTIONIST, UserType.MANAGER],
  })
  @ApiBearerAuth()
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
    @GetUser() user: Account,
  ): Promise<InvoiceResponseDto> {
    return this.invoiceService.markAsProcessing(id, user);
  }
}
