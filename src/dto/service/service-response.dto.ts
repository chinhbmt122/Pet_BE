import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Service } from '../../entities/service.entity';

/**
 * Response DTO for service data.
 */
export class ServiceResponseDto {
  @ApiProperty({ description: 'Service ID' })
  id: number;

  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @ApiProperty({ description: 'Category ID' })
  categoryId: number;

  @ApiPropertyOptional({ description: 'Category name', nullable: true })
  categoryName?: string;

  @ApiPropertyOptional({ description: 'Service description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Base price in VND' })
  basePrice: number;

  @ApiProperty({ description: 'Estimated duration in minutes' })
  estimatedDuration: number;

  @ApiProperty({ description: 'Required staff type' })
  requiredStaffType: string;

  @ApiProperty({ description: 'Is service available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Is boarding service' })
  isBoardingService: boolean;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  /**
   * Creates response DTO from Service entity.
   * (No domain model for Service - simple CRUD entity)
   */
  static fromEntity(entity: Service): ServiceResponseDto {
    const dto = new ServiceResponseDto();
    dto.id = entity.serviceId;
    dto.serviceName = entity.serviceName;
    dto.categoryId = entity.categoryId;
    dto.categoryName = entity.serviceCategory?.categoryName;
    dto.description = entity.description;
    dto.basePrice = Number(entity.basePrice);
    dto.estimatedDuration = entity.estimatedDuration;
    dto.requiredStaffType = entity.requiredStaffType;
    dto.isAvailable = entity.isAvailable;
    dto.isBoardingService = entity.isBoardingService;
    dto.createdAt = entity.createdAt;
    return dto;
  }

  static fromEntityList(entities: Service[]): ServiceResponseDto[] {
    return entities.map((e) => ServiceResponseDto.fromEntity(e));
  }
}
