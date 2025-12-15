import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ServiceModule } from '../../src/modules/service.module';
import { ServiceCategoryModule } from '../../src/modules/service-category.module';
import { ScheduleModule } from '../../src/modules/schedule.module';
import { EmployeeModule } from '../../src/modules/employee.module';
import { ServiceService } from '../../src/services/service.service';
import { ServiceCategoryService } from '../../src/services/service-category.service';
import { ScheduleService } from '../../src/services/schedule.service';
import { Service } from '../../src/entities/service.entity';
import { ServiceCategory } from '../../src/entities/service-category.entity';
import { WorkSchedule } from '../../src/entities/work-schedule.entity';
import { Employee } from '../../src/entities/employee.entity';
import { CareStaff } from '../../src/entities/care-staff.entity';
import { Account } from '../../src/entities/account.entity';
import { UserType } from '../../src/entities/types/entity.types';
import { getTestDatabaseConfig } from '../e2e/test-db.config';

/**
 * Epic 3 Integration Tests - Service & Schedule Domain
 *
 * Tests service-to-service interactions for:
 * - Service category management (using ServiceCategoryService)
 * - Service catalog management (using ServiceService - direct CRUD)
 * - Work schedule management (using ScheduleService with WorkScheduleDomainModel)
 *
 * Updated to match refactored DDD service layer.
 */
describe('Epic 3 Integration Tests - Service & Schedule Domain', () => {
  let module: TestingModule;
  let serviceService: ServiceService;
  let serviceCategoryService: ServiceCategoryService;
  let scheduleService: ScheduleService;

  // Repositories for direct database operations
  let serviceRepository: Repository<Service>;
  let serviceCategoryRepository: Repository<ServiceCategory>;
  let scheduleRepository: Repository<WorkSchedule>;
  let employeeRepository: Repository<Employee>;
  let careStaffRepository: Repository<CareStaff>;
  let accountRepository: Repository<Account>;

  // Test data IDs
  let testCategoryId: number;
  let testServiceId: number;
  let testEmployeeId: number;
  let testScheduleId: number;

  const testDatabaseConfig = getTestDatabaseConfig();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot(testDatabaseConfig),
        ServiceModule,
        ServiceCategoryModule,
        ScheduleModule,
        EmployeeModule,
      ],
    }).compile();

    serviceService = module.get<ServiceService>(ServiceService);
    serviceCategoryService = module.get<ServiceCategoryService>(
      ServiceCategoryService,
    );
    scheduleService = module.get<ScheduleService>(ScheduleService);

    serviceRepository = module.get<Repository<Service>>(
      getRepositoryToken(Service),
    );
    serviceCategoryRepository = module.get<Repository<ServiceCategory>>(
      getRepositoryToken(ServiceCategory),
    );
    scheduleRepository = module.get<Repository<WorkSchedule>>(
      getRepositoryToken(WorkSchedule),
    );
    employeeRepository = module.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
    careStaffRepository = module.get<Repository<CareStaff>>(
      getRepositoryToken(CareStaff),
    );
    accountRepository = module.get<Repository<Account>>(
      getRepositoryToken(Account),
    );
  }, 30000);

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up test data using raw SQL with CASCADE
    // Order matters due to foreign key constraints
    await accountRepository.query('TRUNCATE TABLE "work_schedules" CASCADE');
    await accountRepository.query('TRUNCATE TABLE "services" CASCADE');
    await accountRepository.query(
      'TRUNCATE TABLE "service_categories" CASCADE',
    );
    await accountRepository.query('TRUNCATE TABLE "employees" CASCADE');
    await accountRepository.query('TRUNCATE TABLE "accounts" CASCADE');
  });

  // Helper to create test employee
  async function createTestEmployee(): Promise<CareStaff> {
    const account = await accountRepository.save({
      email: `test${Date.now()}@example.com`,
      passwordHash: '$2b$10$hashedpassword',
      userType: UserType.CARE_STAFF,
      isActive: true,
    });

    const staff = await careStaffRepository.save({
      accountId: account.accountId,
      fullName: 'Test Worker',
      phoneNumber: '0123456789',
      hireDate: new Date(),
      salary: 40000,
      isAvailable: true,
    });

    return staff;
  }

  describe('Service Category Management Integration', () => {
    it('should create service category and verify database consistency', async () => {
      // ServiceCategoryService.createCategory returns DTO
      const createdCategory = await serviceCategoryService.createCategory({
        categoryName: 'Grooming Services',
        description: 'Professional pet grooming services',
      });

      // Verify category was created (returns DTO with 'id')
      expect(createdCategory).toBeDefined();
      expect(createdCategory.id).toBeDefined();
      expect(createdCategory.categoryName).toBe('Grooming Services');
      expect(createdCategory.isActive).toBe(true);

      // Verify in database
      const dbCategory = await serviceCategoryRepository.findOne({
        where: { categoryId: createdCategory.id },
      });

      expect(dbCategory).toBeDefined();
      expect(dbCategory?.categoryName).toBe('Grooming Services');

      testCategoryId = createdCategory.id;
    });

    it('should update service category and toggle active status', async () => {
      // Create category first
      const category = await serviceCategoryService.createCategory({
        categoryName: 'Initial Category',
        description: 'Initial description',
      });

      // Update category
      const updatedCategory = await serviceCategoryService.updateCategory(
        category.id,
        {
          categoryName: 'Updated Category',
          description: 'Updated description',
        },
      );

      // Verify updates
      expect(updatedCategory.categoryName).toBe('Updated Category');

      // Toggle active status
      const toggled = await serviceCategoryService.toggleActive(category.id);
      expect(toggled.isActive).toBe(false);

      // Toggle back
      const toggledBack = await serviceCategoryService.toggleActive(
        category.id,
      );
      expect(toggledBack.isActive).toBe(true);
    });

    it('should prevent deletion of category with linked services', async () => {
      // Create category
      const category = await serviceCategoryService.createCategory({
        categoryName: 'Linked Category',
        description: 'Category with services',
      });

      // Create service linked to category
      await serviceService.createService({
        categoryId: category.id,
        serviceName: 'Linked Service',
        description: 'Service linked to category',
        basePrice: 50000,
        estimatedDuration: 60,
        requiredStaffType: 'CareStaff',
      });

      // Attempt to delete category with linked services should fail
      await expect(
        serviceCategoryService.deleteCategory(category.id),
      ).rejects.toThrow();

      // Verify category still exists
      const dbCategory = await serviceCategoryRepository.findOne({
        where: { categoryId: category.id },
      });
      expect(dbCategory).toBeDefined();
    });
  });

  describe('Service Management Integration', () => {
    beforeEach(async () => {
      // Create test category
      const category = await serviceCategoryService.createCategory({
        categoryName: 'Test Services',
        description: 'Services for testing',
      });
      testCategoryId = category.id;
    });

    it('should create service and link to category', async () => {
      // ServiceService.createService returns DTO
      const createdService = await serviceService.createService({
        categoryId: testCategoryId,
        serviceName: 'Basic Grooming',
        description: 'Complete grooming service',
        basePrice: 150000,
        estimatedDuration: 90,
        requiredStaffType: 'CareStaff',
      });

      // Verify service was created (returns DTO with 'id')
      expect(createdService).toBeDefined();
      expect(createdService.id).toBeDefined();
      expect(createdService.serviceName).toBe('Basic Grooming');
      expect(createdService.categoryId).toBe(testCategoryId);
      expect(createdService.isAvailable).toBe(true);

      // Verify in database
      const dbService = await serviceRepository.findOne({
        where: { serviceId: createdService.id },
        relations: ['serviceCategory'],
      });

      expect(dbService).toBeDefined();
      expect(dbService?.serviceCategory.categoryId).toBe(testCategoryId);

      testServiceId = createdService.id;
    });

    it('should update service and calculate dynamic pricing', async () => {
      // Create service first
      const service = await serviceService.createService({
        categoryId: testCategoryId,
        serviceName: 'Update Test Service',
        description: 'Service for update testing',
        basePrice: 100000,
        estimatedDuration: 60,
        requiredStaffType: 'Veterinarian',
      });

      // Update service
      const updatedService = await serviceService.updateService(service.id, {
        serviceName: 'Updated Service Name',
        basePrice: 120000,
        estimatedDuration: 75,
      });

      // Verify updates
      expect(updatedService.serviceName).toBe('Updated Service Name');
      expect(updatedService.basePrice).toBe(120000);
      expect(updatedService.estimatedDuration).toBe(75);

      // Test price calculation - verify behavior rather than exact values
      const priceResult = await serviceService.calculateServicePrice(
        service.id,
        'large',
      );
      expect(priceResult.basePrice).toBe(120000);
      // For 'large' size, modifier should be > 1
      expect(priceResult.modifier).toBeGreaterThan(1);
      // Final price should be higher than base price for large size
      expect(priceResult.finalPrice).toBeGreaterThan(priceResult.basePrice);
      expect(priceResult.finalPrice).toBe(priceResult.basePrice * priceResult.modifier);
    });

    it('should toggle service availability', async () => {
      // Create service
      const service = await serviceService.createService({
        categoryId: testCategoryId,
        serviceName: 'Availability Test',
        description: 'Testing availability toggle',
        basePrice: 50000,
        estimatedDuration: 30,
        requiredStaffType: 'CareStaff',
      });

      // Initially available
      expect(service.isAvailable).toBe(true);

      // Mark as unavailable
      const unavailable = await serviceService.updateServiceAvailability(
        service.id,
        false,
      );
      expect(unavailable.isAvailable).toBe(false);

      // Mark as available again
      const available = await serviceService.updateServiceAvailability(
        service.id,
        true,
      );
      expect(available.isAvailable).toBe(true);
    });

    it('should search and filter services', async () => {
      // Create multiple services
      const service1 = await serviceService.createService({
        categoryId: testCategoryId,
        serviceName: 'Premium Grooming',
        description: 'High-end grooming',
        basePrice: 250000,
        estimatedDuration: 120,
        requiredStaffType: 'CareStaff',
      });

      const service2 = await serviceService.createService({
        categoryId: testCategoryId,
        serviceName: 'Basic Checkup',
        description: 'Routine health check',
        basePrice: 80000,
        estimatedDuration: 45,
        requiredStaffType: 'Veterinarian',
      });

      // Search by name
      const searchResults = await serviceService.searchServices('Grooming');
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].id).toBe(service1.id);

      // Filter by price range
      const priceRangeResults = await serviceService.getServicesByPriceRange(
        70000,
        100000,
      );
      expect(priceRangeResults.length).toBe(1);
      expect(priceRangeResults[0].id).toBe(service2.id);

      // Filter by staff type
      const staffTypeResults =
        await serviceService.getServicesByStaffType('Veterinarian');
      expect(staffTypeResults.length).toBe(1);
      expect(staffTypeResults[0].id).toBe(service2.id);
    });
  });

  describe('Schedule Management Integration', () => {
    beforeEach(async () => {
      // Create test employee
      const employee = await createTestEmployee();
      testEmployeeId = employee.employeeId;
    });

    it('should create work schedule for employee', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const workDate = tomorrow.toISOString().split('T')[0];

      // ScheduleService.createSchedule uses CreateWorkScheduleDto, returns WorkScheduleResponseDto
      const createdSchedule = await scheduleService.createSchedule({
        employeeId: testEmployeeId,
        workDate: workDate,
        startTime: '09:00',
        endTime: '17:00',
        notes: 'Regular shift',
      });

      // Verify schedule was created (returns DTO with 'id')
      expect(createdSchedule).toBeDefined();
      expect(createdSchedule.id).toBeDefined();
      expect(createdSchedule.employeeId).toBe(testEmployeeId);
      expect(createdSchedule.startTime).toBe('09:00');
      expect(createdSchedule.endTime).toBe('17:00');
      expect(createdSchedule.workingHours).toBeDefined(); // Computed field from domain

      // Verify in database
      const dbSchedule = await scheduleRepository.findOne({
        where: { scheduleId: createdSchedule.id },
      });

      expect(dbSchedule).toBeDefined();
      expect(dbSchedule?.employeeId).toBe(testEmployeeId);

      testScheduleId = createdSchedule.id;
    });

    it('should update schedule and manage availability', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const workDate = tomorrow.toISOString().split('T')[0];

      // Create schedule first
      const schedule = await scheduleService.createSchedule({
        employeeId: testEmployeeId,
        workDate: workDate,
        startTime: '08:00',
        endTime: '16:00',
      });

      // Update schedule
      const updatedSchedule = await scheduleService.updateSchedule(
        schedule.id,
        {
          startTime: '09:00',
          endTime: '17:00',
          notes: 'Updated shift',
        },
      );

      // Verify updates
      expect(updatedSchedule.startTime).toBe('09:00');
      expect(updatedSchedule.endTime).toBe('17:00');
      expect(updatedSchedule.notes).toBe('Updated shift');

      // Mark as unavailable
      const unavailable = await scheduleService.markUnavailable(
        schedule.id,
        'Sick leave',
      );
      expect(unavailable.isAvailable).toBe(false);

      // Mark as available again
      const available = await scheduleService.markAvailable(schedule.id);
      expect(available.isAvailable).toBe(true);
    });

    it('should retrieve schedules by employee', async () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 3);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 4);

      // Create multiple schedules for same employee
      await scheduleService.createSchedule({
        employeeId: testEmployeeId,
        workDate: futureDate1.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '12:00',
      });

      await scheduleService.createSchedule({
        employeeId: testEmployeeId,
        workDate: futureDate2.toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '17:00',
      });

      // Get schedules by employee
      const employeeSchedules =
        await scheduleService.getSchedulesByEmployee(testEmployeeId);

      expect(employeeSchedules.length).toBe(2);
      expect(
        employeeSchedules.every((s) => s.employeeId === testEmployeeId),
      ).toBe(true);
    });

    it('should check schedule availability', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const workDate = futureDate.toISOString().split('T')[0];

      const schedule = await scheduleService.createSchedule({
        employeeId: testEmployeeId,
        workDate: workDate,
        startTime: '10:00',
        endTime: '15:00',
      });

      // Check availability within working hours
      const checkTime = new Date(workDate);
      checkTime.setHours(12, 0, 0, 0);

      const isAvailable = await scheduleService.checkAvailability(
        testEmployeeId,
        checkTime,
      );
      expect(isAvailable).toBe(true);

      // Mark as unavailable
      await scheduleService.markUnavailable(schedule.id);

      // Check availability again
      const isStillAvailable = await scheduleService.checkAvailability(
        testEmployeeId,
        checkTime,
      );
      expect(isStillAvailable).toBe(false);
    });

    it('should assign and manage break times', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 6);
      const workDate = futureDate.toISOString().split('T')[0];

      const schedule = await scheduleService.createSchedule({
        employeeId: testEmployeeId,
        workDate: workDate,
        startTime: '09:00',
        endTime: '17:00',
      });

      // Assign break time
      const withBreak = await scheduleService.assignBreakTime(
        schedule.id,
        '12:00',
        '13:00',
      );

      expect(withBreak.breakStart).toBe('12:00');
      expect(withBreak.breakEnd).toBe('13:00');

      // Verify working hours calculation accounts for break
      // 9-17 is 8 hours total, minus 1 hour break should result in fewer working hours
      expect(withBreak.workingHours).toBeLessThan(8);
      expect(withBreak.workingHours).toBeGreaterThanOrEqual(7); // At least 7 hours
    });

    it('should get all schedules with filters', async () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 7);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 8);

      // Create multiple schedules
      await scheduleService.createSchedule({
        employeeId: testEmployeeId,
        workDate: futureDate1.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
      });

      const schedule2 = await scheduleService.createSchedule({
        employeeId: testEmployeeId,
        workDate: futureDate2.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
      });

      // Mark one as unavailable
      await scheduleService.markUnavailable(schedule2.id);

      // Get all schedules
      const allSchedules = await scheduleService.getAllSchedules();
      expect(allSchedules.length).toBe(2);

      // Get only available schedules
      const availableSchedules = await scheduleService.getAllSchedules({
        onlyAvailable: true,
      });
      expect(availableSchedules.length).toBe(1);
    });

    it('should delete schedule', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 9);
      const workDate = futureDate.toISOString().split('T')[0];

      const schedule = await scheduleService.createSchedule({
        employeeId: testEmployeeId,
        workDate: workDate,
        startTime: '09:00',
        endTime: '17:00',
      });

      // Delete schedule
      const deleted = await scheduleService.deleteSchedule(schedule.id);
      expect(deleted).toBe(true);

      // Verify schedule no longer exists
      const dbSchedule = await scheduleRepository.findOne({
        where: { scheduleId: schedule.id },
      });
      expect(dbSchedule).toBeNull();
    });
  });

  describe('Cross-Domain Integration', () => {
    it('should maintain data consistency across service and schedule domains', async () => {
      // Create category and service
      const category = await serviceCategoryService.createCategory({
        categoryName: 'Integration Test Category',
      });

      const service = await serviceService.createService({
        categoryId: category.id,
        serviceName: 'Integration Test Service',
        basePrice: 100000,
        estimatedDuration: 60,
        requiredStaffType: 'CareStaff',
      });

      // Create employee and schedule
      const employee = await createTestEmployee();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const schedule = await scheduleService.createSchedule({
        employeeId: employee.employeeId,
        workDate: futureDate.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
      });

      // Verify all relationships
      const dbService = await serviceRepository.findOne({
        where: { serviceId: service.id },
        relations: ['serviceCategory'],
      });

      expect(dbService?.serviceCategory.categoryId).toBe(category.id);

      const dbSchedule = await scheduleRepository.findOne({
        where: { scheduleId: schedule.id },
      });

      expect(dbSchedule?.employeeId).toBe(employee.employeeId);

      // Service requires CareStaff, employee is CareStaff - compatible
      expect(service.requiredStaffType).toBe('CareStaff');
    });
  });
});
