import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';

/**
 * Update Profile DTO
 */
export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe Updated', required: false })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  fullName?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be valid E.164 format',
  })
  phoneNumber?: string;

  @ApiProperty({ example: '456 New St, City, State', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Pet Owner specific fields
  @ApiProperty({ example: 'Phone', required: false })
  @IsString()
  @IsOptional()
  preferredContactMethod?: string;

  @ApiProperty({ example: 'New Emergency: +1234567890', required: false })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  // Employee specific fields
  @ApiProperty({ example: 'Updated specialization', required: false })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
