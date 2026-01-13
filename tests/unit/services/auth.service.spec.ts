import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../src/services/auth.service';
import { Account, UserType } from '../../../src/entities/account.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Employee } from '../../../src/entities/employee.entity';
import { PasswordResetToken } from '../../../src/entities/password-reset-token.entity';
import { EmailService } from '../../../src/services/email.service';
import * as bcrypt from 'bcrypt';

// ===== Use new test helpers =====
import { createMockRepository, createMockJwtService } from '../../helpers';

describe('AuthService - Phase 1 Unit Tests', () => {
  let service: AuthService;

  // ===== Use helper types instead of manual jest.Mocked<Repository<T>> =====
  let accountRepository: ReturnType<typeof createMockRepository<Account>>;
  let petOwnerRepository: ReturnType<typeof createMockRepository<PetOwner>>;
  let employeeRepository: ReturnType<typeof createMockRepository<Employee>>;
  let passwordResetTokenRepository: ReturnType<typeof createMockRepository<PasswordResetToken>>;
  let jwtService: ReturnType<typeof createMockJwtService>;

  beforeEach(async () => {
    // ===== BEFORE: Inline mock creation =====
    // const mockRepository = () => ({
    //   findOne: jest.fn(),
    //   save: jest.fn(),
    //   ...
    // });

    // ===== AFTER: Use shared helpers - less code, more methods =====
    accountRepository = createMockRepository<Account>();
    petOwnerRepository = createMockRepository<PetOwner>();
    employeeRepository = createMockRepository<Employee>();
    passwordResetTokenRepository = createMockRepository<PasswordResetToken>();
    jwtService = createMockJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Account),
          useValue: accountRepository,
        },
        {
          provide: getRepositoryToken(PetOwner),
          useValue: petOwnerRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: passwordResetTokenRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordChangedNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: login (5 tests)', () => {
    const validEmail = 'user@example.com';
    const validPassword = 'password123';
    const hashedPassword = bcrypt.hashSync(validPassword, 10);

    const mockAccount: Account = {
      accountId: 1,
      email: validEmail,
      passwordHash: hashedPassword,
      userType: UserType.PET_OWNER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Account;

    const mockPetOwner: PetOwner = {
      petOwnerId: 1,
      accountId: 1,
      fullName: 'John Doe',
      phoneNumber: '0123456789',
      address: '123 Main St',
    } as PetOwner;

    it('[P0-13] should login successfully with valid credentials and return token + account', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);
      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);
      jwtService.sign.mockReturnValue('mock.jwt.token');

      const result = await service.login(validEmail, validPassword);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.account.accountId).toBe(1);
      expect(result.account.email).toBe(validEmail);
      expect(result.account.userType).toBe(UserType.PET_OWNER);
      expect(result.account.fullName).toBe('John Doe');
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { email: validEmail.toLowerCase() },
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          email: validEmail,
        })
      );
    });

    it('[P0-14] should throw 401 when email does not exist', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.login('nonexistent@example.com', validPassword)).rejects.toThrow();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('[P0-15] should throw 401 when password is incorrect', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);

      await expect(service.login(validEmail, 'wrongPassword')).rejects.toThrow();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('[P0-16] should handle case-insensitive email lookup', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);
      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);
      jwtService.sign.mockReturnValue('mock.jwt.token');

      const result = await service.login('USER@EXAMPLE.COM', validPassword);

      expect(result).toBeDefined();
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' }, // Should be lowercase
      });
    });

    it('[P0-17] should throw 401 when account is inactive', async () => {
      const inactiveAccount = {
        ...mockAccount,
        isActive: false,
      } as Account;

      accountRepository.findOne.mockResolvedValue(inactiveAccount);

      await expect(service.login(validEmail, validPassword)).rejects.toThrow();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('P0: generateToken (1 test)', () => {
    it('[P0-18] should generate JWT token with correct payload structure', async () => {
      const validEmail = 'vet@example.com';
      const validPassword = 'password123';
      const hashedPassword = bcrypt.hashSync(validPassword, 10);

      const mockEmployee: Employee = {
        employeeId: 1,
        accountId: 2,
        fullName: 'Dr. Smith',
        phoneNumber: '0987654321',
        address: '456 Vet St',
      } as Employee;

      const mockAccount: Account = {
        accountId: 2,
        email: validEmail,
        passwordHash: hashedPassword,
        userType: UserType.VETERINARIAN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Account;

      accountRepository.findOne.mockResolvedValue(mockAccount);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      jwtService.sign.mockReturnValue('vet.jwt.token');

      const result = await service.login(validEmail, validPassword);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          email: validEmail,
        })
      );
      expect(result.accessToken).toBe('vet.jwt.token');
      expect(result.account.userType).toBe(UserType.VETERINARIAN);
    });
  });

  describe('P0: validateToken (2 tests)', () => {
    it('[P0-19] should validate valid JWT token and return payload', () => {
      const mockPayload = {
        id: 1,
        email: 'user@example.com',
      };

      jwtService.verify.mockReturnValue(mockPayload);

      const result = service.validateToken('valid.jwt.token');

      expect(result).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith('valid.jwt.token');
    });

    it('[P0-20] should return null when token is invalid or expired', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.validateToken('invalid.jwt.token');

      expect(result).toBeNull();
      expect(jwtService.verify).toHaveBeenCalledWith('invalid.jwt.token');
    });
  });

  describe('P2: logout (1 test)', () => {
    it('[P2-1] should return true (stateless JWT)', () => {
      const result = service.logout('some.jwt.token');

      expect(result).toBe(true);
    });
  });

  describe('P1: getAccountById (2 tests)', () => {
    it('[P1-16] should return account when found', async () => {
      const mockAccount: Account = {
        accountId: 1,
        email: 'user@example.com',
        passwordHash: 'hash',
        userType: UserType.PET_OWNER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Account;

      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1);

      expect(result).toEqual(mockAccount);
      expect(accountRepository.findOne).toHaveBeenCalledWith({ where: { accountId: 1 } });
    });

    it('[P1-17] should return null when account not found', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      const result = await service.getAccountById(999);

      expect(result).toBeNull();
    });
  });
});
