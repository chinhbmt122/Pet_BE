import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO for service selection in appointment
 */
export class AppointmentServiceDto {
  @ApiProperty({ description: 'Service ID' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  serviceId: number;

  @ApiPropertyOptional({
    description: 'Quantity of service',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Service-specific notes' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  notes?: string;
}

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Pet ID' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  petId: number;

  @ApiProperty({ description: 'Employee ID (vet/staff)' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  employeeId: number;

  @ApiProperty({
    description: 'Array of services to be performed in this appointment',
    type: [AppointmentServiceDto],
    example: [
      { serviceId: 1, quantity: 1, notes: 'Regular checkup' },
      { serviceId: 2, quantity: 1 },
    ],
  })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.arrayMinSize'),
  })
  @ValidateNested({ each: true })
  @Type(() => AppointmentServiceDto)
  services: AppointmentServiceDto[];

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

  // TODO: Backend should calculate these
  @ApiProperty({ description: 'End time (HH:MM)', example: '10:00' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: i18nValidationMessage('validation.custom.invalidTimeFormat'),
  })
  endTime: string;

  @ApiPropertyOptional({ description: 'General appointment notes' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Estimated total cost (will be calculated if not provided)',
  })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  estimatedCost?: number;
}
