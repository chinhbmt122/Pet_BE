import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import {
  CreateInvoiceDto,
  InvoiceResponseDto,
  UpdateInvoiceDto,
  CustomerStatisticsResponseDto,
} from '../dto/invoice';
import { UserType } from '../entities/account.entity';
import {
  OwnershipValidationHelper,
  UserContext,
} from './helpers/ownership-validation.helper';

/**
 * InvoiceService (Active Record Pattern)
 *
 * Manages invoices with business logic in Invoice entity.
 * Handles invoice creation, payment status transitions, and calculations.
 *
 * @refactored Phase 1 - Uses OwnershipValidationHelper for pet ownership checks
 */
@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    private readonly ownershipHelper: OwnershipValidationHelper,
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
   * Supports transactional context via optional EntityManager
   *
   * @param dto Invoice creation data
   * @param transactionManager Optional EntityManager for transactional operations
   * @returns Created invoice DTO
   */
  async createInvoice(
    dto: CreateInvoiceDto,
    transactionManager?: EntityManager,
  ): Promise<InvoiceResponseDto> {
    // Use transaction manager if provided, otherwise use default repository
    const manager = transactionManager || this.appointmentRepository.manager;

    // Verify appointment exists
    const appointment = await manager.findOne(Appointment, {
      where: { appointmentId: dto.appointmentId },
      relations: ['appointmentServices', 'appointmentServices.service'],
    });
    if (!appointment) {
      I18nException.notFound('errors.notFound.appointment', {
        id: dto.appointmentId,
      });
    }

    // Check if invoice already exists for this appointment
    const existingInvoice = await manager.findOne(Invoice, {
      where: { appointmentId: dto.appointmentId },
    });
    if (existingInvoice) {
      I18nException.conflict('errors.conflict.invoiceAlreadyExists', {
        appointmentId: dto.appointmentId,
      });
    }

    // Calculate invoice amounts from appointment services
    // Use appointmentServices pricing if available
    const subtotal =
      appointment.appointmentServices &&
      appointment.appointmentServices.length > 0
        ? appointment.appointmentServices.reduce(
            (sum, as) => sum + Number(as.unitPrice) * as.quantity,
            0,
          )
        : Number(appointment.actualCost) || 0;

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

    // Generate invoice number (thread-safe within transaction)
    const invoiceNumber = await this.generateInvoiceNumber(manager);

    // Create invoice entity
    const entity = manager.create(Invoice, {
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
    const saved = await manager.save(Invoice, entity);
    return InvoiceResponseDto.fromEntity(saved);
  }

  /**
   * Generate unique invoice number in format: INV-YYYYMMDD-00001
   * Thread-safe within transaction context
   *
   * @param manager EntityManager for transaction context
   */
  private async generateInvoiceNumber(
    manager?: EntityManager,
  ): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const repo = manager
      ? manager.getRepository(Invoice)
      : this.invoiceRepository;

    // Find the latest invoice number for today
    const latestInvoice = await repo
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
    user?: UserContext,
  ): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
      relations: [
        'appointment',
        'appointment.appointmentServices',
        'appointment.appointmentServices.service',
        'appointment.pet',
        'appointment.pet.owner',
      ],
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
    }

    // Validate ownership via helper (handles PET_OWNER check internally)
    await this.ownershipHelper.validateAppointmentOwnership(
      entity.appointment,
      user,
    );

    return InvoiceResponseDto.fromEntity(entity);
  }

  /**
   * Gets invoice by invoice number
   * If PET_OWNER, validates they own the related pet
   */
  async getInvoiceByNumber(
    invoiceNumber: string,
    user?: UserContext,
  ): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceNumber },
      relations: [
        'appointment',
        'appointment.appointmentServices',
        'appointment.appointmentServices.service',
        'appointment.pet',
        'appointment.pet.owner',
      ],
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.invoiceByNumber', {
        number: invoiceNumber,
      });
    }

    // Validate ownership via helper
    await this.ownershipHelper.validateAppointmentOwnership(
      entity.appointment,
      user,
    );

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
      relations: [
        'appointment',
        'appointment.appointmentServices',
        'appointment.appointmentServices.service',
        'appointment.pet',
        'appointment.pet.owner',
      ],
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
        qb.leftJoinAndSelect(
          'appointment.appointmentServices',
          'appointmentServices',
        );
        qb.leftJoinAndSelect('appointmentServices.service', 'service');

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
      qb.leftJoinAndSelect(
        'appointment.appointmentServices',
        'appointmentServices',
      );
      qb.leftJoinAndSelect('appointmentServices.service', 'service');

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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
    user?: UserContext,
  ): Promise<InvoiceResponseDto> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoiceId },
      relations: ['appointment', 'appointment.pet'],
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.invoice', { id: invoiceId });
    }

    // Validate ownership via helper
    await this.ownershipHelper.validateAppointmentOwnership(
      entity.appointment,
      user,
    );

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
