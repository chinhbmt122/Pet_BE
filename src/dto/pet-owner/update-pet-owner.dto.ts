import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * DTO for updating PetOwner
 */
export class UpdatePetOwnerDto {
    @ApiPropertyOptional({ description: 'Full name' })
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiPropertyOptional({ description: 'Phone number' })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @ApiPropertyOptional({ description: 'Address', nullable: true })
    @IsString()
    @IsOptional()
    address?: string | null;

    @ApiPropertyOptional({ description: 'Preferred contact method' })
    @IsString()
    @IsOptional()
    preferredContactMethod?: string;

    @ApiPropertyOptional({ description: 'Emergency contact', nullable: true })
    @IsString()
    @IsOptional()
    emergencyContact?: string | null;
}
