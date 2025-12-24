import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account, UserType } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Appointment } from '../entities/appointment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Pet } from '../entities/pet.entity';
import { AccountFactory } from '../factories/account.factory';
import { PetOwnerFactory } from '../factories/pet-owner.factory';
import { PetOwnerMapper } from '../mappers/pet-owner.mapper';
import { RegisterPetOwnerDto } from '../dto/pet-owner';

/**
 * PetOwnerService
 *
 * Handles PetOwner-specific operations:
 * - Self-registration (public endpoint)
 * - Profile management
 * - Preferences
 */
@Injectable()
export class PetOwnerService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    private readonly accountFactory: AccountFactory,
    private readonly petOwnerFactory: PetOwnerFactory,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registers a new PetOwner (self-registration, public).
   *
   * Flow:
   * 1. Create Account entity (auth only) via AccountFactory
   * 2. Save Account to get accountId
   * 3. Create PetOwner entity (profile) via PetOwnerFactory
   * 4. Save PetOwner linked to Account
   * 5. Return created PetOwner
   *
   * Uses transaction to ensure atomicity.
   */
  async register(dto: RegisterPetOwnerDto): Promise<PetOwner> {
    // Use transaction for atomicity
    return this.dataSource.transaction(async (manager) => {
      // 1. Create Account via factory (validates email uniqueness)
      const account = await this.accountFactory.create(
        dto.email,
        dto.password,
        UserType.PET_OWNER,
      );

      // 2. Save Account
      const savedAccount = await manager.save(Account, account);

      // 3. Create PetOwner via factory
      const petOwner = this.petOwnerFactory.create({
        accountId: savedAccount.accountId,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        address: dto.address ?? null,
        preferredContactMethod: dto.preferredContactMethod,
        emergencyContact: dto.emergencyContact,
      });

      // 4. Save PetOwner
      const savedPetOwner = await manager.save(PetOwner, petOwner);

      return savedPetOwner;
    });
  }

  /**
   * Gets PetOwner by account ID.
   * PET_OWNER can only access their own profile, MANAGER/RECEPTIONIST can access all.
   */
  async getByAccountId(
    accountId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<PetOwner> {
    // If PET_OWNER, validate self-access only
    if (user && user.userType === UserType.PET_OWNER) {
      if (user.accountId !== accountId) {
        throw new ForbiddenException('You can only access your own profile');
      }
    }

    const petOwner = await this.petOwnerRepository.findOne({
      where: { accountId },
    });
    if (!petOwner) {
      throw new NotFoundException('PetOwner not found');
    }
    return petOwner;
  }

  /**
   * Updates PetOwner profile.
   * Uses domain model for business logic.
   * PET_OWNER can only update their own profile, MANAGER can update all.
   */
  async updateProfile(
    accountId: number,
    updates: {
      fullName?: string;
      phoneNumber?: string;
      address?: string | null;
    },
    user?: { accountId: number; userType: UserType },
  ): Promise<PetOwner> {
    // If PET_OWNER, validate self-access only
    if (user && user.userType === UserType.PET_OWNER) {
      if (user.accountId !== accountId) {
        throw new ForbiddenException('You can only update your own profile');
      }
    }

    // 1. Find entity
    const entity = await this.petOwnerRepository.findOne({
      where: { accountId },
    });
    if (!entity) {
      throw new NotFoundException('PetOwner not found');
    }

    // 2. Convert to domain model
    const domain = PetOwnerMapper.toDomain(entity);

    // 3. Update via domain model
    domain.updateProfile(updates);

    // 4. Convert back and save
    const updated = PetOwnerMapper.toPersistence(domain);
    return this.petOwnerRepository.save(updated);
  }

  /**
   * Updates PetOwner preferences.
   * PET_OWNER can only update their own preferences, MANAGER can update all.
   */
  async updatePreferences(
    accountId: number,
    updates: {
      preferredContactMethod?: string;
      emergencyContact?: string | null;
    },
    user?: { accountId: number; userType: UserType },
  ): Promise<PetOwner> {
    // If PET_OWNER, validate self-access only
    if (user && user.userType === UserType.PET_OWNER) {
      if (user.accountId !== accountId) {
        throw new ForbiddenException('You can only update your own preferences');
      }
    }

    // 1. Find entity
    const entity = await this.petOwnerRepository.findOne({
      where: { accountId },
    });
    if (!entity) {
      throw new NotFoundException('PetOwner not found');
    }

    // 2. Convert to domain model
    const domain = PetOwnerMapper.toDomain(entity);

    // 3. Update via domain model
    domain.updateContactPreferences(updates);

    // 4. Convert back and save
    const updated = PetOwnerMapper.toPersistence(domain);
    return this.petOwnerRepository.save(updated);
  }

  /**
   * Gets all pet owners with optional search criteria.
   */
  async getAllPetOwners(criteria?: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
  }): Promise<PetOwner[]> {
    const queryBuilder = this.petOwnerRepository
      .createQueryBuilder('petOwner')
      .leftJoinAndSelect('petOwner.account', 'account');

    if (criteria?.fullName) {
      queryBuilder.andWhere('petOwner.fullName ILIKE :fullName', {
        fullName: `%${criteria.fullName}%`,
      });
    }

    if (criteria?.phoneNumber) {
      queryBuilder.andWhere('petOwner.phoneNumber LIKE :phoneNumber', {
        phoneNumber: `%${criteria.phoneNumber}%`,
      });
    }

    if (criteria?.email) {
      queryBuilder.andWhere('account.email ILIKE :email', {
        email: `%${criteria.email}%`,
      });
    }

    return queryBuilder.orderBy('petOwner.fullName', 'ASC').getMany();
  }

  /**
   * Gets all appointments for a pet owner.
   */
  async getAppointments(petOwnerId: number, status?: string): Promise<any[]> {
    // Verify pet owner exists
    const petOwner = await this.petOwnerRepository.findOne({
      where: { petOwnerId },
    });
    if (!petOwner) {
      throw new NotFoundException('Pet owner not found');
    }

    // Get all pets for this owner
    const pets = await this.petRepository.find({
      where: { ownerId: petOwnerId },
      select: ['petId'],
    });

    if (pets.length === 0) {
      return [];
    }

    const petIds = pets.map((p) => p.petId);

    // Build query for appointments
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.employee', 'employee')
      .leftJoinAndSelect('appointment.service', 'service')
      .where('appointment.petId IN (:...petIds)', { petIds });

    if (status) {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }

    return queryBuilder
      .orderBy('appointment.appointmentDate', 'DESC')
      .addOrderBy('appointment.startTime', 'DESC')
      .getMany();
  }

  /**
   * Gets all invoices for a pet owner.
   */
  async getInvoices(petOwnerId: number, status?: string): Promise<any[]> {
    // Verify pet owner exists
    const petOwner = await this.petOwnerRepository.findOne({
      where: { petOwnerId },
    });
    if (!petOwner) {
      throw new NotFoundException('Pet owner not found');
    }

    // Get all pets for this owner
    const pets = await this.petRepository.find({
      where: { ownerId: petOwnerId },
      select: ['petId'],
    });

    if (pets.length === 0) {
      return [];
    }

    const petIds = pets.map((p) => p.petId);

    // Build query for invoices through appointments
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.appointment', 'appointment')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .where('appointment.petId IN (:...petIds)', { petIds });

    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }

    return queryBuilder.orderBy('invoice.issueDate', 'DESC').getMany();
  }
}
