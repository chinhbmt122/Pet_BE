import {
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateMedicalRecordDto {
  @ApiPropertyOptional({
    description:
      'Pet ID (optional if appointmentId is provided - will auto-link from appointment)',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @IsOptional()
  petId?: number;

  @ApiProperty({ description: 'Veterinarian ID (must have VETERINARIAN role)' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  veterinarianId: number;

  @ApiProperty({ description: 'Diagnosis' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  diagnosis: string;

  @ApiProperty({ description: 'Treatment prescribed' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  treatment: string;

  @ApiPropertyOptional({ description: 'Linked appointment ID' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @IsOptional()
  appointmentId?: number;

  @ApiPropertyOptional({ description: 'Flexible JSONB medical summary' })
  @IsObject({ message: i18nValidationMessage('validation.isObject') })
  @IsOptional()
  medicalSummary?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Follow-up date (ISO 8601)' })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  @IsOptional()
  followUpDate?: string;
}
