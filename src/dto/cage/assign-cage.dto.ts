import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AssignCageDto {
  @ApiProperty({ description: 'Pet ID to assign to cage' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  petId: number;

  @ApiProperty({
    description: 'Check-in date (YYYY-MM-DD)',
    example: '2025-12-17',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  checkInDate: string;

  @ApiPropertyOptional({
    description: 'Expected check-out date (YYYY-MM-DD)',
    example: '2025-12-20',
  })
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  expectedCheckOutDate?: string;

  @ApiPropertyOptional({
    description: 'Daily rate override (uses cage rate if not provided)',
  })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  dailyRate?: number;

  @ApiPropertyOptional({ description: 'Assignment notes' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  notes?: string;

  @ApiPropertyOptional({ description: 'Employee ID who assigned the cage' })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  assignedById?: number;
}
