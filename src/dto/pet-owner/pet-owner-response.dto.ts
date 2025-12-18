import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * PetOwner response DTO
 */
export class PetOwnerResponseDto {
  @ApiProperty({ description: 'PetOwner ID' })
  petOwnerId: number;

  @ApiProperty({ description: 'Account ID' })
  accountId: number;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Address', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'Preferred contact method' })
  preferredContactMethod: string;

  @ApiPropertyOptional({ description: 'Emergency contact', nullable: true })
  emergencyContact: string | null;

  @ApiProperty({ description: 'Registration date' })
  registrationDate: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}
