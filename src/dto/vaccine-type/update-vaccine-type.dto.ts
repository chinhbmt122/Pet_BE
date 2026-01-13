import { PartialType } from '@nestjs/swagger';
import { CreateVaccineTypeDto } from './create-vaccine-type.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing vaccine type
 * All fields from CreateVaccineTypeDto are optional
 * Plus ability to toggle isActive status
 */
export class UpdateVaccineTypeDto extends PartialType(CreateVaccineTypeDto) {
  @ApiPropertyOptional({ 
    description: 'Active status of the vaccine type',
    example: true 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
