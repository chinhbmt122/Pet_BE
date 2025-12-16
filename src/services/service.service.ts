import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, ILike } from 'typeorm';
import { Service } from '../entities/service.entity';
import { ServiceCategory } from '../entities/service-category.entity';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
} from '../dto/service';

/**
 * ServiceService (Direct Entity Pattern)
 *
 * Manages service catalog with simple CRUD operations.
 * No domain model needed - Service entity is a simple catalog entry.
 */
@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private readonly categoryRepository: Repository<ServiceCategory>,
  ) {}

  /**
   * Creates new service in catalog.
   */
  async createService(dto: CreateServiceDto): Promise<ServiceResponseDto> {
    // Check for duplicate service name
    const existing = await this.serviceRepository.findOne({
      where: { serviceName: dto.serviceName },
    });
    if (existing) {
      throw new ConflictException(`Service '${dto.serviceName}' already exists`);
    }

    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { categoryId: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
    }

    const entity = this.serviceRepository.create({
      serviceName: dto.serviceName,
      categoryId: dto.categoryId,
      description: dto.description,
      basePrice: dto.basePrice,
      estimatedDuration: dto.estimatedDuration,
      requiredStaffType: dto.requiredStaffType,
      isBoardingService: dto.isBoardingService ?? false,
      isAvailable: true,
    });

    const saved = await this.serviceRepository.save(entity);

    // Reload with category relation for response
    const reloaded = await this.serviceRepository.findOne({
      where: { serviceId: saved.serviceId },
      relations: ['serviceCategory'],
    });

    return ServiceResponseDto.fromEntity(reloaded!);
  }

  /**
   * Updates service details.
   */
  async updateService(
    serviceId: number,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    const entity = await this.serviceRepository.findOne({
      where: { serviceId },
      relations: ['serviceCategory'],
    });
    if (!entity) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Check for name conflict if updating name
    if (dto.serviceName && dto.serviceName !== entity.serviceName) {
      const existing = await this.serviceRepository.findOne({
        where: { serviceName: dto.serviceName },
      });
      if (existing) {
        throw new ConflictException(`Service '${dto.serviceName}' already exists`);
      }
    }

    // Verify category if updating
    if (dto.categoryId && dto.categoryId !== entity.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { categoryId: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }
    }

    const saved = await this.serviceRepository.save({ ...entity, ...dto });

    const reloaded = await this.serviceRepository.findOne({
      where: { serviceId: saved.serviceId },
      relations: ['serviceCategory'],
    });

    return ServiceResponseDto.fromEntity(reloaded!);
  }

  /**
   * Soft deletes service (marks as unavailable).
   */
  async deleteService(serviceId: number): Promise<boolean> {
    const entity = await this.serviceRepository.findOne({
      where: { serviceId },
    });
    if (!entity) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    entity.isAvailable = false;
    await this.serviceRepository.save(entity);
    return true;
  }

  /**
   * Gets service by ID.
   */
  async getServiceById(serviceId: number): Promise<ServiceResponseDto> {
    const entity = await this.serviceRepository.findOne({
      where: { serviceId },
      relations: ['serviceCategory'],
    });
    if (!entity) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    return ServiceResponseDto.fromEntity(entity);
  }

  /**
   * Gets all available services.
   */
  async getAllServices(includeUnavailable = false): Promise<ServiceResponseDto[]> {
    const whereClause = includeUnavailable ? {} : { isAvailable: true };

    const entities = await this.serviceRepository.find({
      where: whereClause,
      relations: ['serviceCategory'],
      order: { serviceName: 'ASC' },
    });

    return ServiceResponseDto.fromEntityList(entities);
  }

  /**
   * Gets services by category.
   */
  async getServicesByCategory(categoryId: number): Promise<ServiceResponseDto[]> {
    const entities = await this.serviceRepository.find({
      where: { categoryId, isAvailable: true },
      relations: ['serviceCategory'],
      order: { serviceName: 'ASC' },
    });

    return ServiceResponseDto.fromEntityList(entities);
  }

  /**
   * Gets services by price range.
   */
  async getServicesByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<ServiceResponseDto[]> {
    const entities = await this.serviceRepository.find({
      where: {
        basePrice: Between(minPrice, maxPrice),
        isAvailable: true,
      },
      relations: ['serviceCategory'],
      order: { basePrice: 'ASC' },
    });

    return ServiceResponseDto.fromEntityList(entities);
  }

  /**
   * Searches services by name.
   */
  async searchServices(searchTerm: string): Promise<ServiceResponseDto[]> {
    const entities = await this.serviceRepository.find({
      where: {
        serviceName: ILike(`%${searchTerm}%`),
        isAvailable: true,
      },
      relations: ['serviceCategory'],
      order: { serviceName: 'ASC' },
    });

    return ServiceResponseDto.fromEntityList(entities);
  }

  /**
   * Toggles service availability.
   */
  async updateServiceAvailability(
    serviceId: number,
    isAvailable: boolean,
  ): Promise<ServiceResponseDto> {
    const entity = await this.serviceRepository.findOne({
      where: { serviceId },
      relations: ['serviceCategory'],
    });
    if (!entity) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    entity.isAvailable = isAvailable;
    const saved = await this.serviceRepository.save(entity);

    return ServiceResponseDto.fromEntity(saved);
  }

  /**
   * Calculates service price with pet type modifier.
   * Pet size modifiers: small=1.0, medium=1.2, large=1.5, extra-large=2.0
   */
  async calculateServicePrice(
    serviceId: number,
    petSize: string = 'medium',
  ): Promise<{ basePrice: number; modifier: number; finalPrice: number }> {
    const entity = await this.serviceRepository.findOne({
      where: { serviceId },
    });
    if (!entity) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const modifiers: Record<string, number> = {
      small: 1.0,
      medium: 1.2,
      large: 1.5,
      'extra-large': 2.0,
    };

    const modifier = modifiers[petSize.toLowerCase()] ?? 1.2;
    const basePrice = Number(entity.basePrice);
    const finalPrice = Math.round(basePrice * modifier);

    return { basePrice, modifier, finalPrice };
  }

  /**
   * Gets boarding services only.
   */
  async getBoardingServices(): Promise<ServiceResponseDto[]> {
    const entities = await this.serviceRepository.find({
      where: { isBoardingService: true, isAvailable: true },
      relations: ['serviceCategory'],
      order: { serviceName: 'ASC' },
    });

    return ServiceResponseDto.fromEntityList(entities);
  }

  /**
   * Gets services by required staff type.
   */
  async getServicesByStaffType(staffType: string): Promise<ServiceResponseDto[]> {
    const entities = await this.serviceRepository.find({
      where: { requiredStaffType: staffType, isAvailable: true },
      relations: ['serviceCategory'],
      order: { serviceName: 'ASC' },
    });

    return ServiceResponseDto.fromEntityList(entities);
  }
}
