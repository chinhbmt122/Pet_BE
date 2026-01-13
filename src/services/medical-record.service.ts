import { Injectable, Logger } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { MedicalRecord } from '../entities/medical-record.entity';
import { Appointment } from '../entities/appointment.entity';
import { VaccineType } from '../entities/vaccine-type.entity';
import { VaccinationHistory } from '../entities/vaccination-history.entity';
import { Pet } from '../entities/pet.entity';
import { Veterinarian } from '../entities/veterinarian.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { MedicalRecordDomainModel } from '../domain/medical-record.domain';
import { VaccinationHistoryDomainModel } from '../domain/vaccination-history.domain';
import { MedicalRecordMapper } from '../mappers/medical-record.mapper';
import { VaccinationHistoryMapper } from '../mappers/vaccination-history.mapper';
import {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
  MedicalRecordResponseDto,
} from '../dto/medical-record';
import {
  CreateVaccinationDto,
  VaccinationResponseDto,
} from '../dto/vaccination';
import {
  CreateVaccineTypeDto,
  UpdateVaccineTypeDto,
} from '../dto/vaccine-type';
import { UserType } from '../entities/account.entity';
import { EmailService } from './email.service';

/**
 * MedicalRecordService (MedicalRecordManager)
 *
 * Manages veterinary examination records using DDD pattern.
 * Uses domain models for business logic and mappers for entity conversion.
 */
@Injectable()
export class MedicalRecordService {
  private readonly logger = new Logger(MedicalRecordService.name);

  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(VaccineType)
    private readonly vaccineTypeRepository: Repository<VaccineType>,
    @InjectRepository(VaccinationHistory)
    private readonly vaccinationHistoryRepository: Repository<VaccinationHistory>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Retrieves all medical records (for Veterinarian/Manager).
   * Returns entities directly with relations for full data access.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAllMedicalRecords(user: {
    accountId: number;
    userType: UserType;
  }): Promise<MedicalRecord[]> {
    return this.medicalRecordRepository.find({
      order: { examinationDate: 'DESC' },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'veterinarian',
        'veterinarian.account',
      ],
    });
  }

  /**
   * Retrieves all medical records created by a specific veterinarian.
   * Returns entities directly with relations for full data access.
   */
  async getMedicalRecordsByVeterinarian(
    accountId: number,
  ): Promise<MedicalRecord[]> {
    // Find the veterinarian record by accountId
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { accountId },
    });

    if (!veterinarian) {
      I18nException.notFound('errors.notFound.employee');
    }

    return this.medicalRecordRepository.find({
      where: { veterinarianId: veterinarian.employeeId },
      order: { examinationDate: 'DESC' },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'veterinarian',
        'veterinarian.account',
      ],
    });
  }

  /**
   * Creates new medical record for pet with diagnosis and treatment.
   * Validates that veterinarian exists.
   * Auto-links petId from appointment if appointmentId is provided.
   */
  async createMedicalRecord(
    dto: CreateMedicalRecordDto,
  ): Promise<MedicalRecordResponseDto> {
    let petId = dto.petId;

    // 1. If appointmentId provided but no petId, auto-link from appointment
    if (dto.appointmentId && !petId) {
      const appointment = await this.appointmentRepository.findOne({
        where: { appointmentId: dto.appointmentId },
      });
      if (!appointment) {
        I18nException.notFound('errors.notFound.appointment', {
          id: dto.appointmentId,
        });
      }
      petId = appointment?.petId;
    }

    // 2. Verify petId is provided
    if (!petId) {
      I18nException.badRequest('errors.badRequest.petOrAppointmentRequired');
    }

    // 3. Verify pet exists
    const pet = await this.petRepository.findOne({
      where: { petId },
    });
    if (!pet) {
      I18nException.notFound('errors.notFound.pet', { id: petId });
    }

    // 4. Verify vet exists (Veterinarian entity already ensures role)
    const vet = await this.veterinarianRepository.findOne({
      where: { employeeId: dto.veterinarianId },
    });
    if (!vet) {
      I18nException.badRequest('errors.badRequest.notVeterinarian', {
        id: dto.veterinarianId,
      });
    }

    // 5. Create domain model
    const domain = MedicalRecordDomainModel.create({
      petId: petId,
      veterinarianId: dto.veterinarianId,
      diagnosis: dto.diagnosis,
      treatment: dto.treatment,
      appointmentId: dto.appointmentId,
      medicalSummary: dto.medicalSummary,
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
    });

    // 6. Convert to entity and save
    const entityData = MedicalRecordMapper.toPersistence(domain);
    const entity = this.medicalRecordRepository.create(entityData);
    const saved = await this.medicalRecordRepository.save(entity);

    // 7. Load full relations for email notification
    const fullRecord = await this.medicalRecordRepository.findOne({
      where: { recordId: saved.recordId },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'veterinarian',
        'veterinarian.account',
      ],
    });

    // 8. Send email notification to pet owner
    try {
      if (fullRecord?.pet?.owner?.account) {
        await this.emailService.sendMedicalRecordNotificationEmail(
          fullRecord.pet.owner.account.email,
          {
            ownerName: fullRecord.pet.owner.fullName,
            petName: fullRecord.pet.name,
            diagnosis: fullRecord.diagnosis,
            treatment: fullRecord.treatment,
            veterinarianName: fullRecord.veterinarian.fullName,
            recordDate: fullRecord.examinationDate.toLocaleDateString('vi-VN'),
          },
        );
        this.logger.log(
          `Sent medical record notification for record ${saved.recordId}`,
        );
      }
    } catch (emailError) {
      this.logger.error(
        `Failed to send medical record email: ${emailError.message}`,
      );
      // Don't fail the operation if email fails
    }

    // 9. Return response DTO
    const savedDomain = MedicalRecordMapper.toDomain(saved);
    return MedicalRecordResponseDto.fromDomain(savedDomain);
  }

  /**
   * Updates existing medical record with new information.
   */
  async updateMedicalRecord(
    recordId: number,
    dto: UpdateMedicalRecordDto,
  ): Promise<MedicalRecordResponseDto> {
    const entity = await this.medicalRecordRepository.findOne({
      where: { recordId },
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.medicalRecord', { id: recordId });
    }

    // Convert to domain and update
    const domain = MedicalRecordMapper.toDomain(entity);
    domain.updateDetails({
      diagnosis: dto.diagnosis,
      treatment: dto.treatment,
      medicalSummary: dto.medicalSummary,
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
    });

    // Save changes
    const updatedData = MedicalRecordMapper.toPersistence(domain);
    const saved = await this.medicalRecordRepository.save(updatedData);

    const savedDomain = MedicalRecordMapper.toDomain(saved);
    return MedicalRecordResponseDto.fromDomain(savedDomain);
  }

  /**
   * Retrieves complete medical record by ID.
   * If PET_OWNER, validates they own the pet.
   */
  async getMedicalRecordById(
    recordId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<MedicalRecordResponseDto> {
    const entity = await this.medicalRecordRepository.findOne({
      where: { recordId },
      relations: ['pet', 'veterinarian'],
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.medicalRecord', { id: recordId });
    }

    // If PET_OWNER, validate ownership
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!petOwner || entity.petId !== undefined) {
        const pet = await this.petRepository.findOne({
          where: { petId: entity.petId },
        });
        if (!pet || pet.ownerId !== petOwner?.petOwnerId) {
          I18nException.notFound('errors.notFound.medicalRecord', {
            id: recordId,
          });
        }
      }
    }

    const domain = MedicalRecordMapper.toDomain(entity);
    return MedicalRecordResponseDto.fromDomain(domain);
  }

  /**
   * Retrieves complete medical history for a pet in chronological order.
   * If PET_OWNER, validates they own the pet.
   */
  async getMedicalHistoryByPet(
    petId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<MedicalRecordResponseDto[]> {
    // If PET_OWNER, validate they own the pet
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      const pet = await this.petRepository.findOne({ where: { petId } });
      if (!petOwner || !pet || pet.ownerId !== petOwner.petOwnerId) {
        return [];
      }
    }

    const entities = await this.medicalRecordRepository.find({
      where: { petId },
      order: { examinationDate: 'DESC' },
      relations: ['veterinarian'],
    });

    const domains = MedicalRecordMapper.toDomainList(entities);
    return domains.map((d) => MedicalRecordResponseDto.fromDomain(d));
  }

  /**
   * Records vaccination with vaccine type, date, and next due date.
   * Next due date is auto-calculated by domain model using VaccineType.boosterIntervalMonths.
   */
  async addVaccination(
    petId: number,
    dto: CreateVaccinationDto,
  ): Promise<VaccinationResponseDto> {
    // 1. Verify pet exists
    const pet = await this.petRepository.findOne({ where: { petId } });
    if (!pet) {
      I18nException.notFound('errors.notFound.pet', { id: petId });
    }

    // 2. Get VaccineType for booster interval
    const vaccineType = await this.vaccineTypeRepository.findOne({
      where: { vaccineTypeId: dto.vaccineTypeId },
    });
    if (!vaccineType) {
      I18nException.notFound('errors.notFound.vaccineType', {
        id: dto.vaccineTypeId,
      });
    }

    // 3. Verify vet exists
    const vet = await this.veterinarianRepository.findOne({
      where: { employeeId: dto.administeredBy },
    });
    if (!vet) {
      I18nException.badRequest('errors.badRequest.notVeterinarian', {
        id: dto.administeredBy,
      });
    }

    // 4. Create domain model (nextDueDate auto-calculated)
    const domain = VaccinationHistoryDomainModel.create({
      petId,
      vaccineTypeId: dto.vaccineTypeId,
      administeredBy: dto.administeredBy,
      administrationDate: new Date(dto.administrationDate),
      batchNumber: dto.batchNumber,
      site: dto.site,
      reactions: dto.reactions,
      notes: dto.notes,
      medicalRecordId: dto.medicalRecordId,
      vaccineBoosterIntervalMonths:
        vaccineType.boosterIntervalMonths ?? undefined,
    });

    // 5. Convert to entity and save
    const entityData = VaccinationHistoryMapper.toPersistence(domain);
    const entity = this.vaccinationHistoryRepository.create(entityData);
    const saved = await this.vaccinationHistoryRepository.save(entity);

    // 6. Reload with relations and return
    const reloaded = await this.vaccinationHistoryRepository.findOne({
      where: { vaccinationId: saved.vaccinationId },
      relations: ['vaccineType'],
    });
    const savedDomain = VaccinationHistoryMapper.toDomain(reloaded!);
    return VaccinationResponseDto.fromDomain(savedDomain);
  }

  /**
   * Retrieves all vaccinations for a pet.
   * If PET_OWNER, validates they own the pet.
   */
  async getVaccinationHistory(
    petId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<VaccinationResponseDto[]> {
    // If PET_OWNER, validate ownership
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      const pet = await this.petRepository.findOne({ where: { petId } });
      if (!petOwner || !pet || pet.ownerId !== petOwner.petOwnerId) {
        I18nException.notFound('errors.notFound.pet');
      }
    }

    const entities = await this.vaccinationHistoryRepository.find({
      where: { petId },
      order: { administrationDate: 'DESC' },
      relations: ['vaccineType', 'administrator', 'administrator.account'],
    });

    const domains = VaccinationHistoryMapper.toDomainList(entities);

    // Map with administrator name from entity
    return domains.map((d, i) => {
      const dto = VaccinationResponseDto.fromDomain(d);
      const entity = entities[i];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (dto as any).administeredByName =
        entity.administrator?.account?.email?.split('@')[0] || null;
      return dto;
    });
  }

  /**
   * Gets vaccinations due within specified days.
   * If PET_OWNER, validates they own the pet.
   */
  async getUpcomingVaccinations(
    petId: number,
    daysAhead: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<VaccinationResponseDto[]> {
    // If PET_OWNER, validate ownership
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      const pet = await this.petRepository.findOne({ where: { petId } });
      if (!petOwner || !pet || pet.ownerId !== petOwner.petOwnerId) {
        I18nException.notFound('errors.notFound.pet');
      }
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const entities = await this.vaccinationHistoryRepository.find({
      where: {
        petId,
        nextDueDate: LessThanOrEqual(futureDate),
      },
      relations: ['vaccineType'],
      order: { nextDueDate: 'ASC' },
    });

    // Filter using domain model's isDue() and daysUntilDue()
    const domains = VaccinationHistoryMapper.toDomainList(entities);
    const upcomingDomains = domains.filter((d) => {
      const days = d.daysUntilDue();
      return days !== null && days <= daysAhead;
    });

    return upcomingDomains.map((d) => VaccinationResponseDto.fromDomain(d));
  }

  /**
   * Gets overdue vaccinations for a pet.
   * If PET_OWNER, validates they own the pet.
   */
  async getOverdueVaccinations(
    petId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<VaccinationResponseDto[]> {
    // If PET_OWNER, validate ownership
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      const pet = await this.petRepository.findOne({ where: { petId } });
      if (!petOwner || !pet || pet.ownerId !== petOwner.petOwnerId) {
        I18nException.notFound('errors.notFound.pet');
      }
    }

    const entities = await this.vaccinationHistoryRepository.find({
      where: { petId },
      relations: ['vaccineType'],
    });

    const domains = VaccinationHistoryMapper.toDomainList(entities);
    const overdueDomains = domains.filter((d) => d.isDue());

    return overdueDomains.map((d) => VaccinationResponseDto.fromDomain(d));
  }

  /**
   * Gets records with overdue follow-ups for a pet.
   */
  async getOverdueFollowUps(
    petId: number,
  ): Promise<MedicalRecordResponseDto[]> {
    const entities = await this.medicalRecordRepository.find({
      where: { petId },
      relations: ['veterinarian'],
    });

    const domains = MedicalRecordMapper.toDomainList(entities);
    const overdueDomains = domains.filter((d) => d.isFollowUpOverdue());

    return overdueDomains.map((d) => MedicalRecordResponseDto.fromDomain(d));
  }

  /**
   * Creates a new vaccine type (Manager only).
   * Validates that vaccine name is unique before creation.
   */
  async createVaccineType(dto: CreateVaccineTypeDto): Promise<VaccineType> {
    this.logger.log(`Creating new vaccine type: ${dto.vaccineName}`);

    // Check for duplicate vaccine name
    const existing = await this.vaccineTypeRepository.findOne({
      where: { vaccineName: dto.vaccineName },
    });

    if (existing) {
      I18nException.badRequest('errors.duplicate.vaccineName', {
        name: dto.vaccineName,
      });
    }

    const vaccineType = this.vaccineTypeRepository.create({
      ...dto,
      isActive: true,
    });

    const saved = await this.vaccineTypeRepository.save(vaccineType);
    this.logger.log(
      `Vaccine type created successfully: ${saved.vaccineTypeId}`,
    );

    return saved;
  }

  /**
   * Updates an existing vaccine type (Manager only).
   * Validates that vaccine name is unique if changed.
   */
  async updateVaccineType(
    id: number,
    dto: UpdateVaccineTypeDto,
  ): Promise<VaccineType> {
    this.logger.log(`Updating vaccine type: ${id}`);

    const vaccineType = await this.vaccineTypeRepository.findOne({
      where: { vaccineTypeId: id },
    });

    if (!vaccineType) {
      I18nException.notFound('errors.notFound.vaccineType', { id });
    }

    // Check for duplicate name if changing
    if (dto.vaccineName && dto.vaccineName !== vaccineType.vaccineName) {
      const duplicate = await this.vaccineTypeRepository.findOne({
        where: { vaccineName: dto.vaccineName },
      });
      if (duplicate) {
        I18nException.badRequest('errors.duplicate.vaccineName', {
          name: dto.vaccineName,
        });
      }
    }

    Object.assign(vaccineType, dto);
    const saved = await this.vaccineTypeRepository.save(vaccineType);
    this.logger.log(`Vaccine type updated successfully: ${id}`);

    return saved;
  }

  /**
   * Soft deletes a vaccine type by setting isActive to false (Manager only).
   * This preserves referential integrity with vaccination history.
   */
  async deleteVaccineType(id: number): Promise<void> {
    this.logger.log(`Soft deleting vaccine type: ${id}`);

    const vaccineType = await this.vaccineTypeRepository.findOne({
      where: { vaccineTypeId: id },
    });

    if (!vaccineType) {
      I18nException.notFound('errors.notFound.vaccineType', { id });
    }

    vaccineType.isActive = false;
    await this.vaccineTypeRepository.save(vaccineType);
    this.logger.log(`Vaccine type soft deleted successfully: ${id}`);
  }

  /**
   * Gets all active vaccine types for dropdown selection.
   */
  async getAllVaccineTypes(): Promise<VaccineType[]> {
    return this.vaccineTypeRepository.find({
      where: { isActive: true },
      order: { vaccineName: 'ASC' },
    });
  }
}
