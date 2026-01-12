import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServiceCategoryService } from '../../../src/services/service-category.service';
import { ServiceCategory } from '../../../src/entities/service-category.entity';
import { Service } from '../../../src/entities/service.entity';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

describe('ServiceCategoryService', () => {
  let service: ServiceCategoryService;

  // ===== Use helper types for cleaner declarations =====
  let serviceCategoryRepository: ReturnType<typeof createMockRepository<ServiceCategory>>;
  let serviceRepository: ReturnType<typeof createMockRepository<Service>>;

  const mockServiceCategory: ServiceCategory = {
    categoryId: 1,
    categoryName: 'Grooming',
    description: 'Pet grooming services',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as ServiceCategory;

  const mockService: Service = {
    serviceId: 1,
    categoryId: 1,
    name: 'Basic Grooming',
    description: 'Full grooming service',
    basePrice: 50,
    durationMinutes: 60,
    isActive: true,
    staffType: 'CARE_STAFF',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Service;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    serviceCategoryRepository = createMockRepository<ServiceCategory>();
    serviceRepository = createMockRepository<Service>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceCategoryService,
        {
          provide: getRepositoryToken(ServiceCategory),
          useValue: serviceCategoryRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
      ],
    }).compile();

    service = module.get<ServiceCategoryService>(ServiceCategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P0: createCategory (2 tests)', () => {
    it('[P0-115] should create new service category successfully', async () => {
      const createDto = {
        categoryName: 'New Category',
        description: 'New category description',
      };

      serviceCategoryRepository.findOne.mockResolvedValue(null);
      serviceCategoryRepository.create.mockReturnValue(mockServiceCategory);
      serviceCategoryRepository.save.mockResolvedValue(mockServiceCategory);

      const result = await service.createCategory(createDto);

      expect(serviceCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { categoryName: createDto.categoryName },
      });
      expect(serviceCategoryRepository.create).toHaveBeenCalledWith({
        categoryName: createDto.categoryName,
        description: createDto.description,
        isActive: true,
      });
      expect(result).toBeInstanceOf(Object);
      expect(result.categoryName).toBe('Grooming');
    });

    it('[P0-116] should throw ConflictException for existing category name', async () => {
      const createDto = {
        categoryName: 'Existing Category',
        description: 'Category description',
      };

      serviceCategoryRepository.findOne.mockResolvedValue(mockServiceCategory);

      await expect(service.createCategory(createDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.conflict.resourceAlreadyExists',
          }),
        }),
      );
    });
  });

  describe('P1: getAllCategories (1 test)', () => {
    it('[P1-80] should return all active categories', async () => {
      const categories = [mockServiceCategory];
      serviceCategoryRepository.find.mockResolvedValue(categories);

      const result = await service.getAllCategories();

      expect(serviceCategoryRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['services'],
        order: { categoryName: 'ASC' },
      });
      expect(result).toBeInstanceOf(Array);
      expect(result[0].categoryName).toBe('Grooming');
    });
  });

  describe('P1: getCategoryById (2 tests)', () => {
    it('[P1-81] should return category by ID', async () => {
      serviceCategoryRepository.findOne.mockResolvedValue(mockServiceCategory);

      const result = await service.getCategoryById(1);

      expect(serviceCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        relations: ['services'],
      });
      expect(result).toBeInstanceOf(Object);
      expect(result.categoryName).toBe('Grooming');
    });

    it('[P1-82] should throw NotFoundException for non-existent category', async () => {
      serviceCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.getCategoryById(999)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.serviceCategory',
          }),
        }),
      );
    });
  });

  describe('P0: updateCategory (3 tests)', () => {
    it('[P0-117] should update category successfully', async () => {
      const updateDto = {
        categoryName: 'Updated Category',
        description: 'Updated description',
      };

      serviceCategoryRepository.findOne
        .mockResolvedValueOnce(mockServiceCategory) // First call for category existence
        .mockResolvedValueOnce(null); // Second call for name uniqueness check
      serviceCategoryRepository.save.mockResolvedValue(mockServiceCategory);

      const result = await service.updateCategory(1, updateDto);

      expect(serviceCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        relations: ['services'],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent category', async () => {
      const updateDto = {
        categoryName: 'Updated Category',
        description: 'Updated description',
      };

      serviceCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.updateCategory(999, updateDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.serviceCategory',
          }),
        }),
      );
    });

    it('[P0-119] should throw ConflictException for duplicate name', async () => {
      const updateDto = {
        categoryName: 'Existing Category',
        description: 'Updated description',
      };

      const existingCategory = { ...mockServiceCategory, categoryId: 2 };
      serviceCategoryRepository.findOne
        .mockResolvedValueOnce(mockServiceCategory) // First call for category existence
        .mockResolvedValueOnce(existingCategory); // Second call for name uniqueness

      await expect(service.updateCategory(1, updateDto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.conflict.resourceAlreadyExists',
          }),
        }),
      );
    });
  });

  describe('P2: toggleActive (2 tests)', () => {
    it('[P2-24] should toggle category status successfully', async () => {
      serviceCategoryRepository.findOne.mockResolvedValue(mockServiceCategory);
      serviceCategoryRepository.save.mockResolvedValue(mockServiceCategory);

      const result = await service.toggleActive(1);

      expect(serviceCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        relations: ['services'],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent category', async () => {
      serviceCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.toggleActive(999)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.serviceCategory',
          }),
        }),
      );
    });
  });

  describe('P1: deleteCategory (3 tests)', () => {
    it('[P1-83] should delete category successfully when no linked services', async () => {
      const categoryWithNoServices = { ...mockServiceCategory, services: [] };
      serviceCategoryRepository.findOne.mockResolvedValue(
        categoryWithNoServices,
      );
      serviceCategoryRepository.remove.mockResolvedValue(undefined);

      const result = await service.deleteCategory(1);

      expect(serviceCategoryRepository.remove).toHaveBeenCalledWith(
        categoryWithNoServices,
      );
      expect(result).toBe(true);
    });

    it('[P1-84] should throw ConflictException when category has linked services', async () => {
      const categoryWithServices = {
        ...mockServiceCategory,
        services: [mockService, mockService], // 2 linked services
      };
      serviceCategoryRepository.findOne.mockResolvedValue(categoryWithServices);

      await expect(service.deleteCategory(1)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.conflict.resourceAlreadyExists',
          }),
        }),
      );
    });

    it('[P1-85] should throw NotFoundException for non-existent category', async () => {
      serviceCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteCategory(999)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.serviceCategory',
          }),
        }),
      );
    });
  });
});
