import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PetOwnerService } from '../../../src/services/pet-owner.service';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Account } from '../../../src/entities/account.entity';
import { Appointment } from '../../../src/entities/appointment.entity';
import { Invoice } from '../../../src/entities/invoice.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { AccountFactory } from '../../../src/factories/account.factory';
import { PetOwnerFactory } from '../../../src/factories/pet-owner.factory';

// ===== Use new test helpers =====
import { createMockRepository, createMockDataSource } from '../../helpers';

describe('PetOwnerService', () => {
  let service: PetOwnerService;

  // ===== Use helper types for cleaner declarations =====
  let petOwnerRepository: ReturnType<typeof createMockRepository<PetOwner>>;
  let accountRepository: ReturnType<typeof createMockRepository<Account>>;
  let appointmentRepository: ReturnType<typeof createMockRepository<Appointment>>;
  let invoiceRepository: ReturnType<typeof createMockRepository<Invoice>>;
  let petRepository: ReturnType<typeof createMockRepository<Pet>>;
  let accountFactory: jest.Mocked<AccountFactory>;
  let petOwnerFactory: jest.Mocked<PetOwnerFactory>;
  let dataSource: ReturnType<typeof createMockDataSource>;

  const mockAccount: Account = {
    accountId: 1,
    email: 'owner@test.com',
    passwordHash: 'hashedpassword',
    userType: 'PET_OWNER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Account;

  const mockPetOwner: PetOwner = {
    petOwnerId: 1,
    accountId: 1,
    fullName: 'John Doe',
    phoneNumber: '+1234567890',
    address: '123 Main St, City, Country',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as PetOwner;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    petOwnerRepository = createMockRepository<PetOwner>();
    accountRepository = createMockRepository<Account>();
    appointmentRepository = createMockRepository<Appointment>();
    invoiceRepository = createMockRepository<Invoice>();
    petRepository = createMockRepository<Pet>();

    // Custom DataSource mock for transaction behavior
    dataSource = createMockDataSource({
      managerMocks: {
        save: jest.fn().mockImplementation((entity, data) => {
          if (entity === Account) return mockAccount;
          if (entity === PetOwner) return mockPetOwner;
          return data;
        }),
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetOwnerService,
        {
          provide: getRepositoryToken(PetOwner),
          useValue: petOwnerRepository,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: accountRepository,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: invoiceRepository,
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: petRepository,
        },
        {
          provide: AccountFactory,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: PetOwnerFactory,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<PetOwnerService>(PetOwnerService);
    accountFactory = module.get(AccountFactory);
    petOwnerFactory = module.get(PetOwnerFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: register (2 tests)', () => {
    it('[P0-103] should create new pet owner successfully', async () => {
      const registerDto = {
        email: 'newowner@test.com',
        password: 'password123',
        fullName: 'Jane Smith',
        phoneNumber: '+0987654321',
        address: '456 Oak St, City, Country',
      };

      accountFactory.create.mockResolvedValue(mockAccount);
      petOwnerFactory.create.mockReturnValue(mockPetOwner);

      const result = await service.register(registerDto);

      expect(accountFactory.create).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        'PET_OWNER',
      );
      expect(petOwnerFactory.create).toHaveBeenCalledWith({
        accountId: mockAccount.accountId,
        fullName: registerDto.fullName,
        phoneNumber: registerDto.phoneNumber,
        address: registerDto.address,
        preferredContactMethod: undefined,
        emergencyContact: undefined,
      });
      expect(result).toEqual(mockPetOwner);
    });

    it('[P0-104] should throw ConflictException for existing email', async () => {
      const registerDto = {
        email: 'existing@test.com',
        password: 'password123',
        fullName: 'Jane Smith',
        phoneNumber: '+0987654321',
        address: '456 Oak St, City, Country',
      };

      accountFactory.create.mockRejectedValue(
        new ConflictException({
          i18nKey: 'errors.conflict.resourceAlreadyExists',
        }),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('P1: getByAccountId (3 tests)', () => {
    it('[P1-75] should return pet owner by account ID', async () => {
      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);

      const result = await service.getByAccountId(1);

      expect(petOwnerRepository.findOne).toHaveBeenCalledWith({
        where: { accountId: 1 },
      });
      expect(result).toEqual(mockPetOwner);
    });

    it('[P1-76] should throw NotFoundException for non-existent account', async () => {
      petOwnerRepository.findOne.mockResolvedValue(null);

      await expect(service.getByAccountId(999)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.owner',
          }),
        }),
      );
    });

    it('[P1-77] should throw 403 if PET_OWNER tries to access another account', async () => {
      const user = { accountId: 2, userType: 'PET_OWNER' as any };

      await expect(service.getByAccountId(1, user)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.forbidden.selfAccessOnly',
          }),
        }),
      );
    });
  });

  describe('P0: updateProfile (3 tests)', () => {
    it('[P0-105] should update pet owner profile successfully', async () => {
      const updateDto = {
        fullName: 'Updated Name',
        phoneNumber: '+1111111111',
        address: 'Updated Address',
      };

      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);
      petOwnerRepository.save.mockResolvedValue(mockPetOwner);

      const result = await service.updateProfile(1, updateDto);

      expect(petOwnerRepository.findOne).toHaveBeenCalledWith({
        where: { accountId: 1 },
      });
      expect(petOwnerRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent pet owner', async () => {
      const updateDto = {
        fullName: 'Updated Name',
        phoneNumber: '+1111111111',
        address: 'Updated Address',
      };

      petOwnerRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile(999, updateDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.owner',
          }),
        }),
      );
    });

    it('[P0-107] should throw 403 if PET_OWNER tries to update another account', async () => {
      const updateDto = {
        fullName: 'Updated Name',
      };
      const user = { accountId: 2, userType: 'PET_OWNER' as any };

      await expect(service.updateProfile(1, updateDto, user)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.forbidden.selfAccessOnly',
          }),
        }),
      );
    });
  });

  describe('P2: getAllPetOwners (1 test)', () => {
    it('[P2-20] should return all pet owners with optional filters', async () => {
      const mockPetOwners = [mockPetOwner];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPetOwners),
      };

      petOwnerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllPetOwners();

      expect(result).toEqual(mockPetOwners);
      expect(petOwnerRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('P2: getAppointments (1 test)', () => {
    it('[P2-21] should return appointments for pet owner', async () => {
      const mockPets = [{ petId: 1 }, { petId: 2 }];
      const mockAppointments = [
        {
          appointmentId: 1,
          petId: 1,
        },
      ];

      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);
      petRepository.find.mockResolvedValue(mockPets as any);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAppointments),
      };

      appointmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAppointments(1);

      expect(result).toBeDefined();
      expect(petOwnerRepository.findOne).toHaveBeenCalledWith({
        where: { petOwnerId: 1 },
      });
      expect(petRepository.find).toHaveBeenCalled();
      expect(appointmentRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
