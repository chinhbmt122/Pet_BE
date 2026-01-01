import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CageSize, CageStatus } from '../../entities/types/entity.types';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateCageDto {
  @ApiPropertyOptional({ description: 'Cage number', example: 'C-101' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(20, { message: i18nValidationMessage('validation.maxLength') })
  cageNumber?: string;

  @ApiPropertyOptional({ description: 'Cage size', enum: CageSize })
  @IsOptional()
  @IsEnum(CageSize, { message: i18nValidationMessage('validation.isEnum') })
  size?: CageSize;

  @ApiPropertyOptional({ description: 'Physical location' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(50, { message: i18nValidationMessage('validation.maxLength') })
  location?: string;

  @ApiPropertyOptional({ description: 'Cage status', enum: CageStatus })
  @IsOptional()
  @IsEnum(CageStatus, { message: i18nValidationMessage('validation.isEnum') })
  status?: CageStatus;

  @ApiPropertyOptional({ description: 'Daily rate' })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  dailyRate?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  notes?: string;
}
