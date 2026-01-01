import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../src/services/auth.service';
import { Account } from '../../../src/entities/account.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Employee } from '../../../src/entities/employee.entity';
import { JwtService } from '@nestjs/jwt';
import { UserType } from '../../../src/entities/types/entity.types';
import { AccountMapper } from '../../../src/mappers/account.mapper';

describe('AuthService', () => {
  let service: AuthService;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let petOwnerRepository: jest.Mocked<Repository<PetOwner>>;
  let employeeRepository: jest.Mocked<Repository<Employee>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockAccount: Account = {
    accountId: 1,
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    userType: UserType.PET_OWNER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as Account;

  const mockPetOwner: PetOwner = {
    petOwnerId: 1,
    accountId: 1,
    fullName: 'John Doe',
    phoneNumber: '1234567890',
    address: '123 Main St',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PetOwner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Account),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PetOwner),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    accountRepository = module.get(getRepositoryToken(Account));
    petOwnerRepository = module.get(getRepositoryToken(PetOwner));
    employeeRepository = module.get(getRepositoryToken(Employee));
    jwtService = module.get(JwtService);

    // Mock AccountMapper
    jest.spyOn(AccountMapper, 'toDomain').mockImplementation(
      (entity) =>
        ({
          accountId: entity.accountId,
          email: entity.email,
          passwordHash: entity.passwordHash,
          userType: entity.userType,
          isActive: entity.isActive,
          validatePassword: jest.fn().mockResolvedValue(true),
          hashPassword: jest.fn(),
          activate: jest.fn(),
          deactivate: jest.fn(),
        }) as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return JWT token for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      accountRepository.findOne.mockResolvedValue(mockAccount);
      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(email, password);

      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockAccount.accountId,
        email: mockAccount.email,
      });
      expect(result).toEqual({
        accessToken: 'jwt-token',
        account: expect.objectContaining({
          accountId: mockAccount.accountId,
          email: mockAccount.email,
          fullName: mockPetOwner.fullName,
        }),
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const email = 'invalid@example.com';
      const password = 'password123';

      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.unauthorized.invalidCredentials',
          }),
        }),
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      // Mock domain model to return false for password validation
      jest.spyOn(AccountMapper, 'toDomain').mockImplementation(
        (entity) =>
          ({
            accountId: entity.accountId,
            email: entity.email,
            passwordHash: entity.passwordHash,
            userType: entity.userType,
            isActive: entity.isActive,
            validatePassword: jest.fn().mockResolvedValue(false),
            hashPassword: jest.fn(),
            activate: jest.fn(),
            deactivate: jest.fn(),
          }) as any,
      );

      accountRepository.findOne.mockResolvedValue(mockAccount);

      await expect(service.login(email, password)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.unauthorized.invalidCredentials',
          }),
        }),
      );
    });

    it('should throw UnauthorizedException for inactive account', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const inactiveAccount = { ...mockAccount, isActive: false };

      accountRepository.findOne.mockResolvedValue(inactiveAccount);

      await expect(service.login(email, password)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.unauthorized.accountInactive',
          }),
        }),
      );
    });
  });

  describe('logout', () => {
    it('should return true', async () => {
      const result = await service.logout('some-token');
      expect(result).toBe(true);
    });
  });

  describe('validateToken', () => {
    it('should return payload for valid token', async () => {
      const mockPayload = { id: 1, email: 'test@example.com' };
      jwtService.verify.mockReturnValue(mockPayload);

      const result = await service.validateToken('valid-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('getAccountById', () => {
    it('should return account by ID', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1);

      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { accountId: 1 },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should return null for non-existent account', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      const result = await service.getAccountById(999);

      expect(result).toBeNull();
    });
  });
});
