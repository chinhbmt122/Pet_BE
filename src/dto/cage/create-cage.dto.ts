import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CageSize } from '../../entities/types/entity.types';

export class CreateCageDto {
  @ApiProperty({
    description: 'Cage number (unique identifier)',
    example: 'C-101',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  cageNumber: string;

  @ApiProperty({ description: 'Cage size', enum: CageSize })
  @IsNotEmpty()
  @IsEnum(CageSize)
  size: CageSize;

  @ApiPropertyOptional({
    description: 'Physical location',
    example: 'Building A, Floor 2',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  location?: string;

  @ApiProperty({ description: 'Daily rate in currency', example: 50.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  dailyRate: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
