import {
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateVaccinationDto {
  @ApiProperty({ description: 'Vaccine type ID (from VaccineType catalog)' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  vaccineTypeId: number;

  @ApiProperty({ description: 'Veterinarian ID who administered the vaccine' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  administeredBy: number;

  @ApiProperty({ description: 'Administration date (ISO 8601)' })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  administrationDate: string;

  @ApiPropertyOptional({ description: 'Vaccine batch number for tracking' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({
    description: 'Injection site',
    example: 'Left shoulder',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  site?: string;

  @ApiPropertyOptional({ description: 'Any adverse reactions observed' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  reactions?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Link to medical record ID' })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @IsOptional()
  medicalRecordId?: number;
}
