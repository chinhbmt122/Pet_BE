import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { AppointmentStatus } from 'src/entities/types/entity.types';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Employee ID (vet/staff)' })
  @IsOptional()
  @IsNumber()
  employeeId?: number;

  @ApiPropertyOptional({ description: 'Appointment date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  appointmentDate?: string;

  @ApiPropertyOptional({ description: 'Start time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format (HH:MM)',
  })
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format (HH:MM)',
  })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Appointment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Appointment status',
    enum: AppointmentStatus,
  })
  @IsOptional()
  @IsString()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Actual cost' })
  @IsOptional()
  @IsNumber()
  actualCost?: number;
}
