import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../entities/types/entity.types';

/**
 * Initiate Online Payment DTO
 *
 * Used for initiating VNPay/Momo/ZaloPay online payments.
 * Input validation via class-validator decorators.
 */
export class InitiateOnlinePaymentDto {
  @ApiProperty({ description: 'Invoice ID', example: 1 })
  @IsNotEmpty({ message: 'Invoice ID is required' })
  @IsNumber({}, { message: 'Invoice ID must be a number' })
  invoiceId: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.VNPAY,
  })
  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Return URL after payment',
    example: 'https://example.com/payment/return',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Return URL must be a valid URL' })
  returnUrl?: string;

  @ApiProperty({
    description: 'Customer IP address',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'IP address must be a string' })
  ipAddress?: string;

  @ApiProperty({
    description: 'Locale (vi or en)',
    example: 'vi',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Locale must be a string' })
  locale?: string;
}
