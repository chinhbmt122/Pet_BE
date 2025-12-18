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
    description: 'Unique invoice number',
    example: 'INV-20241218-00001',
  })
  @IsNotEmpty({ message: 'Invoice number is required' })
  @IsString({ message: 'Invoice number must be a string' })
  @MaxLength(50, { message: 'Invoice number cannot exceed 50 characters' })
  invoiceNumber: string;

  @ApiProperty({
    description: 'Subtotal amount before tax and discount',
    example: 500000,
  })
  @IsNotEmpty({ message: 'Subtotal is required' })
  @IsNumber({}, { message: 'Subtotal must be a number' })
  @Min(0, { message: 'Subtotal cannot be negative' })
  subtotal: number;

  @ApiProperty({
    description: 'Discount amount',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount cannot be negative' })
  discount?: number;

  @ApiProperty({ description: 'Tax amount', example: 45000, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Tax must be a number' })
  @Min(0, { message: 'Tax cannot be negative' })
  tax?: number;

  @ApiProperty({
    description: 'Total amount after tax and discount',
    example: 495000,
  })
  @IsNotEmpty({ message: 'Total amount is required' })
  @IsNumber({}, { message: 'Total amount must be a number' })
  @Min(0, { message: 'Total amount cannot be negative' })
  totalAmount: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
