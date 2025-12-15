import {
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVaccinationDto {
  @ApiProperty({ description: 'Vaccine type ID (from VaccineType catalog)' })
  @IsNumber()
  vaccineTypeId: number;

  @ApiProperty({ description: 'Veterinarian ID who administered the vaccine' })
  @IsNumber()
  administeredBy: number;

  @ApiProperty({ description: 'Administration date (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  administrationDate: string;

  @ApiPropertyOptional({ description: 'Vaccine batch number for tracking' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Injection site', example: 'Left shoulder' })
  @IsString()
  @IsOptional()
  site?: string;

  @ApiPropertyOptional({ description: 'Any adverse reactions observed' })
  @IsString()
  @IsOptional()
  reactions?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Link to medical record ID' })
  @IsNumber()
  @IsOptional()
  medicalRecordId?: number;
}
