import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService } from './email.service';
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
import { CreateVaccineTypeDto } from '../dto/vaccine-type/create-vaccine-type.dto';
import { UpdateVaccineTypeDto } from '../dto/vaccine-type/update-vaccine-type.dto';
import { UserType } from '../entities/account.entity';
import {
  OwnershipValidationHelper,
  UserContext,
} from './helpers/ownership-validation.helper';

/**
 * MedicalRecordService (MedicalRecordManager)
 *
 * Manages veterinary examination records using DDD pattern.
 * Uses domain models for business logic and mappers for entity conversion.
 *
 * @refactored Phase 1 - Uses OwnershipValidationHelper for pet ownership checks
 */
@Injectable()
export class MedicalRecordService {
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
    private readonly ownershipHelper: OwnershipValidationHelper,
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

    // 7. Send email notification to pet owner
    await this.sendMedicalRecordEmail(saved, pet);

    // 8. Return response DTO
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
    user?: UserContext,
  ): Promise<MedicalRecordResponseDto> {
    const entity = await this.medicalRecordRepository.findOne({
      where: { recordId },
      relations: ['pet', 'veterinarian'],
    });
    if (!entity) {
      I18nException.notFound('errors.notFound.medicalRecord', { id: recordId });
    }

    // Validate ownership via helper (handles PET_OWNER check internally)
    if (entity.petId) {
      await this.ownershipHelper.validatePetOwnership(entity.petId, user);
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
    user?: UserContext,
  ): Promise<MedicalRecordResponseDto[]> {
    // Validate ownership via helper
    await this.ownershipHelper.validatePetOwnership(petId, user);

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
    user?: UserContext,
  ): Promise<VaccinationResponseDto[]> {
    // Validate ownership via helper
    await this.ownershipHelper.validatePetOwnership(petId, user);

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
    user?: UserContext,
  ): Promise<VaccinationResponseDto[]> {
    // Validate ownership via helper
    await this.ownershipHelper.validatePetOwnership(petId, user);

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
    user?: UserContext,
  ): Promise<VaccinationResponseDto[]> {
    // Validate ownership via helper
    await this.ownershipHelper.validatePetOwnership(petId, user);

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
   * Gets all active vaccine types for dropdown selection.
   */
  async getAllVaccineTypes(): Promise<VaccineType[]> {
    return this.vaccineTypeRepository.find({
      where: { isActive: true },
      order: { vaccineName: 'ASC' },
    });
  }

  /**
   * Creates a new vaccine type (Manager only).
   */
  async createVaccineType(dto: CreateVaccineTypeDto): Promise<VaccineType> {
    const vaccineType = this.vaccineTypeRepository.create({
      vaccineName: dto.vaccineName,
      category: dto.category,
      targetSpecies: dto.targetSpecies,
      manufacturer: dto.manufacturer,
      description: dto.description,
      recommendedAgeMonths: dto.recommendedAgeMonths,
      boosterIntervalMonths: dto.boosterIntervalMonths,
      isActive: true,
    });
    return this.vaccineTypeRepository.save(vaccineType);
  }

  /**
   * Updates an existing vaccine type (Manager only).
   */
  async updateVaccineType(
    id: number,
    dto: UpdateVaccineTypeDto,
  ): Promise<VaccineType> {
    const vaccineType = await this.vaccineTypeRepository.findOne({
      where: { vaccineTypeId: id },
    });

    if (!vaccineType) {
      I18nException.notFound('errors.notFound.vaccineType', { id });
    }

    if (dto.vaccineName !== undefined)
      vaccineType.vaccineName = dto.vaccineName;
    if (dto.category !== undefined) vaccineType.category = dto.category;
    if (dto.targetSpecies !== undefined)
      vaccineType.targetSpecies = dto.targetSpecies;
    if (dto.manufacturer !== undefined)
      vaccineType.manufacturer = dto.manufacturer;
    if (dto.description !== undefined)
      vaccineType.description = dto.description;
    if (dto.recommendedAgeMonths !== undefined)
      vaccineType.recommendedAgeMonths = dto.recommendedAgeMonths;
    if (dto.boosterIntervalMonths !== undefined)
      vaccineType.boosterIntervalMonths = dto.boosterIntervalMonths;
    if (dto.isActive !== undefined) vaccineType.isActive = dto.isActive;

    return this.vaccineTypeRepository.save(vaccineType);
  }

  /**
   * Soft deletes a vaccine type (Manager only).
   */
  async deleteVaccineType(id: number): Promise<void> {
    const vaccineType = await this.vaccineTypeRepository.findOne({
      where: { vaccineTypeId: id },
    });

    if (!vaccineType) {
      I18nException.notFound('errors.notFound.vaccineType', { id });
    }

    vaccineType.isActive = false;
    await this.vaccineTypeRepository.save(vaccineType);
  }

  /**
   * Helper method to send medical record notification email to pet owner
   */
  private async sendMedicalRecordEmail(
    record: MedicalRecord,
    pet: Pet,
  ): Promise<void> {
    try {
      // Load pet with owner and account info
      const petWithOwner = await this.petRepository.findOne({
        where: { petId: pet.petId },
        relations: ['owner', 'owner.account'],
      });

      // Load veterinarian info
      const vet = await this.veterinarianRepository.findOne({
        where: { employeeId: record.veterinarianId },
        relations: ['account'],
      });

      const ownerEmail = petWithOwner?.owner?.account?.email;
      const ownerName = petWithOwner?.owner?.fullName || 'Quý khách';
      const petName = petWithOwner?.name || 'Thú cưng của bạn';
      const veterinarianName = vet?.fullName || 'Bác sĩ';

      if (!ownerEmail) {
        console.log(
          '[EMAIL] No owner email found for medical record notification',
        );
        return;
      }

      const examinationDate = new Date(record.examinationDate);
      const formattedDate = examinationDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      this.emailService
        .sendMedicalRecordNotificationEmail(ownerEmail, {
          ownerName,
          petName,
          diagnosis: record.diagnosis,
          treatment: record.treatment,
          veterinarianName,
          recordDate: formattedDate,
          followUpDate: record.followUpDate
            ? new Date(record.followUpDate).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
            : undefined,
        })
        .catch((err) =>
          console.warn('[EMAIL] Medical record email failed:', err),
        );
      console.log(`[EMAIL] Medical record notification sent to ${ownerEmail}`);
    } catch (error) {
      // Log but don't fail the operation if email fails
      console.error(
        `[EMAIL] Failed to send medical record email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
