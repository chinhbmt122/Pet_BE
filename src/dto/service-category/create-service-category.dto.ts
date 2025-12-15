import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new service category.
 */
export class CreateServiceCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Grooming' })
  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'Pet grooming and styling services' })
  @IsString()
  @IsOptional()
  description?: string;
}
