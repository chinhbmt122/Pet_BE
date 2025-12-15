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


export class CreatePetDto {
  @ApiProperty({ description: 'Pet name', example: 'Buddy' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Species (Dog, Cat, Bird, etc.)', example: 'Dog' })
  @IsString()
  @IsNotEmpty()
  species: string;

  @ApiPropertyOptional({ description: 'Breed', example: 'Golden Retriever' })
  @IsString()
  @IsOptional()
  breed?: string;

  @ApiPropertyOptional({ description: 'Birth date (ISO 8601)', example: '2020-05-15' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Gender (Male, Female, Unknown)', example: 'Male', default: 'Unknown' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'Weight in kg', example: 25.5, minimum: 0, maximum: 500 })
  @IsNumber()
  @Min(0)
  @Max(500)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: 'Color/markings', example: 'Golden' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Initial health status on registration' })
  @IsString()
  @IsOptional()
  initialHealthStatus?: string;

  @ApiPropertyOptional({ description: 'Special notes (allergies, conditions, etc.)' })
  @IsString()
  @IsOptional()
  specialNotes?: string;
}
