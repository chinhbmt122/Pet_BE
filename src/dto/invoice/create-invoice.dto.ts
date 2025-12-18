import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Invoice DTO
 *
 * Used for generating invoices from completed appointments.
 * Input validation via class-validator decorators.
 */
export class CreateInvoiceDto {
  @ApiProperty({ description: 'Appointment ID', example: 1 })
  @IsNotEmpty({ message: 'Appointment ID is required' })
  @IsNumber({}, { message: 'Appointment ID must be a number' })
  appointmentId: number;

  @ApiProperty({
    description: 'Optional discount code or percentage override',
    example: 'HOLIDAY10',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Discount code must be a string' })
  discountCode?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
