import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CageSize, CageStatus } from '../../entities/types/entity.types';

export class UpdateCageDto {
  @ApiPropertyOptional({ description: 'Cage number', example: 'C-101' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cageNumber?: string;

  @ApiPropertyOptional({ description: 'Cage size', enum: CageSize })
  @IsOptional()
  @IsEnum(CageSize)
  size?: CageSize;

  @ApiPropertyOptional({ description: 'Physical location' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  location?: string;

  @ApiPropertyOptional({ description: 'Cage status', enum: CageStatus })
  @IsOptional()
  @IsEnum(CageStatus)
  status?: CageStatus;

  @ApiPropertyOptional({ description: 'Daily rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyRate?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
