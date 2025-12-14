import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { UserType } from '../../entities/account.entity';
import { Transform } from 'class-transformer';

/**
 * Register DTO
 */
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  @Transform(({ value }) => value?.toLowerCase?.())
  email: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be valid E.164 format',
  })
  phoneNumber: string;

  @ApiProperty({ example: '123 Main St, City, State', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ enum: UserType, example: UserType.PET_OWNER })
  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;

  // Additional fields for pet owners
  @ApiProperty({ example: 'Email', required: false })
  @IsString()
  @IsOptional()
  preferredContactMethod?: string;

  @ApiProperty({ example: 'Jane Doe: +0987654321', required: false })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  // Additional fields for employees
  @ApiProperty({ example: 'Surgery, Internal Medicine', required: false })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiProperty({ example: 'VET12345', required: false })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsString()
  @IsOptional()
  hireDate?: string;

  @ApiProperty({ example: 5000.0, required: false })
  @IsOptional()
  salary?: number;

  // Additional fields for CareStaff
  @ApiProperty({
    example: ['bathing', 'grooming', 'spa'],
    required: false,
    description: 'Skills for CareStaff employees'
  })
  @IsOptional()
  skills?: string[];
}
