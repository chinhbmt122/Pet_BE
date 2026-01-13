import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import {
  CreateInvoiceDto,
  InvoiceResponseDto,
  UpdateInvoiceDto,
  CustomerStatisticsResponseDto,
} from '../dto/invoice';
import { UserType } from '../entities/account.entity';

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
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
  ) {}

  async generateInvoice(dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    // Validate appointment status before generating invoice
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentId: dto.appointmentId },
    });

    if (!appointment) {
      I18nException.notFound('errors.notFound.appointment', {
        id: dto.appointmentId,
      });
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      I18nException.badRequest('errors.badRequest.appointmentNotCompleted', {
        status: appointment.status,
        expected: AppointmentStatus.COMPLETED,
      });
    }

    // Delegate invoice creation to InvoiceService
    return this.createInvoice(dto);
  }

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
      I18nException.notFound('errors.notFound.appointment', {
        id: dto.appointmentId,
      });
    }

    // Check if invoice already exists for this appointment
    const existingInvoice = await this.invoiceRepository.findOne({
      where: { appointmentId: dto.appointmentId },
    });
    if (existingInvoice) {
      I18nException.conflict('errors.conflict.invoiceAlreadyExists', {
        appointmentId: dto.appointmentId,
      });
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

    // Save invoice first to get the invoiceId
    const saved = await this.invoiceRepository.save(entity);

    // Create invoice items
    const items: InvoiceItem[] = [];
    
    // Add main service as first item
    const serviceItem = this.invoiceItemRepository.create({
      invoiceId: saved.invoiceId,
      description: appointment.service.serviceName,
      quantity: 1,
      unitPrice: servicePrice,
      amount: servicePrice,
      itemType: 'SERVICE',
      serviceId: appointment.service.serviceId,
    });
    items.push(serviceItem);

    // Add additional items from notes if any (parse notes for additional services)
    // Example: "Thêm dịch vụ massage +30k" -> create item for massage
    if (dto.notes) {
      const additionalItems = this.parseAdditionalServicesFromNotes(dto.notes, saved.invoiceId);
      items.push(...additionalItems);
    }

    // Save all items
    if (items.length > 0) {
      await this.invoiceItemRepository.save(items);
    }

    return InvoiceResponseDto.fromEntity(saved);
  }

  /**
   * Parse additional services from notes string
   * Example: "Thêm dịch vụ massage +30k" -> { description: "Massage", unitPrice: 30000 }
   */
  private parseAdditionalServicesFromNotes(notes: string, invoiceId: number): InvoiceItem[] {
    const items: InvoiceItem[] = [];
    
    // Pattern: "Thêm dịch vụ [name] +[price]k"
    const pattern = /Thêm dịch vụ\s+([^+]+)\s*\+(\d+)k/gi;
    let match;
    
    while ((match = pattern.exec(notes)) !== null) {
      const description = match[1].trim();
      const price = parseInt(match[2]) * 1000; // Convert k to full amount
      
      const item = this.invoiceItemRepository.create({
        invoiceId,
        description,
        quantity: 1,
        unitPrice: price,
        amount: price,
        itemType: 'ADDITIONAL',
      });
      items.push(item);
    }
    
    return items;
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
      I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
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
   * If PET_OWNER, validates they own the related pet
   */
  async getInvoiceById(
    invoiceId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
    }

    // If PET_OWNER, validate ownership via appointment → pet → owner
    if (user && user.userType === UserType.PET_OWNER) {
      const appointment = await this.appointmentRepository.findOne({
        where: { appointmentId: entity.appointmentId },
        relations: ['pet'],
      });
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (
        !petOwner ||
        !appointment ||
        appointment.pet?.ownerId !== petOwner.petOwnerId
      ) {
        I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
      }
    }

    return InvoiceResponseDto.fromEntity(entity);
  }

  /**
   * Gets invoice by invoice number
   * If PET_OWNER, validates they own the related pet
   */
  async getInvoiceByNumber(
    invoiceNumber: string,
    user?: { accountId: number; userType: UserType },
  ): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceNumber },
      relations: ['appointment', 'appointment.pet'],
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.invoiceByNumber', {
        number: invoiceNumber,
      });
    }

    // If PET_OWNER, validate they own the pet
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (
        !petOwner ||
        entity.appointment?.pet?.ownerId !== petOwner.petOwnerId
      ) {
        I18nException.notFound('errors.notFound.invoiceByNumber', {
          number: invoiceNumber,
        });
      }
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
      I18nException.notFound('errors.notFound.invoiceByAppointment', {
        appointmentId,
      });
    }

    return InvoiceResponseDto.fromEntity(entity);
  }

  /**
   * Gets all invoices with optional filters
   * If PET_OWNER, returns only their invoices (via appointment → pet → owner)
   */
  async getAllInvoices(
    user?: { accountId: number; userType: UserType },
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      includeAppointment?: boolean;
      includePetOwner?: boolean;
      includePet?: boolean;
    },
  ): Promise<InvoiceResponseDto[]> {
    // If PET_OWNER, filter to only their own invoices
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
        relations: ['pets'],
      });
      if (!petOwner || !petOwner.pets?.length) {
        return [];
      }
      const petIds = petOwner.pets.map((pet) => pet.petId);

      // Find all appointments for these pets
      const appointments = await this.appointmentRepository.find({
        where: petIds.map((id) => ({ petId: id })),
      });
      if (!appointments.length) {
        return [];
      }
      const appointmentIds = appointments.map((a) => a.appointmentId);

      // Build query with filters
      const qb = this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.appointmentId IN (:...appointmentIds)', {
          appointmentIds,
        });
      // Include related entities if requested
      if (filters?.includeAppointment) {
        qb.leftJoinAndSelect('invoice.appointment', 'appointment');

        if (filters?.includePet) {
          qb.leftJoinAndSelect('appointment.pet', 'pet');
        }

        if (filters?.includePetOwner) {
          if (!filters?.includePet) {
            qb.leftJoinAndSelect('appointment.pet', 'pet');
          }
          qb.leftJoinAndSelect('pet.owner', 'owner');
        }
      }

      if (filters?.status) {
        qb.andWhere('invoice.status = :status', { status: filters.status });
      }
      if (filters?.startDate) {
        qb.andWhere('invoice.issueDate >= :startDate', {
          startDate: new Date(filters.startDate),
        });
      }
      if (filters?.endDate) {
        qb.andWhere('invoice.issueDate <= :endDate', {
          endDate: new Date(filters.endDate),
        });
      }

      const entities = await qb.orderBy('invoice.issueDate', 'DESC').getMany();
      return InvoiceResponseDto.fromEntityList(entities);
    }

    // For MANAGER and other staff, return all invoices
    const qb = this.invoiceRepository.createQueryBuilder('invoice');

    // Include related entities if requested
    if (filters?.includeAppointment) {
      qb.leftJoinAndSelect('invoice.appointment', 'appointment');
      qb.leftJoinAndSelect('appointment.service', 'service');
      qb.leftJoinAndSelect('invoice.items', 'items');

      if (filters?.includePet) {
        qb.leftJoinAndSelect('appointment.pet', 'pet');
      }

      if (filters?.includePetOwner) {
        if (!filters?.includePet) {
          qb.leftJoinAndSelect('appointment.pet', 'pet');
        }
        qb.leftJoinAndSelect('pet.owner', 'owner');
      }
    }

    if (filters?.status) {
      qb.andWhere('invoice.status = :status', { status: filters.status });
    }
    if (filters?.startDate) {
      qb.andWhere('invoice.issueDate >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }
    if (filters?.endDate) {
      qb.andWhere('invoice.issueDate <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    const entities = await qb.orderBy('invoice.issueDate', 'DESC').getMany();
    return InvoiceResponseDto.fromEntityList(entities);
  }

  /**
   * Gets invoices by status
   * If PET_OWNER, returns only their invoices with that status
   */

  async getInvoicesByStatus(
    status: string,
    user?: { accountId: number; userType: UserType },
  ): Promise<InvoiceResponseDto[]> {
    // If PET_OWNER, filter to only their own invoices
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
        relations: ['pets'],
      });
      if (!petOwner || !petOwner.pets?.length) {
        return [];
      }
      const petIds = petOwner.pets.map((pet) => pet.petId);

      const appointments = await this.appointmentRepository.find({
        where: petIds.map((id) => ({ petId: id })),
      });
      if (!appointments.length) {
        return [];
      }
      const appointmentIds = appointments.map((a) => a.appointmentId);

      const entities = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.appointmentId IN (:...appointmentIds)', {
          appointmentIds,
        })
        .andWhere('invoice.status = :status', { status })
        .orderBy('invoice.issueDate', 'DESC')
        .getMany();

      return InvoiceResponseDto.fromEntityList(entities);
    }

    // Staff sees all
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
   * Gets invoice statistics grouped by customer (pet owner)
   * Returns: totalVisits (Lượt đến), totalSpent (Tổng chi tiêu), lastVisit (Lần cuối đến)
   */
  async getCustomerStatistics(): Promise<CustomerStatisticsResponseDto[]> {
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.appointment', 'appointment')
      .leftJoin('appointment.pet', 'pet')
      .leftJoin('pet.owner', 'owner')
      .select('owner.petOwnerId', 'petOwnerId')
      .addSelect('COUNT(invoice.invoiceId)', 'totalVisits')
      .addSelect('SUM(invoice.totalAmount)', 'totalSpent')
      .addSelect('MAX(invoice.issueDate)', 'lastVisit')
      .where('owner.petOwnerId IS NOT NULL')
      .groupBy('owner.petOwnerId')
      .getRawMany();

    return CustomerStatisticsResponseDto.fromRawList(result);
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
      I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
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
      I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
    }

    // Use entity business method
    entity.markFailed();

    const saved = await this.invoiceRepository.save(entity);
    return InvoiceResponseDto.fromEntity(saved);
  }

  /**
   * Marks invoice as processing (online payment in progress)
   * If PET_OWNER, validates they own the related pet
   */
  async markAsProcessing(
    invoiceId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
      relations: ['appointment', 'appointment.pet'],
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
    }

    // If PET_OWNER, validate they own the pet
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (
        !petOwner ||
        entity.appointment?.pet?.ownerId !== petOwner.petOwnerId
      ) {
        I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
      }
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
      I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
    }

    // Use entity business method
    if (entity.isPaid()) {
      I18nException.badRequest('errors.badRequest.cannotDeletePaidInvoice');
    }

    await this.invoiceRepository.remove(entity);
  }
}
