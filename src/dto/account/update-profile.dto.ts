import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Update Profile DTO
 */
export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe Updated', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @MinLength(3, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(255, { message: i18nValidationMessage('validation.maxLength') })
  fullName?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: i18nValidationMessage('validation.isPhoneNumber'),
  })
  phoneNumber?: string;

  @ApiProperty({ example: '456 New St, City, State', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  address?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @IsOptional()
  isActive?: boolean;

  // Pet Owner specific fields
  @ApiProperty({ example: 'Phone', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  preferredContactMethod?: string;

  @ApiProperty({ example: 'New Emergency: +1234567890', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  emergencyContact?: string;

  // Employee specific fields
  @ApiProperty({ example: 'Updated specialization', required: false })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  specialization?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @IsOptional()
  isAvailable?: boolean;
}
