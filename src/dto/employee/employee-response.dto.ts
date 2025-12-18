import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../../entities/types/entity.types';

/**
 * Employee response DTO (excludes sensitive data)
 */
export class EmployeeResponseDto {
  @ApiProperty({ description: 'Employee ID' })
  employeeId: number;

  @ApiProperty({ description: 'Account ID' })
  accountId: number;

  @ApiProperty({ enum: UserType, description: 'Employee role' })
  userType: UserType;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Address', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'Hire date' })
  hireDate: Date;

  @ApiProperty({ description: 'Monthly salary' })
  salary: number;

  @ApiProperty({ description: 'Is available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;

  // Role-specific (optional)
  @ApiPropertyOptional({ description: 'License number (Veterinarian)' })
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'Expertise (Veterinarian)' })
  expertise?: string;

  @ApiPropertyOptional({ description: 'Skills (CareStaff)', type: [String] })
  skills?: string[];
}
