import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CageSize } from '../../entities/types/entity.types';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateCageDto {
  @ApiProperty({
    description: 'Cage number (unique identifier)',
    example: 'C-101',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(20, { message: i18nValidationMessage('validation.maxLength') })
  cageNumber: string;

  @ApiProperty({ description: 'Cage size', enum: CageSize })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsEnum(CageSize, { message: i18nValidationMessage('validation.isEnum') })
  size: CageSize;

  @ApiPropertyOptional({
    description: 'Physical location',
    example: 'Building A, Floor 2',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(50, { message: i18nValidationMessage('validation.maxLength') })
  location?: string;

  @ApiProperty({ description: 'Daily rate in currency', example: 50.0 })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  dailyRate: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  notes?: string;
}
