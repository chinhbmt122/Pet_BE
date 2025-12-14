import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    MinLength,
} from 'class-validator';

/**
 * DTO for PetOwner registration (self-registration, public)
 */
export class RegisterPetOwnerDto {
    @ApiProperty({ description: 'Email address', example: 'owner@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Password', minLength: 8 })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiProperty({ description: 'Full name', example: 'Jane Smith' })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ description: 'Phone number', example: '0987654321' })
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @ApiPropertyOptional({ description: 'Address', nullable: true })
    @IsString()
    @IsOptional()
    address?: string | null;

    @ApiPropertyOptional({ description: 'Preferred contact method', default: 'Email' })
    @IsString()
    @IsOptional()
    preferredContactMethod?: string;

    @ApiPropertyOptional({ description: 'Emergency contact', nullable: true })
    @IsString()
    @IsOptional()
    emergencyContact?: string | null;
}
