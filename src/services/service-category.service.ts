import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  ServiceCategoryResponseDto,
} from '../dto/service-category';

/**
 * ServiceCategoryService
 *
 * Manages service categories (Grooming, Medical, Boarding, etc.)
 * Simple CRUD operations for catalog reference data.
 */
@Injectable()
export class ServiceCategoryService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categoryRepository: Repository<ServiceCategory>,
  ) {}

  /**
   * Creates new service category.
   */
  async createCategory(dto: CreateServiceCategoryDto): Promise<ServiceCategoryResponseDto> {
    const existing = await this.categoryRepository.findOne({
      where: { categoryName: dto.categoryName },
    });
    if (existing) {
      throw new ConflictException(`Category '${dto.categoryName}' already exists`);
    }

    const entity = this.categoryRepository.create({
      categoryName: dto.categoryName,
      description: dto.description,
      isActive: true,
    });

    const saved = await this.categoryRepository.save(entity);
    return ServiceCategoryResponseDto.fromEntity(saved);
  }

  /**
   * Updates category.
   */
  async updateCategory(
    categoryId: number,
    dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    const entity = await this.categoryRepository.findOne({
      where: { categoryId },
      relations: ['services'],
    });
    if (!entity) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    if (dto.categoryName && dto.categoryName !== entity.categoryName) {
      const existing = await this.categoryRepository.findOne({
        where: { categoryName: dto.categoryName },
      });
      if (existing) {
        throw new ConflictException(`Category '${dto.categoryName}' already exists`);
      }
    }

    Object.assign(entity, dto);
    const saved = await this.categoryRepository.save(entity);
    return ServiceCategoryResponseDto.fromEntity(saved);
  }

  /**
   * Gets category by ID.
   */
  async getCategoryById(categoryId: number): Promise<ServiceCategoryResponseDto> {
    const entity = await this.categoryRepository.findOne({
      where: { categoryId },
      relations: ['services'],
    });
    if (!entity) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return ServiceCategoryResponseDto.fromEntity(entity);
  }

  /**
   * Gets all active categories.
   */
  async getAllCategories(includeInactive = false): Promise<ServiceCategoryResponseDto[]> {
    const whereClause = includeInactive ? {} : { isActive: true };

    const entities = await this.categoryRepository.find({
      where: whereClause,
      relations: ['services'],
      order: { categoryName: 'ASC' },
    });

    return ServiceCategoryResponseDto.fromEntityList(entities);
  }

  /**
   * Toggles category active status.
   */
  async toggleActive(categoryId: number): Promise<ServiceCategoryResponseDto> {
    const entity = await this.categoryRepository.findOne({
      where: { categoryId },
      relations: ['services'],
    });
    if (!entity) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    entity.isActive = !entity.isActive;
    const saved = await this.categoryRepository.save(entity);
    return ServiceCategoryResponseDto.fromEntity(saved);
  }

  /**
   * Deletes category (only if no services are linked).
   */
  async deleteCategory(categoryId: number): Promise<boolean> {
    const entity = await this.categoryRepository.findOne({
      where: { categoryId },
      relations: ['services'],
    });
    if (!entity) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    if (entity.services && entity.services.length > 0) {
      throw new ConflictException(
        `Cannot delete category with ${entity.services.length} linked services`,
      );
    }

    await this.categoryRepository.remove(entity);
    return true;
  }
}
