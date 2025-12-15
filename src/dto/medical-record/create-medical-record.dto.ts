import {
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
  @ApiProperty({ description: 'Pet ID' })
  @IsNumber()
  petId: number;

  @ApiProperty({ description: 'Veterinarian ID (must have VETERINARIAN role)' })
  @IsNumber()
  veterinarianId: number;

  @ApiProperty({ description: 'Diagnosis' })
  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @ApiProperty({ description: 'Treatment prescribed' })
  @IsString()
  @IsNotEmpty()
  treatment: string;

  @ApiPropertyOptional({ description: 'Linked appointment ID' })
  @IsNumber()
  @IsOptional()
  appointmentId?: number;

  @ApiPropertyOptional({ description: 'Flexible JSONB medical summary' })
  @IsObject()
  @IsOptional()
  medicalSummary?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Follow-up date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}
