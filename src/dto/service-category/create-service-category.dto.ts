import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO for creating a new service category.
 */
export class CreateServiceCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Grooming' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  categoryName: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Pet grooming and styling services',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  description?: string;
}
