import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServiceCategoryService } from '../../../src/services/service-category.service';
import { ServiceCategory } from '../../../src/entities/service-category.entity';
import { Service } from '../../../src/entities/service.entity';

describe('ServiceCategoryService', () => {
  let service: ServiceCategoryService;
  let serviceCategoryRepository: jest.Mocked<Repository<ServiceCategory>>;
  let serviceRepository: jest.Mocked<Repository<Service>>;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceCategoryService,
        {
          provide: getRepositoryToken(ServiceCategory),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Service),
          useValue: {
            find: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceCategoryService>(ServiceCategoryService);
    serviceCategoryRepository = module.get(getRepositoryToken(ServiceCategory));
    serviceRepository = module.get(getRepositoryToken(Service));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create new service category successfully', async () => {
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

    it('should throw ConflictException for existing category name', async () => {
      const createDto = {
        categoryName: 'Existing Category',
        description: 'Category description',
      };

      serviceCategoryRepository.findOne.mockResolvedValue(mockServiceCategory);

      await expect(service.createCategory(createDto)).rejects.toThrow(
        "Category 'Existing Category' already exists",
      );
    });
  });

  describe('getAllCategories', () => {
    it('should return all active categories', async () => {
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

  describe('getCategoryById', () => {
    it('should return category by ID', async () => {
      serviceCategoryRepository.findOne.mockResolvedValue(mockServiceCategory);

      const result = await service.getCategoryById(1);

      expect(serviceCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        relations: ['services'],
      });
      expect(result).toBeInstanceOf(Object);
      expect(result.categoryName).toBe('Grooming');
    });

    it('should throw NotFoundException for non-existent category', async () => {
      serviceCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.getCategoryById(999)).rejects.toThrow(
        'Category with ID 999 not found',
      );
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
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
        'Category with ID 999 not found',
      );
    });

    it('should throw ConflictException for duplicate name', async () => {
      const updateDto = {
        categoryName: 'Existing Category',
        description: 'Updated description',
      };

      const existingCategory = { ...mockServiceCategory, categoryId: 2 };
      serviceCategoryRepository.findOne
        .mockResolvedValueOnce(mockServiceCategory) // First call for category existence
        .mockResolvedValueOnce(existingCategory); // Second call for name uniqueness

      await expect(service.updateCategory(1, updateDto)).rejects.toThrow(
        "Category 'Existing Category' already exists",
      );
    });
  });

  describe('toggleActive', () => {
    it('should toggle category status successfully', async () => {
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
        'Category with ID 999 not found',
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully when no linked services', async () => {
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

    it('should throw ConflictException when category has linked services', async () => {
      const categoryWithServices = {
        ...mockServiceCategory,
        services: [mockService, mockService], // 2 linked services
      };
      serviceCategoryRepository.findOne.mockResolvedValue(categoryWithServices);

      await expect(service.deleteCategory(1)).rejects.toThrow(
        'Cannot delete category with 2 linked services',
      );
    });

    it('should throw NotFoundException for non-existent category', async () => {
      serviceCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteCategory(999)).rejects.toThrow(
        'Category with ID 999 not found',
      );
    });
  });
});
