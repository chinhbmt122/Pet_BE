import {
  IsInt,
  IsString,
  IsDateString,
  IsOptional,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO for creating a new work schedule.
 */
export class CreateWorkScheduleDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  employeeId: number;

  @ApiProperty({ description: 'Work date (ISO 8601)', example: '2025-01-15' })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  workDate: string;

  @ApiProperty({ description: 'Start time (HH:MM)', example: '09:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: i18nValidationMessage('validation.custom.invalidTimeFormat'),
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:MM)', example: '17:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: i18nValidationMessage('validation.custom.invalidTimeFormat'),
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Break start time (HH:MM)',
    example: '12:00',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: i18nValidationMessage('validation.custom.invalidTimeFormat'),
  })
  @IsOptional()
  breakStart?: string;

  @ApiPropertyOptional({
    description: 'Break end time (HH:MM)',
    example: '13:00',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: i18nValidationMessage('validation.custom.invalidTimeFormat'),
  })
  @IsOptional()
  breakEnd?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Morning shift' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;
}
