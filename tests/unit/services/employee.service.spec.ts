import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeeService } from '../../../src/services/employee.service';
import { Account } from '../../../src/entities/account.entity';
import { Employee } from '../../../src/entities/employee.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { CareStaff } from '../../../src/entities/care-staff.entity';
import { Manager } from '../../../src/entities/manager.entity';
import { Receptionist } from '../../../src/entities/receptionist.entity';
import { UserType } from '../../../src/entities/types/entity.types';
import { AccountFactory } from '../../../src/factories/account.factory';
import { EmployeeFactory } from '../../../src/factories/employee.factory';
import { DataSource } from 'typeorm';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../../../src/dto/employee';

// ===== Use new test helpers =====
import { createMockRepository, createMockDataSource } from '../../helpers';

describe('EmployeeService - Full Unit Tests', () => {
  let service: EmployeeService;

  // ===== Use helper types for cleaner declarations =====
  let accountRepository: ReturnType<typeof createMockRepository<Account>>;
  let employeeRepository: ReturnType<typeof createMockRepository<Employee>>;
  let accountFactory: jest.Mocked<AccountFactory>;
  let employeeFactory: jest.Mocked<EmployeeFactory>;
  let dataSource: ReturnType<typeof createMockDataSource>;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    accountRepository = createMockRepository<Account>();
    employeeRepository = createMockRepository<Employee>();
    dataSource = createMockDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: getRepositoryToken(Account),
          useValue: accountRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepository,
        },
        {
          provide: AccountFactory,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: EmployeeFactory,
          useValue: {
            createVeterinarian: jest.fn(),
            createCareStaff: jest.fn(),
            createManager: jest.fn(),
            createReceptionist: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    accountFactory = module.get(AccountFactory);
    employeeFactory = module.get(EmployeeFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: create (6 tests)', () => {
    const managerAccount: Account = {
      accountId: 1,
      userType: UserType.MANAGER,
    } as Account;

    const validDto: CreateEmployeeDto = {
      email: 'vet@example.com',
      password: 'password123',
      userType: UserType.VETERINARIAN,
      fullName: 'Dr. John Doe',
      phoneNumber: '0123456789',
      hireDate: new Date('2026-01-01'),
      salary: 30000000,
      licenseNumber: 'VET-12345',
      expertise: 'Surgery',
    };

    it('[P0-82] should create veterinarian employee successfully', async () => {
      const mockAccount: Account = {
        accountId: 2,
        email: 'vet@example.com',
        userType: UserType.VETERINARIAN,
      } as Account;

      const mockEmployee: Employee = {
        employeeId: 1,
        accountId: 2,
        fullName: 'Dr. John Doe',
      } as Employee;

      accountRepository.findOne.mockResolvedValue(managerAccount);
      accountFactory.create.mockResolvedValue(mockAccount);
      employeeFactory.createVeterinarian.mockReturnValue(mockEmployee);

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          save: jest.fn()
            .mockResolvedValueOnce(mockAccount) // Account save
            .mockResolvedValueOnce(mockEmployee), // Employee save
        };
        return callback(mockManager as any);
      });

      const result = await service.create(1, validDto);

      expect(result).toBeDefined();
      expect(result.fullName).toBe('Dr. John Doe');
      expect(accountFactory.create).toHaveBeenCalledWith(
        'vet@example.com',
        'password123',
        UserType.VETERINARIAN,
      );
    });

    it('[P0-83] should create care staff employee successfully', async () => {
      const careStaffDto: CreateEmployeeDto = {
        ...validDto,
        userType: UserType.CARE_STAFF,
        skills: ['Grooming', 'Feeding'],
      };

      const mockAccount: Account = {
        accountId: 2,
        userType: UserType.CARE_STAFF,
      } as Account;

      const mockEmployee: Employee = {
        employeeId: 1,
        accountId: 2,
      } as Employee;

      accountRepository.findOne.mockResolvedValue(managerAccount);
      accountFactory.create.mockResolvedValue(mockAccount);
      employeeFactory.createCareStaff.mockReturnValue(mockEmployee);

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          save: jest.fn()
            .mockResolvedValueOnce(mockAccount)
            .mockResolvedValueOnce(mockEmployee),
        };
        return callback(mockManager as any);
      });

      const result = await service.create(1, careStaffDto);

      expect(result).toBeDefined();
      expect(employeeFactory.createCareStaff).toHaveBeenCalled();
    });

    it('[P0-84] should throw 403 if caller is not manager', async () => {
      const nonManagerAccount: Account = {
        accountId: 2,
        userType: UserType.VETERINARIAN,
      } as Account;

      accountRepository.findOne.mockResolvedValue(nonManagerAccount);

      await expect(service.create(2, validDto)).rejects.toThrow();
    });

    it('[P0-85] should throw 403 if trying to create PET_OWNER', async () => {
      const invalidDto: CreateEmployeeDto = {
        ...validDto,
        userType: UserType.PET_OWNER,
      };

      accountRepository.findOne.mockResolvedValue(managerAccount);

      await expect(service.create(1, invalidDto)).rejects.toThrow();
    });

    it('[P0-86] should use transaction for atomic account + employee creation', async () => {
      const mockAccount: Account = {
        accountId: 2,
        userType: UserType.VETERINARIAN,
      } as Account;

      const mockEmployee: Employee = {
        employeeId: 1,
        accountId: 2,
      } as Employee;

      accountRepository.findOne.mockResolvedValue(managerAccount);
      accountFactory.create.mockResolvedValue(mockAccount);
      employeeFactory.createVeterinarian.mockReturnValue(mockEmployee);

      let transactionCalled = false;
      dataSource.transaction.mockImplementation(async (callback) => {
        transactionCalled = true;
        const mockManager = {
          save: jest.fn()
            .mockResolvedValueOnce(mockAccount)
            .mockResolvedValueOnce(mockEmployee),
        };
        return callback(mockManager as any);
      });

      await service.create(1, validDto);

      expect(transactionCalled).toBe(true);
    });

    it('[P0-87] should create manager employee successfully', async () => {
      const managerDto: CreateEmployeeDto = {
        ...validDto,
        userType: UserType.MANAGER,
      };

      const mockAccount: Account = {
        accountId: 3,
        userType: UserType.MANAGER,
      } as Account;

      const mockEmployee: Employee = {
        employeeId: 2,
        accountId: 3,
      } as Employee;

      accountRepository.findOne.mockResolvedValue(managerAccount);
      accountFactory.create.mockResolvedValue(mockAccount);
      employeeFactory.createManager.mockReturnValue(mockEmployee);

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          save: jest.fn()
            .mockResolvedValueOnce(mockAccount)
            .mockResolvedValueOnce(mockEmployee),
        };
        return callback(mockManager as any);
      });

      const result = await service.create(1, managerDto);

      expect(result).toBeDefined();
      expect(employeeFactory.createManager).toHaveBeenCalled();
    });
  });

  describe('P1: getById (2 tests)', () => {
    const mockEmployee: Employee = {
      employeeId: 1,
      fullName: 'Dr. John Doe',
    } as Employee;

    it('[P1-68] should return employee when found', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);

      const result = await service.getById(1);

      expect(result).toBeDefined();
      expect(result.fullName).toBe('Dr. John Doe');
    });

    it('[P1-69] should throw 404 when employee not found', async () => {
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow();
    });
  });

  describe('P1: getByRole (1 test)', () => {
    it('[P1-70] should return employees filtered by role', async () => {
      const mockEmployees: Employee[] = [
        { employeeId: 1, fullName: 'Dr. John' } as Employee,
        { employeeId: 2, fullName: 'Dr. Jane' } as Employee,
      ];

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockEmployees),
      };

      employeeRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.getByRole(UserType.VETERINARIAN);

      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'account.userType = :role',
        { role: UserType.VETERINARIAN },
      );
    });
  });

  describe('P0: update (5 tests)', () => {
    const existingEmployee = Object.assign(new Veterinarian(), {
      employeeId: 1,
      accountId: 2,
      fullName: 'Dr. John Doe',
      phoneNumber: '0123456789',
      address: '123 Main St',
      hireDate: new Date('2026-01-01'),
      salary: 30000000,
      isAvailable: true,
      createdAt: new Date(),
      licenseNumber: 'VET-12345',
      expertise: 'Surgery',
    });

    const managerAccount: Account = {
      accountId: 1,
      userType: UserType.MANAGER,
    } as Account;

    const employeeAccount: Account = {
      accountId: 2,
      userType: UserType.VETERINARIAN,
    } as Account;

    it('[P0-88] should allow manager to update any employee', async () => {
      const updateDto: UpdateEmployeeDto = {
        fullName: 'Dr. John Smith',
        salary: 35000000,
      };

      employeeRepository.findOne.mockResolvedValue(existingEmployee);
      accountRepository.findOne.mockResolvedValue(managerAccount);
      employeeRepository.save.mockResolvedValue({
        ...existingEmployee,
        ...updateDto,
      });

      const result = await service.update(1, 1, updateDto);

      expect(result.fullName).toBe('Dr. John Smith');
      expect(result.salary).toBe(35000000);
    });

    it('[P0-89] should allow employee to update their own profile', async () => {
      const careStaffEmployee = Object.assign(new CareStaff(), {
        employeeId: 2,
        accountId: 2,
        fullName: 'Jane Doe',
        phoneNumber: '0123456789',
        address: '123 Main St',
        hireDate: new Date('2026-01-01'),
        salary: 25000000,
        isAvailable: true,
        createdAt: new Date(),
        skills: ['Grooming', 'Feeding'],
      });

      const updateDto: UpdateEmployeeDto = {
        fullName: 'Jane Smith',
        phoneNumber: '0987654321',
      };

      employeeRepository.findOne.mockResolvedValue(careStaffEmployee);
      accountRepository.findOne.mockResolvedValue(employeeAccount);
      employeeRepository.save.mockResolvedValue({
        ...careStaffEmployee,
        ...updateDto,
      });

      const result = await service.update(2, 2, updateDto);

      expect(result.fullName).toBe('Jane Smith');
      expect(result.phoneNumber).toBe('0987654321');
    });

    it('[P0-90] should throw 403 if non-manager tries to update salary', async () => {
      const updateDto: UpdateEmployeeDto = {
        salary: 40000000,
      };

      employeeRepository.findOne.mockResolvedValue(existingEmployee);
      accountRepository.findOne.mockResolvedValue(employeeAccount);

      await expect(service.update(2, 1, updateDto)).rejects.toThrow();
    });

    it('[P0-91] should throw 403 if employee tries to update another employee', async () => {
      const otherEmployee: Employee = {
        employeeId: 2,
        accountId: 3,
      } as Employee;

      const updateDto: UpdateEmployeeDto = {
        fullName: 'Hacker',
      };

      employeeRepository.findOne.mockResolvedValue(otherEmployee);
      accountRepository.findOne.mockResolvedValue(employeeAccount);

      await expect(service.update(2, 2, updateDto)).rejects.toThrow();
    });

    it('[P0-92] should allow manager to update salary', async () => {
      const managerEmployee = Object.assign(new Manager(), {
        employeeId: 3,
        accountId: 3,
        fullName: 'Manager Bob',
        phoneNumber: '0123456789',
        address: '789 Pine St',
        hireDate: new Date('2025-06-01'),
        salary: 50000000,
        isAvailable: true,
        createdAt: new Date(),
      });

      const updateDto: UpdateEmployeeDto = {
        salary: 40000000,
      };

      employeeRepository.findOne.mockResolvedValue(managerEmployee);
      accountRepository.findOne.mockResolvedValue(managerAccount);
      employeeRepository.save.mockResolvedValue({
        ...managerEmployee,
        salary: 40000000,
      });

      const result = await service.update(1, 3, updateDto);

      expect(result.salary).toBe(40000000);
    });
  });

  describe('P1: markAvailable / markUnavailable (2 tests)', () => {
    it('[P1-71] should mark employee as unavailable', async () => {
      const receptionistEmployee = Object.assign(new Receptionist(), {
        employeeId: 1,
        accountId: 4,
        fullName: 'Receptionist Alice',
        phoneNumber: '0123456789',
        address: '321 Elm St',
        hireDate: new Date('2025-08-01'),
        salary: 20000000,
        isAvailable: true,
        createdAt: new Date(),
      });

      employeeRepository.findOne.mockResolvedValue(receptionistEmployee);
      employeeRepository.save.mockResolvedValue({
        ...receptionistEmployee,
        isAvailable: false,
      });

      const result = await service.markUnavailable(1);

      expect(result.isAvailable).toBe(false);
    });

    it('[P1-72] should mark employee as available', async () => {
      const careStaffEmployee = Object.assign(new CareStaff(), {
        employeeId: 5,
        accountId: 5,
        fullName: 'CareStaff Charlie',
        phoneNumber: '0987654321',
        address: '654 Maple Ave',
        hireDate: new Date('2025-09-15'),
        salary: 22000000,
        isAvailable: false,
        createdAt: new Date(),
        skills: ['Grooming', 'Training'],
      });

      employeeRepository.findOne.mockResolvedValue(careStaffEmployee);
      employeeRepository.save.mockResolvedValue({
        ...careStaffEmployee,
        isAvailable: true,
      });

      const result = await service.markAvailable(1);

      expect(result.isAvailable).toBe(true);
    });
  });
});
