import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleService } from '../../../src/services/schedule.service';
import { WorkSchedule } from '../../../src/entities/work-schedule.entity';
import { Repository } from 'typeorm';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let scheduleRepository: Repository<WorkSchedule>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: getRepositoryToken(WorkSchedule),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    scheduleRepository = module.get<Repository<WorkSchedule>>(
      getRepositoryToken(WorkSchedule),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableSlots', () => {
    it('should return free time slots', async () => {
      // TODO: Mock repository to return schedules
      // TODO: Mock splitTimeIntoSlots()
      // TODO: Assert correct slots returned
    });
  });

  describe('checkAvailability', () => {
    it('should return true for available time', async () => {
      // TODO: Implement test
    });
  });
});
