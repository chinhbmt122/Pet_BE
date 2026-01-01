import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO for PetOwner registration (self-registration, public)
 */
export class RegisterPetOwnerDto {
  @ApiProperty({ description: 'Email address', example: 'owner@example.com' })
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  email: string;

  @ApiProperty({ description: 'Password', minLength: 8 })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(8, { message: i18nValidationMessage('validation.minLength') })
  password: string;

  @ApiProperty({ description: 'Full name', example: 'Jane Smith' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  fullName: string;

  @ApiProperty({ description: 'Phone number', example: '0987654321' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Address', nullable: true })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  address?: string | null;

  @ApiPropertyOptional({
    description: 'Preferred contact method',
    default: 'Email',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  preferredContactMethod?: string;

  @ApiPropertyOptional({ description: 'Emergency contact', nullable: true })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  emergencyContact?: string | null;
}
