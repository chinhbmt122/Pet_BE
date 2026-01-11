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
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Initiate Online Payment DTO
 *
 * Used for initiating VNPay/Momo/ZaloPay online payments.
 * Input validation via class-validator decorators.
 */
export class InitiateOnlinePaymentDto {
  @ApiProperty({ description: 'Invoice ID', example: 1 })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  invoiceId: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.VNPAY,
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsEnum(PaymentMethod, {
    message: i18nValidationMessage('validation.custom.invalidPaymentMethod'),
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description:
      'Return URL after payment. Currently it will only return to /dashboard/owner/payments/vnpay-return',
    example: 'https://example.com/payment/return',
    required: false,
  })
  @IsOptional()
  @IsUrl(
    { require_tld: false },
    { message: i18nValidationMessage('validation.isUrl') },
  )
  returnUrl?: string;

  @ApiProperty({
    description: 'Customer IP address',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
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
