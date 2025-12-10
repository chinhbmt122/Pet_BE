import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServiceService } from './service.service';
import { Service } from '../entities/service.entity';
import { Repository } from 'typeorm';

describe('ServiceService', () => {
  let service: ServiceService;
  let serviceRepository: Repository<Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: getRepositoryToken(Service),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
    serviceRepository = module.get<Repository<Service>>(
      getRepositoryToken(Service),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePrice', () => {
    it('should apply discounts to base price', async () => {
      // TODO: Implement test
    });
  });

  describe('getPopularServices', () => {
    it('should return most booked services', async () => {
      // TODO: Implement test
    });
  });
});
