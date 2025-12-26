import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PetService } from '../../../src/services/pet.service';
import { Pet } from '../../../src/entities/pet.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Appointment } from '../../../src/entities/appointment.entity';
import { MedicalRecord } from '../../../src/entities/medical-record.entity';
import { CreatePetDto } from '../../../src/dto/pet/create-pet.dto';

describe('PetService', () => {
  let service: PetService;
  let petRepository: jest.Mocked<Repository<Pet>>;
  let petOwnerRepository: jest.Mocked<Repository<PetOwner>>;

  const mockPetOwner: Partial<PetOwner> = {
    petOwnerId: 1,
    accountId: 1,
    fullName: 'John Doe',
    phoneNumber: '1234567890',
  };

  const mockPet: Pet = {
    petId: 1,
    ownerId: 1,
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    birthDate: new Date('2020-05-15'),
    gender: 'Male',
    weight: 25.5,
    color: 'Golden',
    initialHealthStatus: 'Healthy',
    specialNotes: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as Pet;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetService,
        {
          provide: getRepositoryToken(Pet),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PetOwner),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MedicalRecord),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PetService>(PetService);
    petRepository = module.get(getRepositoryToken(Pet));
    petOwnerRepository = module.get(getRepositoryToken(PetOwner));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerPet', () => {
    const createPetDto = {
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      birthDate: '2020-05-15',
      gender: 'Male' as const,
      weight: 25.5,
      color: 'Golden',
    };

    it('should create new pet via domain model', async () => {
      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner as PetOwner);
      petRepository.create.mockReturnValue(mockPet);
      petRepository.save.mockResolvedValue(mockPet);

      const result = await service.registerPet(createPetDto, 1);

      expect(petOwnerRepository.findOne).toHaveBeenCalledWith({
        where: { petOwnerId: 1 },
      });
      expect(petRepository.create).toHaveBeenCalled();
      expect(petRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Buddy');
      expect(result.species).toBe('Dog');
      // Verify computed age is present
      expect(typeof result.age).toBe('number');
    });

    it('should throw NotFoundException when owner not found', async () => {
      petOwnerRepository.findOne.mockResolvedValue(null);

      await expect(service.registerPet(createPetDto, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPetById', () => {
    it('should return pet with computed age', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);

      const result = await service.getPetById(1);

      expect(petRepository.findOne).toHaveBeenCalledWith({
        where: { petId: 1 },
        relations: ['owner'],
      });
      expect(result.id).toBe(1);
      expect(result.name).toBe('Buddy');
      // Age should be computed from birthDate
      expect(result.age).toBeGreaterThanOrEqual(0);
    });

    it('should throw NotFoundException when pet not found', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.getPetById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePet', () => {
    it('should soft delete pet', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      petRepository.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      const result = await service.deletePet(1);

      expect(petRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when pet not found', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.deletePet(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted pet', async () => {
      petRepository.restore.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      petRepository.findOne.mockResolvedValue(mockPet);

      const result = await service.restore(1);

      expect(petRepository.restore).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException when pet not found/not deleted', async () => {
      petRepository.restore.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      await expect(service.restore(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPetsByOwner', () => {
    it('should return all pets for owner', async () => {
      petRepository.find.mockResolvedValue([mockPet]);

      const result = await service.getPetsByOwner(1);

      expect(petRepository.find).toHaveBeenCalledWith({
        where: { ownerId: 1 },
        order: { createdAt: 'DESC' },
      });
      expect(result.length).toBe(1);
      expect(result[0].ownerId).toBe(1);
    });
  });

  describe('updatePetInfo', () => {
    it('should update pet via domain model', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      petRepository.save.mockResolvedValue({ ...mockPet, name: 'Max' });

      const result = await service.updatePetInfo(1, { name: 'Max' });

      expect(petRepository.findOne).toHaveBeenCalledWith({ where: { petId: 1 } });
      expect(petRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Max');
    });
  });
});
