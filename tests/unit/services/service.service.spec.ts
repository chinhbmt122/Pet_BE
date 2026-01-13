import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServiceService } from '../../../src/services/service.service';
import { Service } from '../../../src/entities/service.entity';
import { ServiceCategory } from '../../../src/entities/service-category.entity';
import { Between, ILike } from 'typeorm';
import { CreateServiceDto, UpdateServiceDto } from '../../../src/dto/service';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

describe('ServiceService - Full Unit Tests', () => {
  let service: ServiceService;

  // ===== Use helper types for cleaner declarations =====
  let serviceRepository: ReturnType<typeof createMockRepository<Service>>;
  let categoryRepository: ReturnType<typeof createMockRepository<ServiceCategory>>;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    serviceRepository = createMockRepository<Service>();
    categoryRepository = createMockRepository<ServiceCategory>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
        {
          provide: getRepositoryToken(ServiceCategory),
          useValue: categoryRepository,
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: createService (4 tests)', () => {
    const validDto: CreateServiceDto = {
      serviceName: 'Basic Grooming',
      categoryId: 1,
      description: 'Full grooming service',
      basePrice: 150000,
      estimatedDuration: 60,
      requiredStaffType: 'CareStaff',
      isBoardingService: false,
    };

    const mockCategory: ServiceCategory = {
      categoryId: 1,
      categoryName: 'Grooming',
    } as ServiceCategory;

    it('[P0-65] should create service successfully', async () => {
      const mockService: Service = {
        serviceId: 1,
        ...validDto,
        isAvailable: true,
        serviceCategory: mockCategory,
      } as Service;

      serviceRepository.findOne.mockResolvedValueOnce(null); // No duplicate name
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      serviceRepository.create.mockReturnValue(mockService);
      serviceRepository.save.mockResolvedValue(mockService);
      serviceRepository.findOne.mockResolvedValueOnce(mockService); // Reload with category

      const result = await service.createService(validDto);

      expect(result).toBeDefined();
      expect(result.serviceName).toBe('Basic Grooming');
      expect(result.isAvailable).toBe(true);
    });

    it('[P0-66] should throw 409 if service name already exists', async () => {
      const existingService: Service = {
        serviceId: 1,
        serviceName: 'Basic Grooming',
      } as Service;

      serviceRepository.findOne.mockResolvedValue(existingService);

      await expect(service.createService(validDto)).rejects.toThrow();
    });

    it('[P0-67] should throw 404 if category does not exist', async () => {
      serviceRepository.findOne.mockResolvedValue(null); // No duplicate
      categoryRepository.findOne.mockResolvedValue(null); // Category not found

      await expect(service.createService(validDto)).rejects.toThrow();
    });

    it('[P0-68] should set isAvailable to true by default', async () => {
      const mockService: Service = {
        serviceId: 1,
        ...validDto,
        isAvailable: true,
        serviceCategory: mockCategory,
      } as Service;

      serviceRepository.findOne.mockResolvedValueOnce(null);
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      serviceRepository.create.mockReturnValue(mockService);
      serviceRepository.save.mockResolvedValue(mockService);
      serviceRepository.findOne.mockResolvedValueOnce(mockService);

      const result = await service.createService(validDto);

      expect(result.isAvailable).toBe(true);
    });
  });

  describe('P0: calculateServicePrice (5 tests)', () => {
    const mockService: Service = {
      serviceId: 1,
      serviceName: 'Grooming',
      basePrice: 100000,
    } as Service;

    it('[P0-69] should apply small pet modifier (1.0x)', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.calculateServicePrice(1, 'small');

      expect(result.basePrice).toBe(100000);
      expect(result.modifier).toBe(1.0);
      expect(result.finalPrice).toBe(100000);
    });

    it('[P0-70] should apply medium pet modifier (1.2x)', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.calculateServicePrice(1, 'medium');

      expect(result.basePrice).toBe(100000);
      expect(result.modifier).toBe(1.2);
      expect(result.finalPrice).toBe(120000);
    });

    it('[P0-71] should apply large pet modifier (1.5x)', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.calculateServicePrice(1, 'large');

      expect(result.basePrice).toBe(100000);
      expect(result.modifier).toBe(1.5);
      expect(result.finalPrice).toBe(150000);
    });

    it('[P0-72] should apply extra-large pet modifier (2.0x)', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.calculateServicePrice(1, 'extra-large');

      expect(result.basePrice).toBe(100000);
      expect(result.modifier).toBe(2.0);
      expect(result.finalPrice).toBe(200000);
    });

    it('[P0-73] should default to medium modifier for unknown size', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.calculateServicePrice(1, 'gigantic');

      expect(result.modifier).toBe(1.2);
      expect(result.finalPrice).toBe(120000);
    });
  });

  describe('P1: updateService (4 tests)', () => {
    const mockCategory: ServiceCategory = {
      categoryId: 1,
      categoryName: 'Grooming',
    } as ServiceCategory;

    const existingService: Service = {
      serviceId: 1,
      serviceName: 'Basic Grooming',
      categoryId: 1,
      basePrice: 100000,
      serviceCategory: mockCategory,
    } as Service;

    const updateDto: UpdateServiceDto = {
      basePrice: 120000,
      description: 'Updated description',
    };

    it('[P1-52] should update service successfully', async () => {
      const updatedService: Service = {
        ...existingService,
        ...updateDto,
      } as Service;

      serviceRepository.findOne.mockResolvedValueOnce(existingService);
      serviceRepository.save.mockResolvedValue(updatedService);
      serviceRepository.findOne.mockResolvedValueOnce(updatedService); // Reload

      const result = await service.updateService(1, updateDto);

      expect(result.basePrice).toBe(120000);
    });

    it('[P1-53] should throw 404 if service not found', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(service.updateService(999, updateDto)).rejects.toThrow();
    });

    it('[P1-54] should throw 409 if new name conflicts', async () => {
      const conflictService: Service = {
        serviceId: 2,
        serviceName: 'Premium Grooming',
      } as Service;

      serviceRepository.findOne
        .mockResolvedValueOnce(existingService) // Original service found
        .mockResolvedValueOnce(conflictService); // Name conflict

      await expect(
        service.updateService(1, { serviceName: 'Premium Grooming' }),
      ).rejects.toThrow();
    });

    it('[P1-55] should validate new category exists', async () => {
      serviceRepository.findOne.mockResolvedValue(existingService);
      categoryRepository.findOne.mockResolvedValue(null); // Category not found

      await expect(
        service.updateService(1, { categoryId: 999 }),
      ).rejects.toThrow();
    });
  });

  describe('P1: deleteService (2 tests)', () => {
    const mockService: Service = {
      serviceId: 1,
      serviceName: 'Grooming',
      isAvailable: true,
    } as Service;

    it('[P1-56] should soft delete service by setting isAvailable to false', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);
      serviceRepository.save.mockResolvedValue({
        ...mockService,
        isAvailable: false,
      });

      const result = await service.deleteService(1);

      expect(result).toBe(true);
      expect(serviceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isAvailable: false }),
      );
    });

    it('[P1-57] should throw 404 if service not found', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteService(999)).rejects.toThrow();
    });
  });

  describe('P1: getServiceById (2 tests)', () => {
    const mockService: Service = {
      serviceId: 1,
      serviceName: 'Grooming',
      serviceCategory: { categoryName: 'Grooming' } as ServiceCategory,
    } as Service;

    it('[P1-58] should return service when found', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.getServiceById(1);

      expect(result).toBeDefined();
      expect(result.serviceName).toBe('Grooming');
    });

    it('[P1-59] should throw 404 when not found', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(service.getServiceById(999)).rejects.toThrow();
    });
  });

  describe('P2: getServicesByCategory (1 test)', () => {
    it('[P2-10] should return services filtered by category', async () => {
      const mockServices: Service[] = [
        {
          serviceId: 1,
          serviceName: 'Basic Grooming',
          categoryId: 1,
          isAvailable: true,
        } as Service,
        {
          serviceId: 2,
          serviceName: 'Premium Grooming',
          categoryId: 1,
          isAvailable: true,
        } as Service,
      ];

      serviceRepository.find.mockResolvedValue(mockServices);

      const result = await service.getServicesByCategory(1);

      expect(result).toHaveLength(2);
      expect(serviceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categoryId: 1, isAvailable: true },
        }),
      );
    });
  });

  describe('P2: getServicesByPriceRange (1 test)', () => {
    it('[P2-11] should return services within price range', async () => {
      const mockServices: Service[] = [
        { serviceId: 1, basePrice: 100000 } as Service,
        { serviceId: 2, basePrice: 150000 } as Service,
      ];

      serviceRepository.find.mockResolvedValue(mockServices);

      const result = await service.getServicesByPriceRange(100000, 200000);

      expect(result).toHaveLength(2);
      expect(serviceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            basePrice: Between(100000, 200000),
            isAvailable: true,
          }),
        }),
      );
    });
  });

  describe('P2: searchServices (1 test)', () => {
    it('[P2-12] should search services by name (case-insensitive)', async () => {
      const mockServices: Service[] = [
        { serviceId: 1, serviceName: 'Grooming' } as Service,
        { serviceId: 2, serviceName: 'Advanced Grooming' } as Service,
      ];

      serviceRepository.find.mockResolvedValue(mockServices);

      const result = await service.searchServices('groom');

      expect(result).toHaveLength(2);
      expect(serviceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            serviceName: ILike('%groom%'),
            isAvailable: true,
          }),
        }),
      );
    });
  });

  describe('P2: updateServiceAvailability (2 tests)', () => {
    const mockService: Service = {
      serviceId: 1,
      serviceName: 'Grooming',
      isAvailable: true,
      serviceCategory: {} as ServiceCategory,
    } as Service;

    it('[P2-13] should toggle availability to false', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);
      serviceRepository.save.mockResolvedValue({
        ...mockService,
        isAvailable: false,
      });

      const result = await service.updateServiceAvailability(1, false);

      expect(result.isAvailable).toBe(false);
    });

    it('[P2-14] should toggle availability to true', async () => {
      const unavailableService = { ...mockService, isAvailable: false };
      serviceRepository.findOne.mockResolvedValue(unavailableService);
      serviceRepository.save.mockResolvedValue({
        ...unavailableService,
        isAvailable: true,
      });

      const result = await service.updateServiceAvailability(1, true);

      expect(result.isAvailable).toBe(true);
    });
  });
});
