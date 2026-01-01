import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PetOwnerService } from '../../../src/services/pet-owner.service';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Account } from '../../../src/entities/account.entity';
import { Appointment } from '../../../src/entities/appointment.entity';
import { Invoice } from '../../../src/entities/invoice.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { AccountFactory } from '../../../src/factories/account.factory';
import { PetOwnerFactory } from '../../../src/factories/pet-owner.factory';

describe('PetOwnerService', () => {
  let service: PetOwnerService;
  let petOwnerRepository: jest.Mocked<Repository<PetOwner>>;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let accountFactory: jest.Mocked<AccountFactory>;
  let petOwnerFactory: jest.Mocked<PetOwnerFactory>;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetOwnerService,
        {
          provide: getRepositoryToken(PetOwner),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
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
          provide: getRepositoryToken(Invoice),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
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
          useValue: {
            transaction: jest.fn((callback) =>
              callback({
                save: jest.fn().mockImplementation((entity, data) => {
                  if (entity === Account) return mockAccount;
                  if (entity === PetOwner) return mockPetOwner;
                  return data;
                }),
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<PetOwnerService>(PetOwnerService);
    petOwnerRepository = module.get(getRepositoryToken(PetOwner));
    accountRepository = module.get(getRepositoryToken(Account));
    accountFactory = module.get(AccountFactory);
    petOwnerFactory = module.get(PetOwnerFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create new pet owner successfully', async () => {
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

    it('should throw ConflictException for existing email', async () => {
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

  describe('getByAccountId', () => {
    it('should return pet owner by account ID', async () => {
      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);

      const result = await service.getByAccountId(1);

      expect(petOwnerRepository.findOne).toHaveBeenCalledWith({
        where: { accountId: 1 },
      });
      expect(result).toEqual(mockPetOwner);
    });

    it('should throw NotFoundException for non-existent account', async () => {
      petOwnerRepository.findOne.mockResolvedValue(null);

      await expect(service.getByAccountId(999)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.owner',
          }),
        }),
      );
    });
  });

  describe('updateProfile', () => {
    it('should update pet owner profile successfully', async () => {
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
  });
});
