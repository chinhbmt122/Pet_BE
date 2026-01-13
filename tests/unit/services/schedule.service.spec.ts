import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleService } from '../../../src/services/schedule.service';
import { WorkSchedule } from '../../../src/entities/work-schedule.entity';
import { Employee } from '../../../src/entities/employee.entity';
import { CreateWorkScheduleDto, UpdateWorkScheduleDto } from '../../../src/dto/schedule';
import { UserType } from '../../../src/entities/account.entity';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

describe('ScheduleService - Full Unit Tests', () => {
  let service: ScheduleService;

  // ===== Use helper types for cleaner declarations =====
  let scheduleRepository: ReturnType<typeof createMockRepository<WorkSchedule>>;
  let employeeRepository: ReturnType<typeof createMockRepository<Employee>>;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    scheduleRepository = createMockRepository<WorkSchedule>();
    employeeRepository = createMockRepository<Employee>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: getRepositoryToken(WorkSchedule),
          useValue: scheduleRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: employeeRepository,
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: createSchedule (4 tests)', () => {
    const mockEmployee: Employee = {
      employeeId: 1,
      fullName: 'Dr. John Doe',
    } as Employee;

    const validDto: CreateWorkScheduleDto = {
      employeeId: 1,
      workDate: '2026-01-10',
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
    };

    it('[P0-74] should create schedule successfully', async () => {
      const mockSchedule: WorkSchedule = {
        scheduleId: 1,
        employeeId: 1,
        workDate: new Date('2026-01-10'),
        startTime: '08:00',
        endTime: '17:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        isAvailable: true,
      } as WorkSchedule;

      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      scheduleRepository.findOne.mockResolvedValue(null); // No existing schedule
      scheduleRepository.create.mockReturnValue(mockSchedule);
      scheduleRepository.save.mockResolvedValue(mockSchedule);

      const result = await service.createSchedule(validDto);

      expect(result).toBeDefined();
      expect(result.startTime).toBe('08:00');
      expect(result.endTime).toBe('17:00');
    });

    it('[P0-75] should throw 404 if employee not found', async () => {
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(service.createSchedule(validDto)).rejects.toThrow();
    });

    it('[P0-76] should throw 409 if schedule already exists for employee on date', async () => {
      const existingSchedule: WorkSchedule = {
        scheduleId: 1,
        employeeId: 1,
        workDate: new Date('2026-01-10'),
      } as WorkSchedule;

      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      scheduleRepository.findOne.mockResolvedValue(existingSchedule);

      await expect(service.createSchedule(validDto)).rejects.toThrow();
    });

    it('[P0-77] should validate endTime > startTime', async () => {
      const invalidDto: CreateWorkScheduleDto = {
        ...validDto,
        startTime: '17:00',
        endTime: '08:00', // Invalid: end before start
      };

      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      scheduleRepository.findOne.mockResolvedValue(null);

      await expect(service.createSchedule(invalidDto)).rejects.toThrow();
    });
  });

  describe('P1: updateSchedule (3 tests)', () => {
    const existingSchedule: WorkSchedule = {
      scheduleId: 1,
      employeeId: 1,
      workDate: new Date('2026-01-10'),
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      isAvailable: true,
    } as WorkSchedule;

    it('[P1-60] should update schedule times successfully', async () => {
      const updateDto: UpdateWorkScheduleDto = {
        startTime: '09:00',
        endTime: '18:00',
      };

      scheduleRepository.findOne.mockResolvedValue(existingSchedule);
      scheduleRepository.save.mockResolvedValue({
        ...existingSchedule,
        ...updateDto,
      });

      const result = await service.updateSchedule(1, updateDto);

      expect(result.startTime).toBe('09:00');
      expect(result.endTime).toBe('18:00');
    });

    it('[P1-61] should throw 404 if schedule not found', async () => {
      scheduleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSchedule(999, { notes: 'Test' }),
      ).rejects.toThrow();
    });

    it('[P1-62] should update break times independently', async () => {
      const updateDto: UpdateWorkScheduleDto = {
        breakStart: '11:30',
        breakEnd: '12:30',
      };

      scheduleRepository.findOne.mockResolvedValue(existingSchedule);
      scheduleRepository.save.mockResolvedValue({
        ...existingSchedule,
        ...updateDto,
      });

      const result = await service.updateSchedule(1, updateDto);

      expect(result.breakStart).toBe('11:30');
      expect(result.breakEnd).toBe('12:30');
    });
  });

  describe('P1: deleteSchedule (2 tests)', () => {
    const mockSchedule: WorkSchedule = {
      scheduleId: 1,
      employeeId: 1,
    } as WorkSchedule;

    it('[P1-63] should delete schedule successfully', async () => {
      scheduleRepository.findOne.mockResolvedValue(mockSchedule);
      scheduleRepository.remove.mockResolvedValue(mockSchedule);

      const result = await service.deleteSchedule(1);

      expect(result).toBe(true);
      expect(scheduleRepository.remove).toHaveBeenCalledWith(mockSchedule);
    });

    it('[P1-64] should throw 404 if schedule not found', async () => {
      scheduleRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteSchedule(999)).rejects.toThrow();
    });
  });

  describe('P0: checkAvailability (4 tests)', () => {
    const mockSchedule: WorkSchedule = {
      scheduleId: 1,
      employeeId: 1,
      workDate: new Date('2026-01-10'),
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      isAvailable: true,
    } as WorkSchedule;

    it('[P0-78] should return true for time within working hours', async () => {
      scheduleRepository.findOne.mockResolvedValue(mockSchedule);

      const dateTime = new Date('2026-01-10T10:00:00');
      const result = await service.checkAvailability(1, dateTime);

      expect(result).toBe(true);
    });

    it('[P0-79] should return false for time during break', async () => {
      scheduleRepository.findOne.mockResolvedValue(mockSchedule);

      const dateTime = new Date('2026-01-10T12:30:00');
      const result = await service.checkAvailability(1, dateTime);

      expect(result).toBe(false); // During break time
    });

    it('[P0-80] should return false for time outside working hours', async () => {
      scheduleRepository.findOne.mockResolvedValue(mockSchedule);

      const dateTime = new Date('2026-01-10T18:00:00');
      const result = await service.checkAvailability(1, dateTime);

      expect(result).toBe(false); // After endTime
    });

    it('[P0-81] should return false if no schedule exists', async () => {
      scheduleRepository.findOne.mockResolvedValue(null);

      const dateTime = new Date('2026-01-10T10:00:00');
      const result = await service.checkAvailability(1, dateTime);

      expect(result).toBe(false);
    });
  });

  describe('P1: getSchedulesByEmployee (3 tests)', () => {
    const mockSchedules: WorkSchedule[] = [
      {
        scheduleId: 1,
        employeeId: 1,
        workDate: new Date('2026-01-10'),
        startTime: '08:00',
        endTime: '17:00',
      } as WorkSchedule,
      {
        scheduleId: 2,
        employeeId: 1,
        workDate: new Date('2026-01-11'),
        startTime: '08:00',
        endTime: '17:00',
      } as WorkSchedule,
    ];

    it('[P1-65] should return employee schedules for date range', async () => {
      scheduleRepository.find.mockResolvedValue(mockSchedules);

      const startDate = new Date('2026-01-10');
      const endDate = new Date('2026-01-15');

      const result = await service.getSchedulesByEmployee(1, startDate, endDate);

      expect(result).toHaveLength(2);
    });

    it('[P1-66] should enforce self-access for VET users', async () => {
      const vetUser = { accountId: 1, userType: UserType.VETERINARIAN };
      const vetEmployee: Employee = {
        employeeId: 1,
        accountId: 1,
      } as Employee;

      employeeRepository.findOne.mockResolvedValue(vetEmployee);
      scheduleRepository.find.mockResolvedValue(mockSchedules);

      const result = await service.getSchedulesByEmployee(1, undefined, undefined, vetUser);

      expect(result).toHaveLength(2);
    });

    it('[P1-67] should throw 403 if VET tries to access other employee schedule', async () => {
      const vetUser = { accountId: 1, userType: UserType.VETERINARIAN };
      const vetEmployee: Employee = {
        employeeId: 1,
        accountId: 1,
      } as Employee;

      employeeRepository.findOne.mockResolvedValue(vetEmployee);

      await expect(
        service.getSchedulesByEmployee(2, undefined, undefined, vetUser),
      ).rejects.toThrow();
    });
  });

  describe('P2: markUnavailable / markAvailable (2 tests)', () => {
    const mockSchedule: WorkSchedule = {
      scheduleId: 1,
      employeeId: 1,
      workDate: new Date('2026-01-10'),
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WorkSchedule;

    it('[P2-15] should mark schedule as unavailable', async () => {
      scheduleRepository.findOne.mockResolvedValue(mockSchedule);
      scheduleRepository.save.mockResolvedValue({
        ...mockSchedule,
        isAvailable: false,
        notes: 'Sick leave',
      });

      const result = await service.markUnavailable(1, 'Sick leave');

      expect(result.isAvailable).toBe(false);
    });

    it('[P2-16] should mark schedule as available', async () => {
      const unavailableSchedule = { ...mockSchedule, isAvailable: false };
      scheduleRepository.findOne.mockResolvedValue(unavailableSchedule);
      scheduleRepository.save.mockResolvedValue({
        ...unavailableSchedule,
        isAvailable: true,
      });

      const result = await service.markAvailable(1);

      expect(result.isAvailable).toBe(true);
    });
  });
});
