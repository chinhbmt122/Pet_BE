import { Test, TestingModule } from '@nestjs/testing';
import { ServiceController } from '../../../src/controllers/service.controller';
import { ServiceService } from '../../../src/services/service.service';

describe('ServiceController', () => {
  let controller: ServiceController;
  let service: ServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        {
          provide: ServiceService,
          useValue: {
            createService: jest.fn(),
            updateService: jest.fn(),
            deleteService: jest.fn(),
            getServiceById: jest.fn(),
            getAllServices: jest.fn(),
            searchServices: jest.fn(),
            calculatePrice: jest.fn(),
            getPopularServices: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ServiceController>(ServiceController);
    service = module.get<ServiceService>(ServiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllServices', () => {
    it('should return all active services', async () => {
      // TODO: Implement test
    });
  });

  describe('calculatePrice', () => {
    it('should calculate service price with discounts', async () => {
      // TODO: Implement test
    });
  });
});
