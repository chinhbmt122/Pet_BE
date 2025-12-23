import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Appointment } from '../entities/appointment.entity';
import {
  CreateInvoiceDto,
  InvoiceResponseDto,
  UpdateInvoiceDto,
} from '../dto/invoice';

/**
 * InvoiceService (Active Record Pattern)
 *
 * Manages invoices with business logic in Invoice entity.
 * Handles invoice creation, payment status transitions, and calculations.
 */
@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Creates a new invoice for an appointment
   * NOTE: In production, this would calculate amounts from appointment service.
   * For now, we expect the caller to provide calculated amounts.
   */
  async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    // Verify appointment exists
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId: dto.appointmentId },
      relations: ['service'],
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${dto.appointmentId} not found`,
      );
    }

    // Check if invoice already exists for this appointment
    const existingInvoice = await this.invoiceRepository.findOne({
      where: { appointmentId: dto.appointmentId },
    });
    if (existingInvoice) {
      throw new ConflictException(
        `Invoice already exists for appointment ${dto.appointmentId}`,
      );
    }

    // Calculate invoice amounts from service
    const servicePrice = Number(appointment.service.basePrice);
    const subtotal = servicePrice;

    // Apply discount (TODO: implement discount code lookup)
    let discount = 0;
    if (dto.discountCode) {
      // TODO: Look up discount code and calculate discount amount
      // For now, placeholder implementation
      discount = 0;
    }

    // Calculate tax (10% VAT)
    const TAX_RATE = 0.1;
    const tax = (subtotal - discount) * TAX_RATE;

    // Calculate total
    const totalAmount = subtotal - discount + tax;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Create invoice entity
    const entity = this.invoiceRepository.create({
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

    // Save and return
    const saved = await this.invoiceRepository.save(entity);
    return InvoiceResponseDto.fromEntity(saved);
  }

  /**
   * Generate unique invoice number in format: INV-YYYYMMDD-00001
   */
  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    // Find the latest invoice number for today
    const latestInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :pattern', {
        pattern: `INV-${dateStr}-%`,
      })
      .orderBy('invoice.invoiceNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (latestInvoice) {
      const lastSequence = latestInvoice.invoiceNumber.split('-')[2];
      sequence = parseInt(lastSequence, 10) + 1;
    }

    return `INV-${dateStr}-${sequence.toString().padStart(5, '0')}`;
  }

  /**
   * Updates invoice details (discount, tax, notes)
   */
  async updateInvoice(
    invoiceId: number,
    dto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
    });
    if (!entity) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    // Update using entity business methods
    if (dto.discount !== undefined) {
      entity.applyDiscount(dto.discount);
    }

    if (dto.tax !== undefined) {
      entity.updateTax(dto.tax);
    }

    if (dto.notes !== undefined) {
      entity.updateNotes(dto.notes);
    }

    // Save changes
    const saved = await this.invoiceRepository.save(entity);
    return InvoiceResponseDto.fromEntity(saved);
  }

  /**
   * Gets invoice by ID
   */
  async getInvoiceById(invoiceId: number): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
    });
    if (!entity) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    return InvoiceResponseDto.fromEntity(entity);
  }

  /**
   * Gets invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceNumber },
    });
    if (!entity) {
      throw new NotFoundException(
        `Invoice with number ${invoiceNumber} not found`,
      );
    }

    return InvoiceResponseDto.fromEntity(entity);
  }

  /**
   * Gets invoice by appointment ID
   */
  async getInvoiceByAppointment(
    appointmentId: number,
  ): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { appointmentId },
    });
    if (!entity) {
      throw new NotFoundException(
        `Invoice for appointment ${appointmentId} not found`,
      );
    }

    return InvoiceResponseDto.fromEntity(entity);
  }

  /**
   * Gets all invoices with optional filters
   */
  async getAllInvoices(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<InvoiceResponseDto[]> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    if (filters?.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('invoice.issueDate >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('invoice.issueDate <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    const entities = await queryBuilder
      .orderBy('invoice.issueDate', 'DESC')
      .getMany();

    return InvoiceResponseDto.fromEntityList(entities);
  }

  /**
   * Gets invoices by status
   */
  async getInvoicesByStatus(status: string): Promise<InvoiceResponseDto[]> {
    const entities = await this.invoiceRepository.find({
      where: { status: status as InvoiceStatus },
      order: { issueDate: 'DESC' },
    });

    return InvoiceResponseDto.fromEntityList(entities);
  }

  /**
   * Gets overdue invoices (unpaid after 30 days)
   */
  async getOverdueInvoices(): Promise<InvoiceResponseDto[]> {
    const entities = await this.invoiceRepository.find({
      order: { issueDate: 'ASC' },
    });

    // Filter using entity business method
    const overdueEntities = entities.filter((entity) => entity.isOverdue());

    return InvoiceResponseDto.fromEntityList(overdueEntities);
  }

  /**
   * Marks invoice as paid
   */
  async markAsPaid(
    invoiceId: number,
    paidAt?: Date,
  ): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
    });
    if (!entity) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    // Use entity business method
    entity.markAsPaid(paidAt);

    const saved = await this.invoiceRepository.save(entity);
    return InvoiceResponseDto.fromEntity(saved);
  }

  /**
   * Marks invoice as failed (payment failed)
   */
  async markAsFailed(invoiceId: number): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
    });
    if (!entity) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    // Use entity business method
    entity.markFailed();

    const saved = await this.invoiceRepository.save(entity);
    return InvoiceResponseDto.fromEntity(saved);
  }

  /**
   * Marks invoice as processing (online payment in progress)
   */
  async markAsProcessing(invoiceId: number): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
    });
    if (!entity) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    // Use entity business method
    entity.markAsProcessing();

    const saved = await this.invoiceRepository.save(entity);
    return InvoiceResponseDto.fromEntity(saved);
  }

  /**
   * Deletes an invoice (only if not paid)
   */
  async deleteInvoice(invoiceId: number): Promise<void> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
    });
    if (!entity) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    // Use entity business method
    if (entity.isPaid()) {
      throw new BadRequestException('Cannot delete paid invoice');
    }

    await this.invoiceRepository.remove(entity);
  }
}
