import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO for creating a new service in the catalog.
 */
export class CreateServiceDto {
  @ApiProperty({ description: 'Service name', example: 'Basic Grooming' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  serviceName: string;

  @ApiProperty({ description: 'Category ID', example: 1 })
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  categoryId: number;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Full grooming service for dogs and cats',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Base price in VND',
    example: 150000,
    minimum: 0,
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  basePrice: number;

  @ApiProperty({
    description: 'Estimated duration in minutes',
    example: 60,
    minimum: 15,
    maximum: 480,
  })
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @Min(15, { message: i18nValidationMessage('validation.min') })
  @Max(480, { message: i18nValidationMessage('validation.max') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  estimatedDuration: number;

  @ApiProperty({
    description: 'Required staff type',
    example: 'CareStaff',
    enum: ['Veterinarian', 'CareStaff', 'Any'],
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  requiredStaffType: string;

  @ApiPropertyOptional({ description: 'Is boarding service', default: false })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @IsOptional()
  isBoardingService?: boolean;
}
