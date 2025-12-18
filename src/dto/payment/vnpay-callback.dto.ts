import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumberString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * VNPay Callback DTO
 *
 * Validates VNPay payment callback query parameters.
 * VNPay sends these as query params in the return URL.
 */
export class VNPayCallbackDto {
  @ApiProperty({ description: 'VNPay transaction number', example: '14120551' })
  @IsNotEmpty({ message: 'vnp_TmnCode is required' })
  @IsString()
  vnp_TmnCode: string;

  @ApiProperty({
    description: 'Amount in smallest unit (VND * 100)',
    example: '10000000',
  })
  @IsNotEmpty({ message: 'vnp_Amount is required' })
  @IsNumberString({}, { message: 'vnp_Amount must be a number string' })
  vnp_Amount: string;

  @ApiProperty({ description: 'Bank code', example: 'NCB', required: false })
  @IsOptional()
  @IsString()
  vnp_BankCode?: string;

  @ApiProperty({
    description: 'Bank transaction number',
    example: 'VNP14120551',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_BankTranNo?: string;

  @ApiProperty({ description: 'Card type', example: 'ATM', required: false })
  @IsOptional()
  @IsString()
  vnp_CardType?: string;

  @ApiProperty({
    description: 'Order info',
    example: 'Payment for invoice INV-001',
  })
  @IsNotEmpty({ message: 'vnp_OrderInfo is required' })
  @IsString()
  vnp_OrderInfo: string;

  @ApiProperty({
    description: 'Payment date (yyyyMMddHHmmss)',
    example: '20241218103000',
  })
  @IsNotEmpty({ message: 'vnp_PayDate is required' })
  @IsString()
  vnp_PayDate: string;

  @ApiProperty({ description: 'Response code (00 = success)', example: '00' })
  @IsNotEmpty({ message: 'vnp_ResponseCode is required' })
  @IsString()
  vnp_ResponseCode: string;

  @ApiProperty({ description: 'Transaction number', example: '14120551' })
  @IsNotEmpty({ message: 'vnp_TransactionNo is required' })
  @IsString()
  vnp_TransactionNo: string;

  @ApiProperty({ description: 'Transaction status', example: '00' })
  @IsNotEmpty({ message: 'vnp_TransactionStatus is required' })
  @IsString()
  vnp_TransactionStatus: string;

  @ApiProperty({ description: 'Order ID (invoice ID)', example: '1' })
  @IsNotEmpty({ message: 'vnp_TxnRef is required' })
  @IsString()
  vnp_TxnRef: string;

  @ApiProperty({ description: 'Secure hash signature', example: 'abc123...' })
  @IsNotEmpty({ message: 'vnp_SecureHash is required' })
  @IsString()
  vnp_SecureHash: string;

  // Additional optional fields
  @IsOptional()
  @IsString()
  vnp_SecureHashType?: string;

  @IsOptional()
  @IsString()
  vnp_PaymentType?: string;
}
