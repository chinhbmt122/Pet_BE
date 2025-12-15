import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new service in the catalog.
 */
export class CreateServiceDto {
  @ApiProperty({ description: 'Service name', example: 'Basic Grooming' })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({ description: 'Category ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiPropertyOptional({ description: 'Service description', example: 'Full grooming service for dogs and cats' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Base price in VND', example: 150000, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  basePrice: number;

  @ApiProperty({ description: 'Estimated duration in minutes', example: 60, minimum: 15, maximum: 480 })
  @IsInt()
  @Min(15)
  @Max(480)
  @IsNotEmpty()
  estimatedDuration: number;

  @ApiProperty({ description: 'Required staff type', example: 'CareStaff', enum: ['Veterinarian', 'CareStaff', 'Any'] })
  @IsString()
  @IsNotEmpty()
  requiredStaffType: string;

  @ApiPropertyOptional({ description: 'Is boarding service', default: false })
  @IsBoolean()
  @IsOptional()
  isBoardingService?: boolean;
}
