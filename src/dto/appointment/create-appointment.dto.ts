import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  IsArray,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AppointmentServiceItemDto } from './appointment-service-item.dto';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Pet ID' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  petId: number;

  @ApiProperty({ description: 'Employee ID (vet/staff)' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  employeeId: number;

  // Legacy single service (backward compatible)
  @ApiPropertyOptional({ 
    description: 'Service ID (deprecated - use services array instead)',
    deprecated: true 
  })
  @ValidateIf(o => !o.services || o.services.length === 0)
  @IsNotEmpty({ message: 'Either serviceId or services array must be provided' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  serviceId?: number;

  // New multi-service support
  @ApiPropertyOptional({ 
    description: 'Array of services with quantity and notes',
    type: [AppointmentServiceItemDto],
    example: [
      { serviceId: 1, quantity: 1, notes: 'Regular checkup' },
      { serviceId: 2, quantity: 2, notes: 'Vaccine doses' }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentServiceItemDto)
  services?: AppointmentServiceItemDto[];

  @ApiProperty({
    description: 'Appointment date (YYYY-MM-DD)',
    example: '2025-12-20',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  appointmentDate: string;

  @ApiProperty({ description: 'Start time (HH:MM)', example: '09:00' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: i18nValidationMessage('validation.custom.invalidTimeFormat'),
  })
  startTime: string;

  @ApiPropertyOptional({ description: 'Appointment notes' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  notes?: string;

  // TODO: Backend should calculate these
  @ApiProperty({ description: 'End time (HH:MM)', example: '10:00' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: i18nValidationMessage('validation.custom.invalidTimeFormat'),
  })
  endTime: string;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  estimatedCost?: number;
}

