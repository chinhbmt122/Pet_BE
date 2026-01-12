import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PetService } from '../../../src/services/pet.service';
import { Pet } from '../../../src/entities/pet.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Appointment } from '../../../src/entities/appointment.entity';
import { MedicalRecord } from '../../../src/entities/medical-record.entity';
import { Account, UserType } from '../../../src/entities/account.entity';
import { CreatePetDto, UpdatePetDto } from '../../../src/dto/pet';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

describe('PetService - Full Unit Tests', () => {
  let service: PetService;

  // ===== Use helper types for cleaner declarations =====
  let petRepository: ReturnType<typeof createMockRepository<Pet>>;
  let petOwnerRepository: ReturnType<typeof createMockRepository<PetOwner>>;
  let appointmentRepository: ReturnType<typeof createMockRepository<Appointment>>;
  let medicalRecordRepository: ReturnType<typeof createMockRepository<MedicalRecord>>;

  beforeEach(async () => {
    // ===== Use shared helpers - consistent behavior =====
    petRepository = createMockRepository<Pet>();
    petOwnerRepository = createMockRepository<PetOwner>();
    appointmentRepository = createMockRepository<Appointment>();
    medicalRecordRepository = createMockRepository<MedicalRecord>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetService,
        {
          provide: getRepositoryToken(Pet),
          useValue: petRepository,
        },
        {
          provide: getRepositoryToken(PetOwner),
          useValue: petOwnerRepository,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        {
          provide: getRepositoryToken(MedicalRecord),
          useValue: medicalRecordRepository,
        },
      ],
    }).compile();

    service = module.get<PetService>(PetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P1: registerPetByOwner (2 tests)', () => {
    const mockUser: Account = {
      accountId: 1,
      email: 'owner@example.com',
      userType: UserType.PET_OWNER,
      isActive: true,
    } as Account;

    const mockOwner: PetOwner = {
      petOwnerId: 1,
      accountId: 1,
      fullName: 'John Doe',
    } as PetOwner;

    const validDto: CreatePetDto = {
      name: 'Max',
      species: 'Dog',
      breed: 'Golden Retriever',
      gender: 'Male',
      weight: 25.5,
      color: 'Golden',
    };

    it('[P1-28] should register pet for owner successfully', async () => {
      const mockPet: Pet = {
        petId: 1,
        ownerId: 1,
        name: 'Max',
        species: 'Dog',
        breed: 'Golden Retriever',
        gender: 'Male',
        weight: 25.5,
        color: 'Golden',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Pet;

      petOwnerRepository.findOne.mockResolvedValue(mockOwner);
      petRepository.create.mockReturnValue(mockPet);
      petRepository.save.mockResolvedValue(mockPet);

      const result = await service.registerPetByOwner(validDto, mockUser);

      expect(result).toBeDefined();
      expect(result.name).toBe('Max');
      expect(petOwnerRepository.findOne).toHaveBeenCalledWith({ where: { accountId: 1 } });
      expect(petRepository.save).toHaveBeenCalled();
    });

    it('[P1-29] should throw 404 when owner does not exist', async () => {
      petOwnerRepository.findOne.mockResolvedValue(null);

      await expect(service.registerPetByOwner(validDto, mockUser)).rejects.toThrow();
    });
  });

  describe('P1: registerPet (2 tests)', () => {
    const mockOwner: PetOwner = {
      petOwnerId: 1,
      accountId: 1,
      fullName: 'John Doe',
    } as PetOwner;

    const validDto: CreatePetDto = {
      name: 'Whiskers',
      species: 'Cat',
      breed: 'Persian',
      gender: 'Female',
      weight: 4.5,
    };

    it('[P1-30] should register pet for specified owner (staff)', async () => {
      const mockPet: Pet = {
        petId: 1,
        ownerId: 1,
        name: 'Whiskers',
        species: 'Cat',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Pet;

      petOwnerRepository.findOne.mockResolvedValue(mockOwner);
      petRepository.create.mockReturnValue(mockPet);
      petRepository.save.mockResolvedValue(mockPet);

      const result = await service.registerPet(validDto, 1);

      expect(result).toBeDefined();
      expect(result.name).toBe('Whiskers');
      expect(petRepository.save).toHaveBeenCalled();
    });

    it('[P1-31] should throw 404 when owner does not exist', async () => {
      petOwnerRepository.findOne.mockResolvedValue(null);

      await expect(service.registerPet(validDto, 999)).rejects.toThrow();
    });
  });

  describe('P0: updatePetInfo (6 tests)', () => {
    const mockPet: Pet = {
      petId: 1,
      ownerId: 1,
      name: 'Max',
      species: 'Dog',
      weight: 25.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Pet;

    const updateDto: UpdatePetDto = {
      weight: 27.0,
      color: 'Dark Golden',
    };

    it('[P0-25] should update pet successfully', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      petRepository.save.mockResolvedValue({
        ...mockPet,
        weight: 27.0,
        color: 'Dark Golden',
      } as Pet);

      const result = await service.updatePetInfo(1, updateDto);

      expect(result).toBeDefined();
      expect(petRepository.save).toHaveBeenCalled();
    });

    it('[P0-26] should throw 404 when pet does not exist', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePetInfo(999, updateDto)).rejects.toThrow();
    });

    it('[P0-27] should reject negative weight', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);

      const invalidDto: UpdatePetDto = { weight: -5 };

      // DTO validation would catch this, but service accepts it
      // Domain model should validate
      await expect(service.updatePetInfo(1, invalidDto)).rejects.toThrow();
    });

    it('[P0-28] should reject weight > 500kg', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);

      const invalidDto: UpdatePetDto = { weight: 600 };

      await expect(service.updatePetInfo(1, invalidDto)).rejects.toThrow();
    });

    it('[P0-29] should throw 400 when name is empty', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);

      const invalidDto: UpdatePetDto = { name: '' };

      await expect(service.updatePetInfo(1, invalidDto)).rejects.toThrow();
    });

    it('[P0-30] should allow valid species update', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      petRepository.save.mockResolvedValue({
        ...mockPet,
        species: 'Cat',
      } as Pet);

      const result = await service.updatePetInfo(1, { species: 'Cat' });

      expect(result).toBeDefined();
    });
  });

  describe('P1: getPetById (3 tests)', () => {
    const mockPet: Pet = {
      petId: 1,
      ownerId: 1,
      name: 'Max',
      species: 'Dog',
      owner: {
        petOwnerId: 1,
        fullName: 'John Doe',
      } as PetOwner,
    } as Pet;

    it('[P1-32] should return pet with relations', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);

      const result = await service.getPetById(1);

      expect(result).toBeDefined();
      expect(result.name).toBe('Max');
      expect(petRepository.findOne).toHaveBeenCalledWith({
        where: { petId: 1 },
        relations: ['owner'],
      });
    });

    it('[P1-33] should throw 404 when pet does not exist', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.getPetById(999)).rejects.toThrow();
    });

    it('[P1-34] should validate PET_OWNER can only access own pet', async () => {
      const user = { accountId: 1, userType: UserType.PET_OWNER };
      const mockOwner: PetOwner = {
        petOwnerId: 1,
        accountId: 1,
      } as PetOwner;

      petRepository.findOne.mockResolvedValue(mockPet);
      petOwnerRepository.findOne.mockResolvedValue(mockOwner);

      const result = await service.getPetById(1, user);

      expect(result).toBeDefined();
    });
  });

  describe('P1: getPetsByOwner (2 tests)', () => {
    const mockPets: Pet[] = [
      {
        petId: 1,
        ownerId: 1,
        name: 'Max',
        species: 'Dog',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Pet,
      {
        petId: 2,
        ownerId: 1,
        name: 'Whiskers',
        species: 'Cat',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Pet,
    ];

    it('[P1-35] should return all pets for owner', async () => {
      petRepository.find.mockResolvedValue(mockPets);

      const result = await service.getPetsByOwner(1);

      expect(result).toHaveLength(2);
      expect(petRepository.find).toHaveBeenCalledWith({
        where: { ownerId: 1 },
        order: { createdAt: 'DESC' },
      });
    });

    it('[P1-36] should return empty array when owner has no pets', async () => {
      petRepository.find.mockResolvedValue([]);

      const result = await service.getPetsByOwner(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('P1: deletePet (2 tests)', () => {
    const mockPet: Pet = {
      petId: 1,
      ownerId: 1,
      name: 'Max',
      species: 'Dog',
    } as Pet;

    it('[P1-37] should soft delete pet successfully', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      petRepository.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      const result = await service.deletePet(1);

      expect(result).toBe(true);
      expect(petRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('[P1-38] should throw 404 when pet does not exist', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.deletePet(999)).rejects.toThrow();
    });
  });

  describe('P2: restore (1 test)', () => {
    it('[P2-4] should restore deleted pet', async () => {
      const mockPet: Pet = {
        petId: 1,
        name: 'Max',
        deletedAt: null,
      } as Pet;

      petRepository.restore.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      petRepository.findOne.mockResolvedValue(mockPet);

      const result = await service.restore(1);

      expect(result).toBeDefined();
      expect(petRepository.restore).toHaveBeenCalledWith(1);
    });
  });

  describe('P2: transferPetOwnership (2 tests)', () => {
    const mockPet: Pet = {
      petId: 1,
      ownerId: 1,
      name: 'Max',
    } as Pet;

    const newOwner: PetOwner = {
      petOwnerId: 2,
      accountId: 2,
      fullName: 'Jane Smith',
    } as PetOwner;

    it('[P2-5] should transfer pet to new owner successfully', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      petOwnerRepository.findOne.mockResolvedValue(newOwner);
      petRepository.save.mockResolvedValue({
        ...mockPet,
        ownerId: 2,
      } as Pet);

      const result = await service.transferPetOwnership(1, 2);

      expect(result).toBeDefined();
      expect(petRepository.save).toHaveBeenCalled();
    });

    it('[P2-6] should throw 404 when new owner does not exist', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      petOwnerRepository.findOne.mockResolvedValue(null);

      await expect(service.transferPetOwnership(1, 999)).rejects.toThrow();
    });
  });
});
