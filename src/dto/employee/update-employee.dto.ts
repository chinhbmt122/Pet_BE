import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';

/**
 * DTO for updating an employee
 */
export class UpdateEmployeeDto {
  // Profile fields
  @ApiPropertyOptional({ description: 'Full name' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Address', nullable: true })
  @IsString()
  @IsOptional()
  address?: string | null;

  // Employment fields
  @ApiPropertyOptional({ description: 'Salary (Manager only)', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;

  @ApiPropertyOptional({ description: 'Availability status' })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  // Veterinarian-specific
  @ApiPropertyOptional({ description: 'Veterinarian license number' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'Veterinarian expertise areas' })
  @IsString()
  @IsOptional()
  expertise?: string;

  // CareStaff-specific
  @ApiPropertyOptional({ description: 'CareStaff skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}
