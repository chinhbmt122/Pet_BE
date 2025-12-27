import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Pet } from '../entities/pet.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Appointment } from '../entities/appointment.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { PetDomainModel } from '../domain/pet.domain';
import { PetMapper } from '../mappers/pet.mapper';
import { CreatePetDto, UpdatePetDto, PetResponseDto } from '../dto/pet';
import { Account, UserType } from '../entities/account.entity';

/**
 * PetService (PetManager)
 *
 * Manages pet records using DDD pattern.
 * Uses PetDomainModel for business logic and PetMapper for entity conversion.
 */
@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(PetOwner)
    private readonly petOwnerRepository: Repository<PetOwner>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
  ) {}

  /**
   * Registers new pet with owner association and validation.
   * If PET_OWNER, validates they can only register for themselves.
   */
  async registerPetByOwner(
    dto: CreatePetDto,
    user: Account,
  ): Promise<PetResponseDto> {
    // 1. Verify owner exists
    const owner = await this.petOwnerRepository.findOne({
      where: { accountId: user.accountId },
    });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${user.accountId} not found`);
    }

    // 2. If PET_OWNER, validate they can only register for themselves
    if (user && user.userType === UserType.PET_OWNER) {
      if (owner.accountId !== user.accountId) {
        throw new NotFoundException(
          `Owner with ID ${user.accountId} not found`,
        );
      }
    }

    // 3. Create domain model
    const domain = PetDomainModel.create({
      ownerId: owner.petOwnerId,
      name: dto.name,
      species: dto.species,
      breed: dto.breed,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      gender: dto.gender,
      weight: dto.weight,
      color: dto.color,
      initialHealthStatus: dto.initialHealthStatus,
      specialNotes: dto.specialNotes,
    });

    // 4. Convert to entity and save
    const entityData = PetMapper.toPersistence(domain);
    const entity = this.petRepository.create(entityData);
    const saved = await this.petRepository.save(entity);

    // 5. Return response DTO
    const savedDomain = PetMapper.toDomain(saved);
    return PetResponseDto.fromDomain(savedDomain);
  }

  /**
   * Registers new pet with owner association and validation.
   * If PET_OWNER, validates they can only register for themselves.
   */
  async registerPet(
    dto: CreatePetDto,
    ownerId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<PetResponseDto> {
    // 1. Verify owner exists
    const owner = await this.petOwnerRepository.findOne({
      where: { petOwnerId: ownerId },
    });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${ownerId} not found`);
    }

    // 2. If PET_OWNER, validate they can only register for themselves
    if (user && user.userType === UserType.PET_OWNER) {
      if (owner.accountId !== user.accountId) {
        throw new NotFoundException(`Owner with ID ${ownerId} not found`);
      }
    }

    // 3. Create domain model
    const domain = PetDomainModel.create({
      ownerId,
      name: dto.name,
      species: dto.species,
      breed: dto.breed,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      gender: dto.gender,
      weight: dto.weight,
      color: dto.color,
      initialHealthStatus: dto.initialHealthStatus,
      specialNotes: dto.specialNotes,
    });

    // 4. Convert to entity and save
    const entityData = PetMapper.toPersistence(domain);
    const entity = this.petRepository.create(entityData);
    const saved = await this.petRepository.save(entity);

    // 5. Return response DTO
    const savedDomain = PetMapper.toDomain(saved);
    return PetResponseDto.fromDomain(savedDomain);
  }

  /**
   * Updates pet information using domain model.
   * If PET_OWNER, validates they own the pet.
   */
  async updatePetInfo(
    petId: number,
    dto: UpdatePetDto,
    user?: { accountId: number; userType: UserType },
  ): Promise<PetResponseDto> {
    // 1. Find entity
    const entity = await this.petRepository.findOne({
      where: { petId },
    });
    if (!entity) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    // 2. If PET_OWNER, validate ownership
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!petOwner || entity.ownerId !== petOwner.petOwnerId) {
        throw new NotFoundException(`Pet with ID ${petId} not found`);
      }
    }

    // 3. Convert to domain
    const domain = PetMapper.toDomain(entity);

    // 4. Update via domain model
    domain.updateProfile({
      name: dto.name,
      species: dto.species,
      breed: dto.breed,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      gender: dto.gender,
      weight: dto.weight,
      color: dto.color,
      specialNotes: dto.specialNotes,
    });

    // 5. Convert back and save
    const updatedData = PetMapper.toPersistence(domain);
    const saved = await this.petRepository.save(updatedData);

    // 6. Return response
    const savedDomain = PetMapper.toDomain(saved);
    return PetResponseDto.fromDomain(savedDomain);
  }

  /**
   * Retrieves complete pet profile by ID.
   * If PET_OWNER, validates they own the pet.
   */
  async getPetById(
    petId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<PetResponseDto> {
    const entity = await this.petRepository.findOne({
      where: { petId },
      relations: ['owner'],
    });
    if (!entity) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    // If PET_OWNER, validate ownership
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!petOwner || entity.ownerId !== petOwner.petOwnerId) {
        throw new NotFoundException(`Pet with ID ${petId} not found`);
      }
    }

    const domain = PetMapper.toDomain(entity);
    return PetResponseDto.fromDomain(domain);
  }

  /**
   * Retrieves all pets belonging to a specific owner.
   * If PET_OWNER, validates they're requesting their own pets.
   */
  async getPetsByOwner(
    ownerId: number,
    user?: { accountId: number; userType: UserType },
  ): Promise<PetResponseDto[]> {
    // If PET_OWNER, ensure they can only get their own pets
    if (user && user.userType === UserType.PET_OWNER) {
      const petOwner = await this.petOwnerRepository.findOne({
        where: { accountId: user.accountId },
      });
      if (!petOwner || petOwner.petOwnerId !== ownerId) {
        return []; // Return empty if not their pets
      }
    }

    const entities = await this.petRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });

    const domains = PetMapper.toDomainList(entities);
    return PetResponseDto.fromDomainList(domains);
  }

  /**
   * Retrieves all pets belonging to a specific owner.
   * If PET_OWNER, validates they're requesting their own pets.
   */
  async getOwnedPet(user: Account): Promise<PetResponseDto[]> {
    const petOwner = await this.petOwnerRepository.findOne({
      where: { accountId: user.accountId },
    });
    if (!petOwner) {
      return []; // Return empty if not their pets
    }

    const entities = await this.petRepository.find({
      where: { ownerId: petOwner.petOwnerId },
      order: { createdAt: 'DESC' },
    });

    const domains = PetMapper.toDomainList(entities);
    return PetResponseDto.fromDomainList(domains);
  }

  /**
   * Soft deletes pet record using TypeORM soft delete.
   */
  async deletePet(petId: number): Promise<boolean> {
    const pet = await this.petRepository.findOne({
      where: { petId },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    await this.petRepository.softDelete(petId);
    return true;
  }

  /**
   * Restores a soft-deleted pet record.
   */
  async restore(petId: number): Promise<PetResponseDto> {
    const result = await this.petRepository.restore(petId);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Pet with ID ${petId} not found or not deleted`,
      );
    }

    const entity = await this.petRepository.findOne({ where: { petId } });
    const domain = PetMapper.toDomain(entity!);
    return PetResponseDto.fromDomain(domain);
  }

  /**
   * Finds a pet including soft-deleted records.
   */
  async findWithDeleted(petId: number): Promise<PetResponseDto | null> {
    const entity = await this.petRepository.findOne({
      where: { petId },
      withDeleted: true,
    });
    if (!entity) return null;

    const domain = PetMapper.toDomain(entity);
    return PetResponseDto.fromDomain(domain);
  }

  /**
   * Gets all soft-deleted pets for a specific owner.
   */
  async getDeletedPetsByOwner(ownerId: number): Promise<PetResponseDto[]> {
    const entities = await this.petRepository
      .createQueryBuilder('pet')
      .withDeleted()
      .where('pet.ownerId = :ownerId', { ownerId })
      .andWhere('pet.deletedAt IS NOT NULL')
      .getMany();

    const domains = PetMapper.toDomainList(entities);
    return PetResponseDto.fromDomainList(domains);
  }

  /**
   * Transfers pet ownership to a different owner.
   */
  async transferPetOwnership(
    petId: number,
    newOwnerId: number,
  ): Promise<PetResponseDto> {
    // Verify pet exists
    const pet = await this.petRepository.findOne({ where: { petId } });
    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    // Verify new owner exists
    const newOwner = await this.petOwnerRepository.findOne({
      where: { petOwnerId: newOwnerId },
    });
    if (!newOwner) {
      throw new NotFoundException(`Owner with ID ${newOwnerId} not found`);
    }

    // Update ownership
    pet.ownerId = newOwnerId;
    const saved = await this.petRepository.save(pet);

    const domain = PetMapper.toDomain(saved);
    return PetResponseDto.fromDomain(domain);
  }

  /**
   * Filters pets by species (Dog, Cat, Bird, etc.).
   */
  async getPetsBySpecies(species: string): Promise<PetResponseDto[]> {
    const entities = await this.petRepository.find({
      where: { species },
      order: { name: 'ASC' },
    });

    const domains = PetMapper.toDomainList(entities);
    return PetResponseDto.fromDomainList(domains);
  }

  /**
   * Retrieves all pets with optional filtering.
   */
  async getAllPets(searchCriteria?: {
    name?: string;
    species?: string;
    breed?: string;
    ownerId?: number;
  }): Promise<PetResponseDto[]> {
    const where: FindOptionsWhere<Pet> = {};

    if (searchCriteria?.name) {
      where.name = Like(`%${searchCriteria.name}%`);
    }
    if (searchCriteria?.species) {
      where.species = searchCriteria.species;
    }
    if (searchCriteria?.breed) {
      where.breed = Like(`%${searchCriteria.breed}%`);
    }
    if (searchCriteria?.ownerId) {
      where.ownerId = searchCriteria.ownerId;
    }

    const entities = await this.petRepository.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { createdAt: 'DESC' },
    });

    const domains = PetMapper.toDomainList(entities);
    return PetResponseDto.fromDomainList(domains);
  }

  /**
   * Retrieves complete medical history for a specific pet.
   */
  async getPetMedicalHistory(petId: number): Promise<any[]> {
    // Verify pet exists
    const pet = await this.petRepository.findOne({ where: { petId } });
    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    // Get all medical records for this pet
    const records = await this.medicalRecordRepository.find({
      where: { petId },
      relations: ['veterinarian', 'appointment'],
      order: { examinationDate: 'DESC' },
    });

    return records;
  }

  /**
   * Retrieves all appointments for a specific pet.
   */
  async getPetAppointments(petId: number): Promise<any[]> {
    // Verify pet exists
    const pet = await this.petRepository.findOne({ where: { petId } });
    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    // Get all appointments for this pet
    const appointments = await this.appointmentRepository.find({
      where: { petId },
      relations: ['employee', 'service'],
      order: { appointmentDate: 'DESC', startTime: 'DESC' },
    });

    return appointments;
  }
}
