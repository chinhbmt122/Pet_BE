import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserType } from '../../entities/types/entity.types';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO for creating a new employee (Manager only)
 */
export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  email: string;

  @ApiProperty({ description: 'Password', minLength: 8 })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(8, { message: i18nValidationMessage('validation.minLength') })
  password: string;

  @ApiProperty({ enum: UserType, description: 'Employee role type' })
  @IsEnum(UserType, { message: i18nValidationMessage('validation.isEnum') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  userType: UserType;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  fullName: string;

  @ApiProperty({ description: 'Phone number', example: '0123456789' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Address', nullable: true })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  address?: string | null;

  @ApiProperty({ description: 'Hire date', type: Date })
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage('validation.isDate') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  hireDate: Date;

  @ApiProperty({ description: 'Monthly salary', minimum: 0 })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  salary: number;

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
