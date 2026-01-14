import {
  IsDateString,
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO for creating a new day off.
 */
export class CreateDayOffDto {
  @ApiProperty({
    description: 'Date of the day off (ISO 8601)',
    example: '2026-01-15',
  })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  date: string;

  @ApiProperty({ description: 'Name of the day off', example: 'New Year' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(255, { message: i18nValidationMessage('validation.maxLength') })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the day off',
    example: 'Annual holiday celebration',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  description?: string;
}
