import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Appointment } from '../entities/appointment.entity';
import { InvoiceDomainModel } from '../domain/invoice.domain';
import { InvoiceMapper } from '../mappers/invoice.mapper';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceResponseDto,
} from '../dto/invoice';

/**
 * InvoiceService (Domain Model Pattern)
 *
 * Manages invoices with business logic in InvoiceDomainModel.
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
   */
  async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    // Verify appointment exists
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId: dto.appointmentId },
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

    // Create domain model (handles calculations)
    const domain = InvoiceDomainModel.create({
      appointmentId: dto.appointmentId,
      subtotal: dto.subtotal,
      discount: dto.discount,
      taxRate: dto.taxRate,
      notes: dto.notes,
    });

    // Convert to entity and save
    const entityData = InvoiceMapper.toPersistence(domain);
    const entity = this.invoiceRepository.create(entityData);
    const saved = await this.invoiceRepository.save(entity);

    // Return response DTO
    const savedDomain = InvoiceMapper.toDomain(saved);
    return InvoiceResponseDto.fromDomain(savedDomain);
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

    // Convert to domain and update
    const domain = InvoiceMapper.toDomain(entity);

    if (dto.discount !== undefined) {
      domain.applyDiscount(dto.discount);
    }

    if (dto.tax !== undefined) {
      domain.updateTax(dto.tax);
    }

    if (dto.notes !== undefined) {
      domain.updateNotes(dto.notes);
    }

    // Save changes
    const updatedData = InvoiceMapper.toPersistence(domain);
    const saved = await this.invoiceRepository.save(updatedData);

    const savedDomain = InvoiceMapper.toDomain(saved);
    return InvoiceResponseDto.fromDomain(savedDomain);
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

    const domain = InvoiceMapper.toDomain(entity);
    return InvoiceResponseDto.fromDomain(domain);
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

    const domain = InvoiceMapper.toDomain(entity);
    return InvoiceResponseDto.fromDomain(domain);
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

    const domain = InvoiceMapper.toDomain(entity);
    return InvoiceResponseDto.fromDomain(domain);
  }

  /**
   * Gets all invoices
   */
  async getAllInvoices(): Promise<InvoiceResponseDto[]> {
    const entities = await this.invoiceRepository.find({
      order: { issueDate: 'DESC' },
    });

    const domains = InvoiceMapper.toDomainList(entities);
    return InvoiceResponseDto.fromDomainList(domains);
  }

  /**
   * Gets invoices by status
   */
  async getInvoicesByStatus(status: string): Promise<InvoiceResponseDto[]> {
    const entities = await this.invoiceRepository.find({
      where: { status: status as any },
      order: { issueDate: 'DESC' },
    });

    const domains = InvoiceMapper.toDomainList(entities);
    return InvoiceResponseDto.fromDomainList(domains);
  }

  /**
   * Gets overdue invoices (unpaid after 30 days)
   */
  async getOverdueInvoices(): Promise<InvoiceResponseDto[]> {
    const entities = await this.invoiceRepository.find({
      order: { issueDate: 'ASC' },
    });

    const domains = InvoiceMapper.toDomainList(entities);
    const overdueDomains = domains.filter((d) => d.isOverdue());

    return InvoiceResponseDto.fromDomainList(overdueDomains);
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

    const domain = InvoiceMapper.toDomain(entity);
    domain.markAsPaid(paidAt);

    const updatedData = InvoiceMapper.toPersistence(domain);
    const saved = await this.invoiceRepository.save(updatedData);

    const savedDomain = InvoiceMapper.toDomain(saved);
    return InvoiceResponseDto.fromDomain(savedDomain);
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

    const domain = InvoiceMapper.toDomain(entity);
    domain.markAsFailed();

    const updatedData = InvoiceMapper.toPersistence(domain);
    const saved = await this.invoiceRepository.save(updatedData);

    const savedDomain = InvoiceMapper.toDomain(saved);
    return InvoiceResponseDto.fromDomain(savedDomain);
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

    const domain = InvoiceMapper.toDomain(entity);
    domain.markAsProcessing();

    const updatedData = InvoiceMapper.toPersistence(domain);
    const saved = await this.invoiceRepository.save(updatedData);

    const savedDomain = InvoiceMapper.toDomain(saved);
    return InvoiceResponseDto.fromDomain(savedDomain);
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

    const domain = InvoiceMapper.toDomain(entity);
    if (domain.status === 'PAID') {
      throw new BadRequestException('Cannot delete paid invoice');
    }

    await this.invoiceRepository.remove(entity);
  }
}
