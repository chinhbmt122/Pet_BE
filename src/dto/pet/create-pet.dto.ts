import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreatePetDto {
  @ApiProperty({ description: 'Pet name', example: 'Buddy' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  name: string;

  @ApiProperty({
    description: 'Species (Dog, Cat, Bird, etc.)',
    example: 'Dog',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  species: string;

  @ApiPropertyOptional({ description: 'Breed', example: 'Golden Retriever' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  breed?: string;

  @ApiPropertyOptional({
    description: 'Birth date (ISO 8601)',
    example: '2020-05-15',
  })
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Gender (Male, Female, Unknown)',
    example: 'Male',
    default: 'Unknown',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Weight in kg',
    example: 25.5,
    minimum: 0,
    maximum: 500,
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  @Max(500, { message: i18nValidationMessage('validation.max') })
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: 'Color/markings', example: 'Golden' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Initial health status on registration' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  initialHealthStatus?: string;

  @ApiPropertyOptional({
    description: 'Special notes (allergies, conditions, etc.)',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  specialNotes?: string;
}
