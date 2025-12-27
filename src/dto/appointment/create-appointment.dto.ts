import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Pet ID' })
  @IsNotEmpty()
  @IsNumber()
  petId: number;

  @ApiProperty({ description: 'Employee ID (vet/staff)' })
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;

  @ApiProperty({ description: 'Service ID' })
  @IsNotEmpty()
  @IsNumber()
  serviceId: number;

  @ApiProperty({
    description: 'Appointment date (YYYY-MM-DD)',
    example: '2025-12-20',
  })
  @IsNotEmpty()
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ description: 'Start time (HH:MM)', example: '09:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format (HH:MM)',
  })
  startTime: string;

  @ApiPropertyOptional({ description: 'Appointment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  // TODO: Backend should calculate these
  @ApiProperty({ description: 'End time (HH:MM)', example: '10:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format (HH:MM)',
  })
  endTime: string;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;
}
