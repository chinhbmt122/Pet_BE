import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumberString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * VNPay Callback DTO
 *
 * Validates VNPay payment callback query parameters.
 * VNPay sends these as query params in the return URL.
 */
export class VNPayCallbackDto {
  @ApiProperty({ description: 'VNPay transaction number', example: '14120551' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_TmnCode: string;

  @ApiProperty({
    description: 'Amount in smallest unit (VND * 100)',
    example: '10000000',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsNumberString({}, { message: i18nValidationMessage('validation.isNumber') })
  vnp_Amount: string;

  @ApiProperty({ description: 'Bank code', example: 'NCB', required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_BankCode?: string;

  @ApiProperty({
    description: 'Bank transaction number',
    example: 'VNP14120551',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_BankTranNo?: string;

  @ApiProperty({ description: 'Card type', example: 'ATM', required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_CardType?: string;

  @ApiProperty({
    description: 'Order info',
    example: 'Payment for invoice INV-001',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_OrderInfo: string;

  @ApiProperty({
    description: 'Payment date (yyyyMMddHHmmss)',
    example: '20241218103000',
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_PayDate: string;

  @ApiProperty({ description: 'Response code (00 = success)', example: '00' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_ResponseCode: string;

  @ApiProperty({ description: 'Transaction number', example: '14120551' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_TransactionNo: string;

  @ApiProperty({ description: 'Transaction status', example: '00' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_TransactionStatus: string;

  @ApiProperty({ description: 'Order ID (invoice ID)', example: '1' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_TxnRef: string;

  @ApiProperty({ description: 'Secure hash signature', example: 'abc123...' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_SecureHash: string;

  // Additional optional fields
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_SecureHashType?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  vnp_PaymentType?: string;
}
