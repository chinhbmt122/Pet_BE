import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VaccineCategory } from '../../entities/types/entity.types';

/**
 * DTO for creating a new vaccine type
 * Only Manager role can use this
 */
export class CreateVaccineTypeDto {
  @ApiProperty({ 
    enum: VaccineCategory,
    description: 'Category of vaccine (Core, Non-core, Optional)',
    example: 'Core'
  })
  @IsEnum(VaccineCategory)
  category: VaccineCategory;

  @ApiProperty({ 
    description: 'Name of the vaccine',
    example: 'Vaccine Dại' 
  })
  @IsString()
  vaccineName: string;

  @ApiProperty({ 
    description: 'Target species for this vaccine',
    example: 'Dog' 
  })
  @IsString()
  targetSpecies: string;

  @ApiPropertyOptional({ 
    description: 'Manufacturer of the vaccine',
    example: 'Nobivac' 
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ 
    description: 'Detailed description of the vaccine'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Recommended age in months for first vaccination',
    example: 3 
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  recommendedAgeMonths?: number;

  @ApiPropertyOptional({ 
    description: 'Interval in months for booster shots',
    example: 12 
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  boosterIntervalMonths?: number;
}
