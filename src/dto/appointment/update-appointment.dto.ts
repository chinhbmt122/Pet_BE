import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { AppointmentStatus } from 'src/entities/types/entity.types';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Employee ID (vet/staff)' })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  employeeId?: number;

  @ApiPropertyOptional({ description: 'Appointment date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  appointmentDate?: string;

  @ApiPropertyOptional({ description: 'Start time (HH:MM)' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: i18nValidationMessage('validation.custom.invalidTimeFormat'),
  })
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM)' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: i18nValidationMessage('validation.custom.invalidTimeFormat'),
  })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Appointment notes' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Appointment status',
    enum: AppointmentStatus,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Actual cost' })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  actualCost?: number;
}
