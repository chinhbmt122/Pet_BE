import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { UserType } from '../../entities/account.entity';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Register DTO
 */
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  @Transform(({ value }) => value?.toLowerCase?.())
  email: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(8, { message: i18nValidationMessage('validation.minLength') })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: i18nValidationMessage('validation.custom.passwordStrength'),
  })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(3, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(255, { message: i18nValidationMessage('validation.maxLength') })
  fullName: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: i18nValidationMessage('validation.isPhoneNumber'),
  })
  phoneNumber: string;

  @ApiProperty({ example: '123 Main St, City, State', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  address?: string;

  @ApiProperty({ enum: UserType, example: UserType.PET_OWNER })
  @IsEnum(UserType, { message: i18nValidationMessage('validation.isEnum') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  userType: UserType;

  // Additional fields for pet owners
  @ApiProperty({ example: 'Email', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  preferredContactMethod?: string;

  @ApiProperty({ example: 'Jane Doe: +0987654321', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  emergencyContact?: string;

  // Additional fields for employees
  @ApiProperty({ example: 'Surgery, Internal Medicine', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  specialization?: string;

  @ApiProperty({ example: 'VET12345', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  licenseNumber?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  hireDate?: string;

  @ApiProperty({ example: 5000.0, required: false })
  @IsOptional()
  salary?: number;

  // Additional fields for CareStaff
  @ApiProperty({
    example: ['bathing', 'grooming', 'spa'],
    required: false,
    description: 'Skills for CareStaff employees',
  })
  @IsOptional()
  skills?: string[];
}
