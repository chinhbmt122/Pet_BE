import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EmployeeService } from '../../../src/services/employee.service';
import { Employee } from '../../../src/entities/employee.entity';
import { Account } from '../../../src/entities/account.entity';
import { CareStaff } from '../../../src/entities/care-staff.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { UserType } from '../../../src/entities/types/entity.types';
import { AccountFactory } from '../../../src/factories/account.factory';
import { EmployeeFactory } from '../../../src/factories/employee.factory';
import { CreateEmployeeDto } from '../../../src/dto/employee/create-employee.dto';
import { EmployeeMapper } from '../../../src/mappers/employee.mapper';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let employeeRepository: jest.Mocked<Repository<Employee>>;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let accountFactory: jest.Mocked<AccountFactory>;
  let employeeFactory: jest.Mocked<EmployeeFactory>;
  let dataSource: jest.Mocked<DataSource>;

  const mockAccount: Account = {
    accountId: 1,
    email: 'manager@test.com',
    passwordHash: 'hashedpassword',
    userType: UserType.MANAGER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Account;

  const mockCareStaff: CareStaff = {
    employeeId: 1,
    accountId: 1,
    fullName: 'John Doe',
    phoneNumber: '1234567890',
    address: '123 Main St',
    hireDate: new Date('2023-01-01'),
    salary: 50000,
    isAvailable: true,
    skills: ['cleaning', 'feeding'],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as CareStaff;

  const mockVeterinarian: Veterinarian = {
    employeeId: 2,
    accountId: 2,
    fullName: 'Dr. Smith',
    phoneNumber: '0987654321',
    address: '456 Vet St',
    hireDate: new Date('2023-01-01'),
    salary: 80000,
    isAvailable: true,
    licenseNumber: 'VET123',
    expertise: 'Surgery',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as Veterinarian;

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
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
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    employeeRepository = module.get(getRepositoryToken(Employee));
    accountRepository = module.get(getRepositoryToken(Account));
    accountFactory = module.get(AccountFactory);
    employeeFactory = module.get(EmployeeFactory);
    dataSource = module.get(DataSource);

    // Mock EmployeeMapper
    jest.spyOn(EmployeeMapper, 'toDomain').mockImplementation((entity) => {
      // Return a mock domain model that has the methods needed
      return {
        updateProfile: jest.fn(),
        updateEmploymentDetails: jest.fn(),
        updateLicenseNumber: jest.fn(),
        updateExpertise: jest.fn(),
        updateSkills: jest.fn(),
        markAvailable: jest.fn(),
        markUnavailable: jest.fn(),
      } as any;
    });
    jest.spyOn(EmployeeMapper, 'toPersistence').mockImplementation((domain) => {
      return domain as any;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateEmployeeDto = {
      email: 'jane@test.com',
      password: 'password123',
      userType: UserType.CARE_STAFF,
      fullName: 'Jane Smith',
      phoneNumber: '0987654321',
      address: '456 Oak St',
      hireDate: new Date('2023-01-01'),
      salary: 30000,
      skills: ['cleaning', 'feeding'],
    };

    it('should create new employee when caller is manager', async () => {
      const mockCreatedAccount = {
        ...mockAccount,
        accountId: 2,
        email: createDto.email,
      };
      const mockCreatedEmployee = {
        ...mockCareStaff,
        employeeId: 2,
        accountId: 2,
        fullName: createDto.fullName,
      };

      accountRepository.findOne.mockResolvedValue(mockAccount); // Manager account
      accountFactory.create.mockResolvedValue(mockCreatedAccount);
      accountRepository.save.mockResolvedValue(mockCreatedAccount);
      employeeFactory.createCareStaff.mockReturnValue(
        mockCreatedEmployee as any,
      );
      dataSource.transaction.mockImplementation(async (callback) => {
        return callback({
          save: jest.fn().mockResolvedValue(mockCreatedEmployee),
        } as any);
      });

      const result = await service.create(1, createDto);

      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { accountId: 1 },
      });
      expect(accountFactory.create).toHaveBeenCalledWith(
        createDto.email,
        createDto.password,
        createDto.userType,
      );
      expect(employeeFactory.createCareStaff).toHaveBeenCalledWith({
        accountId: 2,
        fullName: createDto.fullName,
        phoneNumber: createDto.phoneNumber,
        address: createDto.address,
        hireDate: createDto.hireDate,
        salary: createDto.salary,
        skills: createDto.skills,
      });
      expect(result).toEqual(mockCreatedEmployee);
    });

    it('should create veterinarian employee', async () => {
      const vetDto: CreateEmployeeDto = {
        ...createDto,
        userType: UserType.VETERINARIAN,
        licenseNumber: 'VET123',
        expertise: 'Surgery',
        skills: undefined,
      };
      const mockCreatedAccount = {
        ...mockAccount,
        accountId: 2,
        email: vetDto.email,
      };
      const mockCreatedVet = {
        ...mockVeterinarian,
        employeeId: 2,
        accountId: 2,
        fullName: vetDto.fullName,
      };

      accountRepository.findOne.mockResolvedValue(mockAccount);
      accountFactory.create.mockResolvedValue(mockCreatedAccount);
      accountRepository.save.mockResolvedValue(mockCreatedAccount);
      employeeFactory.createVeterinarian.mockReturnValue(mockCreatedVet as any);
      dataSource.transaction.mockImplementation(async (callback) => {
        return callback({
          save: jest.fn().mockResolvedValue(mockCreatedVet),
        } as any);
      });

      const result = await service.create(1, vetDto);

      expect(employeeFactory.createVeterinarian).toHaveBeenCalledWith({
        accountId: 2,
        fullName: vetDto.fullName,
        phoneNumber: vetDto.phoneNumber,
        address: vetDto.address,
        hireDate: vetDto.hireDate,
        salary: vetDto.salary,
        licenseNumber: vetDto.licenseNumber,
        expertise: vetDto.expertise,
      });
      expect(result).toEqual(mockCreatedVet);
    });

    it('should throw ForbiddenException when caller is not manager', async () => {
      const nonManagerAccount = {
        ...mockAccount,
        userType: UserType.VETERINARIAN,
      };
      accountRepository.findOne.mockResolvedValue(nonManagerAccount);

      await expect(service.create(1, createDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.forbidden.insufficientPermissions',
          }),
        }),
      );
    });

    it('should throw ForbiddenException when trying to create PetOwner', async () => {
      const petOwnerDto: CreateEmployeeDto = {
        ...createDto,
        userType: UserType.PET_OWNER,
      };
      accountRepository.findOne.mockResolvedValue(mockAccount);

      await expect(service.create(1, petOwnerDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.forbidden.accessDenied',
          }),
        }),
      );
    });
  });

  describe('getAll', () => {
    it('should return all employees', async () => {
      const employees = [mockCareStaff];
      const mockQueryBuilder = employeeRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(employees);

      const result = await service.getAll();

      expect(employeeRepository.createQueryBuilder).toHaveBeenCalledWith(
        'employee',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'employee.account',
        'account',
      );
      expect(result).toEqual(employees);
    });
  });

  describe('getById', () => {
    it('should return employee by ID', async () => {
      employeeRepository.findOne.mockResolvedValue(mockCareStaff);

      const result = await service.getById(1);

      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: 1 },
      });
      expect(result).toEqual(mockCareStaff);
    });

    it('should throw NotFoundException for non-existent employee', async () => {
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.employee',
          }),
        }),
      );
    });
  });

  describe('getByAccountId', () => {
    it('should return employee by account ID', async () => {
      employeeRepository.findOne.mockResolvedValue(mockCareStaff);

      const result = await service.getByAccountId(1);

      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { accountId: 1 },
      });
      expect(result).toEqual(mockCareStaff);
    });

    it('should throw NotFoundException for non-existent employee', async () => {
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(service.getByAccountId(999)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.employee',
          }),
        }),
      );
    });
  });

  describe('getByRole', () => {
    it('should return employees by role', async () => {
      const vets = [mockVeterinarian];
      const mockQueryBuilder = employeeRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(vets);

      const result = await service.getByRole(UserType.VETERINARIAN);

      expect(employeeRepository.createQueryBuilder).toHaveBeenCalledWith(
        'employee',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'employee.account',
        'account',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'account.userType = :role',
        { role: UserType.VETERINARIAN },
      );
      expect(result).toEqual(vets);
    });
  });

  describe('getAvailable', () => {
    it('should return available employees', async () => {
      const availableEmployees = [mockCareStaff];
      employeeRepository.find.mockResolvedValue(availableEmployees);

      const result = await service.getAvailable();

      expect(employeeRepository.find).toHaveBeenCalledWith({
        where: { isAvailable: true },
      });
      expect(result).toEqual(availableEmployees);
    });
  });

  describe('getAvailableByRole', () => {
    it('should return available employees by role', async () => {
      const availableVets = [mockVeterinarian];
      const mockQueryBuilder = employeeRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(availableVets);

      const result = await service.getAvailableByRole(UserType.VETERINARIAN);

      expect(employeeRepository.createQueryBuilder).toHaveBeenCalledWith(
        'employee',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'employee.account',
        'account',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'account.userType = :role',
        { role: UserType.VETERINARIAN },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'employee.isAvailable = :isAvailable',
        { isAvailable: true },
      );
      expect(result).toEqual(availableVets);
    });
  });

  describe('update', () => {
    const updateDto: UpdateEmployeeDto = {
      fullName: 'Updated Name',
      phoneNumber: '1111111111',
      salary: 60000,
      isAvailable: true,
    };

    it('should update employee when caller is manager', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount); // Manager
      employeeRepository.findOne.mockResolvedValue(mockCareStaff);
      employeeRepository.save.mockResolvedValue({
        ...mockCareStaff,
        ...updateDto,
      });

      const result = await service.update(1, 1, updateDto);

      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { accountId: 1 },
      });
      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: 1 },
      });
      expect(employeeRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should allow self-update', async () => {
      const selfUpdateDto: UpdateEmployeeDto = {
        fullName: 'Self Updated Name',
      };
      const employeeAccount = {
        ...mockAccount,
        accountId: 2,
        userType: UserType.VETERINARIAN,
      };

      accountRepository.findOne.mockResolvedValue(employeeAccount);
      employeeRepository.findOne.mockResolvedValue({
        ...mockCareStaff,
        accountId: 2,
      });
      employeeRepository.save.mockResolvedValue({
        ...mockCareStaff,
        ...selfUpdateDto,
      });

      const result = await service.update(2, 1, selfUpdateDto);

      expect(employeeRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when non-manager tries to update salary', async () => {
      const salaryUpdateDto: UpdateEmployeeDto = { salary: 70000 };
      const nonManagerAccount = {
        ...mockAccount,
        accountId: 1,
        userType: UserType.VETERINARIAN,
      };

      accountRepository.findOne.mockResolvedValue(nonManagerAccount);
      employeeRepository.findOne.mockResolvedValue({
        ...mockCareStaff,
        accountId: 1,
      }); // Self-update

      await expect(service.update(1, 1, salaryUpdateDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.forbidden.insufficientPermissions',
          }),
        }),
      );
    });

    it('should throw ForbiddenException when non-manager tries to update license number', async () => {
      const licenseUpdateDto: UpdateEmployeeDto = { licenseNumber: 'NEW123' };
      const nonManagerAccount = {
        ...mockAccount,
        userType: UserType.VETERINARIAN,
      };

      accountRepository.findOne.mockResolvedValue(nonManagerAccount);
      employeeRepository.findOne.mockResolvedValue(mockVeterinarian);

      await expect(service.update(2, 2, licenseUpdateDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.forbidden.insufficientPermissions',
          }),
        }),
      );
    });

    it('should throw ForbiddenException when non-manager tries to update others', async () => {
      const updateDto: UpdateEmployeeDto = { fullName: 'Updated Name' };
      const nonManagerAccount = {
        ...mockAccount,
        userType: UserType.VETERINARIAN,
      };

      accountRepository.findOne.mockResolvedValue(nonManagerAccount);
      employeeRepository.findOne.mockResolvedValue(mockCareStaff);

      await expect(service.update(2, 1, updateDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.forbidden.accessDenied',
          }),
        }),
      );
    });
  });

  describe('markAvailable', () => {
    it('should mark employee as available', async () => {
      employeeRepository.findOne.mockResolvedValue(mockCareStaff);
      employeeRepository.save.mockResolvedValue({
        ...mockCareStaff,
        isAvailable: true,
      });

      const result = await service.markAvailable(1);

      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: 1 },
      });
      expect(employeeRepository.save).toHaveBeenCalled();
      expect(result.isAvailable).toBe(true);
    });
  });

  describe('markUnavailable', () => {
    it('should mark employee as unavailable', async () => {
      employeeRepository.findOne.mockResolvedValue(mockCareStaff);
      employeeRepository.save.mockResolvedValue({
        ...mockCareStaff,
        isAvailable: false,
      });

      const result = await service.markUnavailable(1);

      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: 1 },
      });
      expect(employeeRepository.save).toHaveBeenCalled();
      expect(result.isAvailable).toBe(false);
    });
  });
});
