import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from '../../entities/service-category.entity';

export class ServiceCategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: number;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiPropertyOptional({ description: 'Category description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Is category active' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of services in this category' })
  serviceCount: number;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  static fromEntity(entity: ServiceCategory, serviceCount = 0): ServiceCategoryResponseDto {
    const dto = new ServiceCategoryResponseDto();
    dto.id = entity.categoryId;
    dto.categoryName = entity.categoryName;
    dto.description = entity.description;
    dto.isActive = entity.isActive;
    dto.serviceCount = entity.services?.length ?? serviceCount;
    dto.createdAt = entity.createdAt;
    return dto;
  }

  static fromEntityList(entities: ServiceCategory[]): ServiceCategoryResponseDto[] {
    return entities.map((e) => ServiceCategoryResponseDto.fromEntity(e));
  }
}
