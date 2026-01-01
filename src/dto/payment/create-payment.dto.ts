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
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Create Payment DTO
 *
 * Used for processing cash/bank transfer payments.
 * Input validation via class-validator decorators.
 */
export class CreatePaymentDto {
  @ApiProperty({ description: 'Invoice ID', example: 1 })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  invoiceId: number;

  @ApiProperty({ description: 'Payment amount', example: 495000 })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.custom.amountRequired'),
  })
  @IsNumber(
    {},
    { message: i18nValidationMessage('validation.custom.amountMustBeNumber') },
  )
  @Min(0, {
    message: i18nValidationMessage('validation.custom.amountGreaterThanZero'),
  })
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsEnum(PaymentMethod, {
    message: i18nValidationMessage('validation.custom.invalidPaymentMethod'),
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Employee ID who received payment (for cash)',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  receivedBy?: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  notes?: string;
}
