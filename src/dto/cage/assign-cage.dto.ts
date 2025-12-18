import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AssignCageDto {
  @ApiProperty({ description: 'Pet ID to assign to cage' })
  @IsNotEmpty()
  @IsNumber()
  petId: number;

  @ApiProperty({
    description: 'Check-in date (YYYY-MM-DD)',
    example: '2025-12-17',
  })
  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @ApiPropertyOptional({
    description: 'Expected check-out date (YYYY-MM-DD)',
    example: '2025-12-20',
  })
  @IsOptional()
  @IsDateString()
  expectedCheckOutDate?: string;

  @ApiPropertyOptional({
    description: 'Daily rate override (uses cage rate if not provided)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyRate?: number;

  @ApiPropertyOptional({ description: 'Assignment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Employee ID who assigned the cage' })
  @IsOptional()
  @IsNumber()
  assignedById?: number;
}
