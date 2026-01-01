import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO for updating PetOwner
 */
export class UpdatePetOwnerDto {
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

  @ApiPropertyOptional({ description: 'Preferred contact method' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  preferredContactMethod?: string;

  @ApiPropertyOptional({ description: 'Emergency contact', nullable: true })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  emergencyContact?: string | null;
}
