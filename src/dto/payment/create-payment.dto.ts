import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../entities/types/entity.types';

/**
 * Create Payment DTO
 *
 * Used for processing cash/bank transfer payments.
 * Input validation via class-validator decorators.
 */
export class CreatePaymentDto {
  @ApiProperty({ description: 'Invoice ID', example: 1 })
  @IsNotEmpty({ message: 'Invoice ID is required' })
  @IsNumber({}, { message: 'Invoice ID must be a number' })
  invoiceId: number;

  @ApiProperty({ description: 'Payment amount', example: 495000 })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount cannot be negative' })
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Employee ID who received payment (for cash)',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Received by must be a number' })
  receivedBy?: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
