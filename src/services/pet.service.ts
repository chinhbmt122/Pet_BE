import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, Not } from 'typeorm';
import { Pet } from '../entities/pet.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { PetDomainModel } from '../domain/pet.domain';
import { PetMapper } from '../mappers/pet.mapper';
import { CreatePetDto, UpdatePetDto, PetResponseDto } from '../dto/pet';

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
  ) {}

  /**
   * Registers new pet with owner association and validation.
   */
  async registerPet(
    dto: CreatePetDto,
    ownerId: number,
  ): Promise<PetResponseDto> {
    // 1. Verify owner exists
    const owner = await this.petOwnerRepository.findOne({
      where: { petOwnerId: ownerId },
    });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${ownerId} not found`);
    }

    // 2. Create domain model
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

    // 3. Convert to entity and save
    const entityData = PetMapper.toPersistence(domain);
    const entity = this.petRepository.create(entityData);
    const saved = await this.petRepository.save(entity);

    // 4. Return response DTO
    const savedDomain = PetMapper.toDomain(saved);
    return PetResponseDto.fromDomain(savedDomain);
  }

  /**
   * Updates pet information using domain model.
   */
  async updatePetInfo(
    petId: number,
    dto: UpdatePetDto,
  ): Promise<PetResponseDto> {
    // 1. Find entity
    const entity = await this.petRepository.findOne({
      where: { petId },
    });
    if (!entity) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    // 2. Convert to domain
    const domain = PetMapper.toDomain(entity);

    // 3. Update via domain model
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

    // 4. Convert back and save
    const updatedData = PetMapper.toPersistence(domain);
    const saved = await this.petRepository.save(updatedData);

    // 5. Return response
    const savedDomain = PetMapper.toDomain(saved);
    return PetResponseDto.fromDomain(savedDomain);
  }

  /**
   * Retrieves complete pet profile by ID.
   */
  async getPetById(petId: number): Promise<PetResponseDto> {
    const entity = await this.petRepository.findOne({
      where: { petId },
      relations: ['owner'],
    });
    if (!entity) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    const domain = PetMapper.toDomain(entity);
    return PetResponseDto.fromDomain(domain);
  }

  /**
   * Retrieves all pets belonging to a specific owner.
   */
  async getPetsByOwner(ownerId: number): Promise<PetResponseDto[]> {
    const entities = await this.petRepository.find({
      where: { ownerId },
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
   * Searches pets by name, breed, species, or owner.
   */
  async searchPets(searchCriteria: {
    name?: string;
    species?: string;
    breed?: string;
    ownerId?: number;
  }): Promise<PetResponseDto[]> {
    const where: any = {};

    if (searchCriteria.name) {
      where.name = Like(`%${searchCriteria.name}%`);
    }
    if (searchCriteria.species) {
      where.species = searchCriteria.species;
    }
    if (searchCriteria.breed) {
      where.breed = Like(`%${searchCriteria.breed}%`);
    }
    if (searchCriteria.ownerId) {
      where.ownerId = searchCriteria.ownerId;
    }

    const entities = await this.petRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

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
}
