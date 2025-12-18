import {
  IsInt,
  IsString,
  IsDateString,
  IsOptional,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new work schedule.
 */
export class CreateWorkScheduleDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  employeeId: number;

  @ApiProperty({ description: 'Work date (ISO 8601)', example: '2025-01-15' })
  @IsDateString()
  @IsNotEmpty()
  workDate: string;

  @ApiProperty({ description: 'Start time (HH:MM)', example: '09:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format',
  })
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time (HH:MM)', example: '17:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM format',
  })
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Break start time (HH:MM)',
    example: '12:00',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'breakStart must be in HH:MM format',
  })
  @IsOptional()
  breakStart?: string;

  @ApiPropertyOptional({
    description: 'Break end time (HH:MM)',
    example: '13:00',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'breakEnd must be in HH:MM format',
  })
  @IsOptional()
  breakEnd?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Morning shift' })
  @IsString()
  @IsOptional()
  notes?: string;
}
