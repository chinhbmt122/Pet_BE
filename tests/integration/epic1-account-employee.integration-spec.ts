import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { AccountService } from '../../src/services/account.service';
import { EmployeeService } from '../../src/services/employee.service';
import { AuthService } from '../../src/services/auth.service';
import { PetOwnerService } from '../../src/services/pet-owner.service';
import { AccountModule } from '../../src/modules/account.module';
import { EmployeeModule } from '../../src/modules/employee.module';
import { PetOwnerModule } from '../../src/modules/pet-owner.module';
import { Account } from '../../src/entities/account.entity';
import { Employee } from '../../src/entities/employee.entity';
import { PetOwner } from '../../src/entities/pet-owner.entity';
import { Manager } from '../../src/entities/manager.entity';
import { Receptionist } from '../../src/entities/receptionist.entity';
import { CareStaff } from '../../src/entities/care-staff.entity';
import { Veterinarian } from '../../src/entities/veterinarian.entity';
import { Appointment } from '../../src/entities/appointment.entity';
import { MedicalRecord } from '../../src/entities/medical-record.entity';
import { VaccinationHistory } from '../../src/entities/vaccination-history.entity';
import { VaccineType } from '../../src/entities/vaccine-type.entity';
import { ServiceCategory } from '../../src/entities/service-category.entity';
import { Service } from '../../src/entities/service.entity';
import { WorkSchedule } from '../../src/entities/work-schedule.entity';
import { Payment } from '../../src/entities/payment.entity';
import { Pet } from '../../src/entities/pet.entity';
import { Invoice } from '../../src/entities/invoice.entity';
import { PaymentGatewayArchive } from '../../src/entities/payment-gateway-archive.entity';
import { CageAssignment } from '../../src/entities/cage-assignment.entity';
import { Cage } from '../../src/entities/cage.entity';
import { AuditLog } from '../../src/entities/audit-log.entity';
import path from 'path';
import { getTestDatabaseConfig } from '../e2e/test-db.config';
import * as bcrypt from 'bcrypt';
import { UserType } from '../../src/entities/types/entity.types';

/**
 * Epic 1 Integration Tests - Account & Employee Domain
 *
 * Tests service-to-service interactions, database operations, and business logic flows
 * without HTTP endpoints. Focuses on:
 * - Account management workflows
 * - Employee lifecycle management
 * - Authentication and authorization logic
 * - Cross-service data consistency
 */
describe('Epic 1 Integration Tests - Account & Employee Domain', () => {
  let module: TestingModule;
  let accountService: AccountService;
  let employeeService: EmployeeService;
  let authService: AuthService;
  let petOwnerService: PetOwnerService;

  // Repositories for direct database verification
  let accountRepository: Repository<Account>;
  let employeeRepository: Repository<Employee>;
  let petOwnerRepository: Repository<PetOwner>;
  let managerRepository: Repository<Manager>;
  let receptionistRepository: Repository<Receptionist>;
  let careStaffRepository: Repository<CareStaff>;
  let veterinarianRepository: Repository<Veterinarian>;

  // Test data
  let testManagerId: number;
  let testEmployeeId: number;
  let testAccountId: number;
  let testPetOwnerId: number;

  // Test database configuration
  const baseConfig = getTestDatabaseConfig();
  const testDatabaseConfig = {
    ...baseConfig,
    entities: [
      Account,
      Employee,
      CareStaff,
      Veterinarian,
      Manager,
      Receptionist,
      PetOwner,
      Pet,
      ServiceCategory,
      Service,
      Cage,
      CageAssignment,
      WorkSchedule,
      Appointment,
      MedicalRecord,
      VaccineType,
      VaccinationHistory,
      Payment,
      Invoice,
      PaymentGatewayArchive,
      AuditLog,
    ],
  };

  // Helper function to create test accounts directly
  async function createTestAccount(data: {
    username: string;
    password: string;
    email: string;
    userType: UserType;
  }): Promise<Account> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const account = accountRepository.create({
      username: data.username,
      passwordHash: hashedPassword,
      email: data.email,
      userType: data.userType,
      isActive: true,
    });
    return accountRepository.save(account);
  }

  // Helper function to create test employee
  async function createTestEmployee(
    accountId: number,
    userType: UserType,
    employeeData: any = {},
  ): Promise<Employee> {
    const employee = employeeRepository.create({
      accountId,
      fullName: employeeData.fullName || 'Test Employee',
      phoneNumber: employeeData.phoneNumber || '+1234567890',
      address: employeeData.address || 'Test Address',
      specialization: employeeData.specialization || 'General',
      licenseNumber: employeeData.licenseNumber || 'TEST123',
      hireDate: employeeData.hireDate || new Date(),
      salary: employeeData.salary || 50000,
      isAvailable: true,
      userType,
    });
    return employeeRepository.save(employee);
  }

  // Helper function to create test pet owner
  async function createTestPetOwner(
    accountId: number,
    ownerData: any = {},
  ): Promise<PetOwner> {
    const petOwner = petOwnerRepository.create({
      accountId,
      fullName: ownerData.fullName || 'Test Pet Owner',
      phoneNumber: ownerData.phoneNumber || '+1234567890',
      address: ownerData.address || 'Test Address',
      preferredContactMethod: ownerData.preferredContactMethod || 'email',
      emergencyContact: ownerData.emergencyContact || '+0987654321',
    });
    return petOwnerRepository.save(petOwner);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        I18nModule.forRoot({
          fallbackLanguage: 'vi',
          loaderOptions: {
            path: path.join(__dirname, '../../src/i18n/'),
            watch: true,
          },
          resolvers: [
            { use: QueryResolver, options: ['lang'] },
            AcceptLanguageResolver,
          ],
          throwOnMissingKey: true,
        }),
        TypeOrmModule.forRoot(testDatabaseConfig),
        AccountModule,
        EmployeeModule,
        PetOwnerModule,
      ],
    }).compile();

    module = moduleFixture;

    accountService = moduleFixture.get<AccountService>(AccountService);
    employeeService = moduleFixture.get<EmployeeService>(EmployeeService);
    authService = moduleFixture.get<AuthService>(AuthService);
    petOwnerService = moduleFixture.get<PetOwnerService>(PetOwnerService);

    accountRepository = moduleFixture.get<Repository<Account>>(
      getRepositoryToken(Account),
    );
    employeeRepository = moduleFixture.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
    petOwnerRepository = moduleFixture.get<Repository<PetOwner>>(
      getRepositoryToken(PetOwner),
    );
    managerRepository = moduleFixture.get<Repository<Manager>>(
      getRepositoryToken(Manager),
    );
    receptionistRepository = moduleFixture.get<Repository<Receptionist>>(
      getRepositoryToken(Receptionist),
    );
    careStaffRepository = moduleFixture.get<Repository<CareStaff>>(
      getRepositoryToken(CareStaff),
    );
    veterinarianRepository = moduleFixture.get<Repository<Veterinarian>>(
      getRepositoryToken(Veterinarian),
    );
  }, 30000);

  afterAll(async () => {
    await module?.close();
  });

  beforeEach(async () => {
    // Clean up test data using raw SQL with CASCADE
    // Note: In single table inheritance, all employee types are in the employees table
    await accountRepository.query('TRUNCATE TABLE "employees" CASCADE');
    await accountRepository.query('TRUNCATE TABLE "pet_owners" CASCADE');
    await accountRepository.query('TRUNCATE TABLE "accounts" CASCADE');

    // Create a global manager account for all tests
    const managerAccount = await createTestAccount({
      username: 'globalmanager',
      password: 'GlobalManager123!',
      email: 'global.manager@test.com',
      userType: UserType.MANAGER,
    });
    await createTestEmployee(managerAccount.accountId, UserType.MANAGER, {
      fullName: 'Global Manager',
      specialization: 'Management',
    });
    testManagerId = managerAccount.accountId;
  });

  describe('Account Management Integration', () => {
    it('should create account and verify database consistency', async () => {
      // Create account directly using repository
      const accountData = {
        username: 'testuser',
        password: 'TestPass123!',
        email: 'test@example.com',
        userType: UserType.MANAGER,
      };

      const createdAccount = await createTestAccount(accountData);

      // Verify account exists in database
      const dbAccount = await accountRepository.findOne({
        where: { accountId: createdAccount.accountId },
      });

      expect(dbAccount).toBeDefined();
      expect(dbAccount?.email).toBe(accountData.email);
      expect(dbAccount?.userType).toBe(accountData.userType);
      expect(dbAccount?.isActive).toBe(true);

      testAccountId = createdAccount.accountId;
    });

    it('should deactivate account and prevent login', async () => {
      // First create and activate account
      const accountData = {
        username: 'activeuser',
        password: 'TestPass123!',
        email: 'active@example.com',
        userType: UserType.MANAGER,
      };

      const account = await createTestAccount(accountData);

      // Verify login works initially
      const loginResult = await authService.login(
        accountData.email,
        accountData.password,
      );
      expect(loginResult).toBeDefined();

      // Deactivate account
      await accountService.deactivateAccount(account.accountId);

      // Verify account is deactivated in database
      const dbAccount = await accountRepository.findOne({
        where: { accountId: account.accountId },
      });
      expect(dbAccount?.isActive).toBe(false);

      // Verify login fails after deactivation
      await expect(
        authService.login(accountData.email, accountData.password),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.unauthorized.accountInactive',
          }),
        }),
      );
    });

    it('should change password and allow login with new password', async () => {
      // Create account
      const accountData = {
        username: 'changepass',
        password: 'OldPass123!',
        email: 'change@example.com',
        userType: UserType.MANAGER,
      };

      const account = await createTestAccount(accountData);

      // Change password
      const newPassword = 'NewPass123!';
      await accountService.changePassword(
        account.accountId,
        accountData.password,
        newPassword,
      );

      // Verify login fails with old password
      await expect(
        authService.login(accountData.email, accountData.password),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.unauthorized.invalidCredentials',
          }),
        }),
      );

      // Verify login works with new password
      const loginResult = await authService.login(
        accountData.email,
        newPassword,
      );
      expect(loginResult).toBeDefined();
    });
  });

  describe('Employee Management Integration', () => {
    beforeEach(async () => {
      // Create manager account for authorization
      const managerAccount = await createTestAccount({
        username: 'manager',
        password: 'Manager123!',
        email: 'manager@example.com',
        userType: UserType.MANAGER,
      });
      await createTestEmployee(managerAccount.accountId, UserType.MANAGER, {
        fullName: 'Manager User',
        specialization: 'Management',
      });
      testManagerId = managerAccount.accountId;
    });

    it('should create manager employee and verify role-specific data', async () => {
      // Use the existing manager account from beforeEach
      const employeeData = {
        email: 'john.manager@test.com',
        password: 'Manager123!',
        fullName: 'John Manager',
        phoneNumber: '+1234567890',
        address: '123 Manager St',
        specialization: 'Management',
        licenseNumber: 'MGR123',
        hireDate: new Date('2024-01-15'),
        salary: 75000,
      };

      const createdEmployee = await employeeService.create(testManagerId, {
        ...employeeData,
        userType: UserType.MANAGER,
      });

      // Verify employee exists
      const dbEmployee = await employeeRepository.findOne({
        where: { employeeId: createdEmployee.employeeId },
      });

      expect(dbEmployee).toBeDefined();
      expect(dbEmployee?.fullName).toBe(employeeData.fullName);
      expect(dbEmployee?.phoneNumber).toBe(employeeData.phoneNumber);

      // Verify account has correct user type
      const dbAccount = await accountRepository.findOne({
        where: { accountId: testManagerId },
      });
      expect(dbAccount?.userType).toBe(UserType.MANAGER);

      testEmployeeId = createdEmployee.employeeId;
    });

    it('should create veterinarian and receptionist employees', async () => {
      // Create veterinarian account
      const vetAccount = await createTestAccount({
        username: 'vet',
        password: 'VetPass123!',
        email: 'vet@example.com',
        userType: UserType.VETERINARIAN,
      });

      // Create receptionist account
      const receptionistAccount = await createTestAccount({
        username: 'receptionist',
        password: 'Reception123!',
        email: 'reception@example.com',
        userType: UserType.RECEPTIONIST,
      });

      // Create veterinarian using service
      const vetData = {
        email: 'vet@test.com',
        password: 'VetPass123!',
        fullName: 'Dr. Smith',
        phoneNumber: '+1234567891',
        address: '456 Vet St',
        specialization: 'General Practice',
        licenseNumber: 'VET123456',
        hireDate: new Date('2024-02-01'),
        salary: 85000,
      };

      const vet = await employeeService.create(testManagerId, {
        ...vetData,
        userType: UserType.VETERINARIAN,
      });

      // Create receptionist using service
      const receptionistData = {
        email: 'receptionist@test.com',
        password: 'Reception123!',
        fullName: 'Jane Reception',
        phoneNumber: '+1234567892',
        address: '789 Front St',
        specialization: 'Customer Service',
        licenseNumber: 'REC123',
        hireDate: new Date('2024-03-01'),
        salary: 45000,
      };

      const receptionist = await employeeService.create(testManagerId, {
        ...receptionistData,
        userType: UserType.RECEPTIONIST,
      });

      // Verify both employees exist with correct profiles
      const dbVet = await veterinarianRepository.findOne({
        where: { employeeId: vet.employeeId },
      });

      const dbReceptionist = await receptionistRepository.findOne({
        where: { employeeId: receptionist.employeeId },
      });

      expect(dbVet).toBeDefined();
      expect(dbVet?.licenseNumber).toBe(vetData.licenseNumber);

      expect(dbReceptionist).toBeDefined();
      expect(dbReceptionist?.employeeId).toBe(receptionist.employeeId);
    });

    it('should update employee information and maintain data integrity', async () => {
      // Create employee first
      const employeeAccount = await createTestAccount({
        username: 'original',
        password: 'Original123!',
        email: 'original@example.com',
        userType: UserType.MANAGER,
      });

      const employeeData = {
        email: 'original.employee@test.com',
        password: 'Original123!',
        fullName: 'Original Name',
        phoneNumber: '+1234567890',
        address: '123 Original St',
        specialization: 'General',
        licenseNumber: 'ORG123',
        hireDate: new Date('2024-01-01'),
        salary: 50000,
      };

      const employee = await employeeService.create(testManagerId, {
        ...employeeData,
        userType: UserType.MANAGER,
      });

      // Update employee
      const updateData = {
        fullName: 'Updated Name',
        phoneNumber: '+9876543210',
        salary: 55000,
        specialization: 'Senior Management',
      };

      const updatedEmployee = await employeeService.update(
        testManagerId,
        employee.employeeId,
        updateData,
      );

      // Verify updates in database
      const dbEmployee = await employeeRepository.findOne({
        where: { employeeId: employee.employeeId },
      });

      expect(dbEmployee?.fullName).toBe(updateData.fullName);
      expect(dbEmployee?.phoneNumber).toBe(updateData.phoneNumber);
      expect(parseFloat(dbEmployee?.salary as string)).toBe(updateData.salary);
      // Unchanged fields should remain the same
      expect(new Date(dbEmployee?.hireDate as any).getTime()).toBe(
        employeeData.hireDate.getTime(),
      );
    });

    it('should toggle employee availability status', async () => {
      // Create care staff employee
      const careStaffAccount = await createTestAccount({
        username: 'carestaff',
        password: 'CarePass123!',
        email: 'care@example.com',
        userType: UserType.CARE_STAFF,
      });

      const careStaffData = {
        email: 'care.staff@test.com',
        password: 'CarePass123!',
        fullName: 'Care Staff',
        phoneNumber: '+1234567893',
        address: '123 Care St',
        specialization: 'Animal Care',
        licenseNumber: 'CARE123',
        hireDate: new Date('2024-04-01'),
        salary: 40000,
      };

      const careStaff = await employeeService.create(testManagerId, {
        ...careStaffData,
        userType: UserType.CARE_STAFF,
      });

      // Initially should be available
      let dbCareStaff = await careStaffRepository.findOne({
        where: { employeeId: careStaff.employeeId },
      });
      expect(dbCareStaff?.isAvailable).toBe(true);

      // Toggle to unavailable
      await employeeService.markUnavailable(careStaff.employeeId);

      dbCareStaff = await careStaffRepository.findOne({
        where: { employeeId: careStaff.employeeId },
      });
      expect(dbCareStaff?.isAvailable).toBe(false);

      // Toggle back to available
      await employeeService.markAvailable(careStaff.employeeId);

      dbCareStaff = await careStaffRepository.findOne({
        where: { employeeId: careStaff.employeeId },
      });
      expect(dbCareStaff?.isAvailable).toBe(true);
    });
  });

  describe('Cross-Service Integration', () => {
    it('should maintain referential integrity between accounts and employees', async () => {
      // Create employee (this also creates the account)
      const employee = await employeeService.create(testManagerId, {
        email: 'integrity.employee@test.com',
        password: 'Integrity123!',
        fullName: 'Integrity Test',
        phoneNumber: '+1234567894',
        address: '123 Integrity St',
        specialization: 'Testing',
        licenseNumber: 'INT123',
        hireDate: new Date('2024-05-01'),
        salary: 60000,
        userType: UserType.MANAGER,
      });

      // Find the account that was created for this employee
      const dbAccount = await accountRepository.findOne({
        where: { email: 'integrity.employee@test.com' },
      });

      const dbEmployee = await employeeRepository.findOne({
        where: { employeeId: employee.employeeId },
      });

      expect(dbAccount).toBeDefined();
      expect(dbEmployee).toBeDefined();
      expect(dbEmployee?.accountId).toBe(dbAccount?.accountId);
      expect(dbAccount?.userType).toBe(UserType.MANAGER);
    });

    it('should handle employee queries with role filtering', async () => {
      // Create multiple employees of different roles
      const managerAccount = await createTestAccount({
        username: 'manager2',
        password: 'Manager2123!',
        email: 'manager2@example.com',
        userType: UserType.MANAGER,
      });

      const vetAccount = await createTestAccount({
        username: 'vet2',
        password: 'VetPass2123!',
        email: 'vet2@example.com',
        userType: UserType.VETERINARIAN,
      });

      const managerEmployee = await employeeService.create(testManagerId, {
        email: 'manager2@test.com',
        password: 'Manager2123!',
        fullName: 'Manager Two',
        phoneNumber: '+1234567895',
        address: '456 Manager St',
        specialization: 'Management',
        licenseNumber: 'MGR234',
        hireDate: new Date('2024-06-01'),
        salary: 70000,
        userType: UserType.MANAGER,
      });

      const vetEmployee = await employeeService.create(testManagerId, {
        email: 'vet2@test.com',
        password: 'VetPass2123!',
        fullName: 'Vet Two',
        phoneNumber: '+1234567896',
        address: '789 Vet St',
        specialization: 'Surgery',
        licenseNumber: 'VET234567',
        hireDate: new Date('2024-06-01'),
        salary: 80000,
        userType: UserType.VETERINARIAN,
      });

      // Test role-based queries
      const allEmployees = await employeeService.getAll();
      const managers = await employeeService.getByRole(UserType.MANAGER);
      const vets = await employeeService.getByRole(UserType.VETERINARIAN);

      expect(allEmployees.length).toBeGreaterThanOrEqual(2);
      expect(managers.length).toBeGreaterThanOrEqual(1);
      expect(vets.length).toBeGreaterThanOrEqual(1);

      // Verify that managers and vets are properly filtered
      expect(
        managers.some((m) => m.employeeId === managerEmployee.employeeId),
      ).toBe(true);
      expect(vets.some((v) => v.employeeId === vetEmployee.employeeId)).toBe(
        true,
      );
    });
  });

  describe('Pet Owner Integration', () => {
    it('should create pet owner and verify profile data', async () => {
      const ownerData = {
        email: 'pet.owner@example.com',
        password: 'OwnerPass123!',
        fullName: 'Pet Owner',
        phoneNumber: '+1234567897',
        address: '123 Pet Street',
        preferredContactMethod: 'email',
        emergencyContact: '+0987654321',
      };

      const createdOwner = await petOwnerService.register(ownerData);

      // Verify owner exists in database
      const dbOwner = await petOwnerRepository.findOne({
        where: { petOwnerId: createdOwner.petOwnerId },
      });

      expect(dbOwner).toBeDefined();
      expect(dbOwner?.fullName).toBe(ownerData.fullName);
      expect(dbOwner?.phoneNumber).toBe(ownerData.phoneNumber);
      expect(dbOwner?.address).toBe(ownerData.address);

      testPetOwnerId = createdOwner.petOwnerId;
    });

    it('should update pet owner information', async () => {
      // Create owner first
      const ownerData = {
        email: 'original.owner@example.com',
        password: 'OriginalPass123!',
        fullName: 'Original Owner',
        phoneNumber: '+1234567898',
        address: 'Original Address',
        preferredContactMethod: 'email',
        emergencyContact: '+0987654321',
      };

      const owner = await petOwnerService.register(ownerData);

      // Update owner
      const updateData = {
        fullName: 'Updated Owner',
        phoneNumber: '+9876543211',
        address: 'Updated Address',
      };

      const updatedOwner = await petOwnerService.updateProfile(
        owner.accountId, // updateProfile expects accountId, not petOwnerId
        updateData,
      );

      // Verify updates
      const dbOwner = await petOwnerRepository.findOne({
        where: { petOwnerId: owner.petOwnerId },
      });

      expect(dbOwner?.fullName).toBe(updateData.fullName);
      expect(dbOwner?.phoneNumber).toBe(updateData.phoneNumber);
      expect(dbOwner?.address).toBe(updateData.address);
    });
  });
});
