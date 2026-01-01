import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO for updating an employee
 */
export class UpdateEmployeeDto {
  // Profile fields
  @ApiPropertyOptional({ description: 'Full name' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Address', nullable: true })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  address?: string | null;

  // Employment fields
  @ApiPropertyOptional({ description: 'Salary (Manager only)', minimum: 0 })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @IsOptional()
  salary?: number;

  @ApiPropertyOptional({ description: 'Availability status' })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @IsOptional()
  isAvailable?: boolean;

  // Veterinarian-specific
  @ApiPropertyOptional({ description: 'Veterinarian license number' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'Veterinarian expertise areas' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  expertise?: string;

  // CareStaff-specific
  @ApiPropertyOptional({ description: 'CareStaff skills', type: [String] })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.isString'),
  })
  @IsOptional()
  skills?: string[];
}
