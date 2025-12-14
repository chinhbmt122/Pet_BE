import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsDate,
    IsOptional,
    IsEnum,
    IsArray,
    MinLength,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserType } from '../../entities/types/entity.types';

/**
 * DTO for creating a new employee (Manager only)
 */
export class CreateEmployeeDto {
    @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Password', minLength: 8 })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiProperty({ enum: UserType, description: 'Employee role type' })
    @IsEnum(UserType)
    @IsNotEmpty()
    userType: UserType;

    @ApiProperty({ description: 'Full name', example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ description: 'Phone number', example: '0123456789' })
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @ApiPropertyOptional({ description: 'Address', nullable: true })
    @IsString()
    @IsOptional()
    address?: string | null;

    @ApiProperty({ description: 'Hire date', type: Date })
    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    hireDate: Date;

    @ApiProperty({ description: 'Monthly salary', minimum: 0 })
    @IsNumber()
    @Min(0)
    salary: number;

    // Veterinarian-specific
    @ApiPropertyOptional({ description: 'Veterinarian license number' })
    @IsString()
    @IsOptional()
    licenseNumber?: string;

    @ApiPropertyOptional({ description: 'Veterinarian expertise areas' })
    @IsString()
    @IsOptional()
    expertise?: string;

    // CareStaff-specific
    @ApiPropertyOptional({ description: 'CareStaff skills', type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    skills?: string[];
}
