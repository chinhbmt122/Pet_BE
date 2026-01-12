import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountService } from '../../../src/services/account.service';
import { Account, UserType } from '../../../src/entities/account.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Employee } from '../../../src/entities/employee.entity';
import * as bcrypt from 'bcrypt';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

describe('AccountService - Full Unit Tests', () => {
  let service: AccountService;

  // ===== Use helper types for cleaner declarations =====
  let accountRepository: ReturnType<typeof createMockRepository<Account>>;
  let petOwnerRepository: ReturnType<typeof createMockRepository<PetOwner>>;
  let employeeRepository: ReturnType<typeof createMockRepository<Employee>>;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    accountRepository = createMockRepository<Account>();
    petOwnerRepository = createMockRepository<PetOwner>();
    employeeRepository = createMockRepository<Employee>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
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
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: changePassword (4 tests)', () => {
    const validOldPassword = 'oldPassword123';
    const validNewPassword = 'newPassword456';
    const hashedOldPassword = bcrypt.hashSync(validOldPassword, 10);

    const mockAccount: Account = {
      accountId: 1,
      email: 'user@example.com',
      passwordHash: hashedOldPassword,
      userType: UserType.PET_OWNER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Account;

    it('[P0-21] should change password successfully with correct old password', async () => {
      const user = { accountId: 1, userType: UserType.PET_OWNER };
      accountRepository.findOne.mockResolvedValue(mockAccount);
      accountRepository.save.mockResolvedValue({
        ...mockAccount,
        passwordHash: bcrypt.hashSync(validNewPassword, 10),
      } as Account);

      const result = await service.changePassword(
        1,
        validOldPassword,
        validNewPassword,
        user
      );

      expect(result).toBe(true);
      expect(accountRepository.save).toHaveBeenCalled();
      const savedAccount = accountRepository.save.mock.calls[0][0];
      const isNewPasswordCorrect = await bcrypt.compare(validNewPassword, savedAccount.passwordHash);
      expect(isNewPasswordCorrect).toBe(true);
    });

    it('[P0-22] should throw 401 when old password is incorrect', async () => {
      const user = { accountId: 1, userType: UserType.PET_OWNER };
      accountRepository.findOne.mockResolvedValue(mockAccount);

      await expect(
        service.changePassword(1, 'wrongOldPassword', validNewPassword, user)
      ).rejects.toThrow();
      expect(accountRepository.save).not.toHaveBeenCalled();
    });

    it('[P0-23] should throw 400 when new password same as old password', async () => {
      const user = { accountId: 1, userType: UserType.PET_OWNER };
      accountRepository.findOne.mockResolvedValue(mockAccount);

      await expect(
        service.changePassword(1, validOldPassword, validOldPassword, user)
      ).rejects.toThrow();
      expect(accountRepository.save).not.toHaveBeenCalled();
    });

    it('[P0-24] should verify password is hashed with bcrypt', async () => {
      const user = { accountId: 1, userType: UserType.PET_OWNER };
      accountRepository.findOne.mockResolvedValue(mockAccount);
      accountRepository.save.mockResolvedValue(mockAccount);

      await service.changePassword(1, validOldPassword, validNewPassword, user);

      const savedAccount = accountRepository.save.mock.calls[0][0];
      expect(savedAccount.passwordHash).not.toBe(validNewPassword); // Should be hashed
      expect(savedAccount.passwordHash.startsWith('$2b$')).toBe(true); // bcrypt hash format
    });
  });

  describe('P1: getAccountById (3 tests)', () => {
    const mockAccount: Account = {
      accountId: 1,
      email: 'user@example.com',
      passwordHash: 'hash',
      userType: UserType.PET_OWNER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Account;

    it('[P1-18] should return account when found', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1);

      expect(result).toEqual(mockAccount);
      expect(accountRepository.findOne).toHaveBeenCalledWith({ where: { accountId: 1 } });
    });

    it('[P1-19] should throw 404 when account does not exist', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.getAccountById(999)).rejects.toThrow();
    });

    it('[P1-20] should allow user to access their own account', async () => {
      const user = { accountId: 1, userType: UserType.PET_OWNER };
      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1, user);

      expect(result).toEqual(mockAccount);
    });
  });

  describe('P1: getFullProfile (3 tests)', () => {
    const mockAccount: Account = {
      accountId: 1,
      email: 'user@example.com',
      passwordHash: 'hash',
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

    it('[P1-21] should return account + PetOwner profile for PET_OWNER userType', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);
      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);

      const result = await service.getFullProfile(1);

      expect(result.account).toEqual(mockAccount);
      expect(result.profile).toEqual(mockPetOwner);
      expect(petOwnerRepository.findOne).toHaveBeenCalledWith({ where: { accountId: 1 } });
    });

    it('[P1-22] should return account + Employee profile for VETERINARIAN userType', async () => {
      const vetAccount = { ...mockAccount, userType: UserType.VETERINARIAN } as Account;
      const mockEmployee: Employee = {
        employeeId: 1,
        accountId: 1,
        fullName: 'Dr. Smith',
        phoneNumber: '0987654321',
        address: '456 Vet St',
      } as Employee;

      accountRepository.findOne.mockResolvedValue(vetAccount);
      employeeRepository.findOne.mockResolvedValue(mockEmployee);

      const result = await service.getFullProfile(1);

      expect(result.account).toEqual(vetAccount);
      expect(result.profile).toEqual(mockEmployee);
      expect(employeeRepository.findOne).toHaveBeenCalledWith({ where: { accountId: 1 } });
    });

    it('[P1-23] should throw 404 when account does not exist', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.getFullProfile(999)).rejects.toThrow();
    });
  });

  describe('P1: deactivateAccount (2 tests)', () => {
    const mockAccount: Account = {
      accountId: 1,
      email: 'user@example.com',
      passwordHash: 'hash',
      userType: UserType.PET_OWNER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Account;

    it('[P1-24] should deactivate active account', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);
      accountRepository.save.mockResolvedValue({
        ...mockAccount,
        isActive: false,
      } as Account);

      const result = await service.deactivateAccount(1);

      expect(result.isActive).toBe(false);
      expect(accountRepository.save).toHaveBeenCalled();
    });

    it('[P1-25] should handle already inactive account (no change)', async () => {
      const inactiveAccount = { ...mockAccount, isActive: false } as Account;
      accountRepository.findOne.mockResolvedValue(inactiveAccount);
      accountRepository.save.mockResolvedValue(inactiveAccount);

      const result = await service.deactivateAccount(1);

      expect(result.isActive).toBe(false);
    });
  });

  describe('P1: activateAccount (2 tests)', () => {
    const mockAccount: Account = {
      accountId: 1,
      email: 'user@example.com',
      passwordHash: 'hash',
      userType: UserType.PET_OWNER,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Account;

    it('[P1-26] should activate inactive account', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);
      accountRepository.save.mockResolvedValue({
        ...mockAccount,
        isActive: true,
      } as Account);

      const result = await service.activateAccount(1);

      expect(result.isActive).toBe(true);
      expect(accountRepository.save).toHaveBeenCalled();
    });

    it('[P1-27] should handle already active account (no change)', async () => {
      const activeAccount = { ...mockAccount, isActive: true } as Account;
      accountRepository.findOne.mockResolvedValue(activeAccount);
      accountRepository.save.mockResolvedValue(activeAccount);

      const result = await service.activateAccount(1);

      expect(result.isActive).toBe(true);
    });
  });

  describe('P2: verifyRole (2 tests)', () => {
    it('[P2-2] should return true when role matches', async () => {
      const mockAccount: Account = {
        accountId: 1,
        userType: UserType.MANAGER,
      } as Account;

      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.verifyRole(1, UserType.MANAGER);

      expect(result).toBe(true);
    });

    it('[P2-3] should return false when role does not match', async () => {
      const mockAccount: Account = {
        accountId: 1,
        userType: UserType.PET_OWNER,
      } as Account;

      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.verifyRole(1, UserType.VETERINARIAN);

      expect(result).toBe(false);
    });
  });
});
