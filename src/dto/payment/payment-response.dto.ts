import { ApiProperty } from '@nestjs/swagger';
import {
  PaymentMethod,
  PaymentStatus,
} from '../../entities/types/entity.types';
import { Payment } from '../../entities/payment.entity';

/**
 * Payment Response DTO
 *
 * Returned from payment endpoints.
 * Includes factory method for conversion from entity.
 */
export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID', example: 1 })
  paymentId: number;

  @ApiProperty({ description: 'Invoice ID', example: 1 })
  invoiceId: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment amount', example: 495000 })
  amount: number;

  @ApiProperty({
    description: 'Gateway transaction ID',
    example: '20241218123456',
    nullable: true,
  })
  transactionId: string | null;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.SUCCESS,
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: 'Payment completion date',
    example: '2024-12-18T10:30:00Z',
    nullable: true,
  })
  paidAt: Date | null;

  @ApiProperty({
    description: 'Employee ID who received payment',
    example: 5,
    nullable: true,
  })
  receivedBy: number | null;

  @ApiProperty({ description: 'Refund amount', example: 0 })
  refundAmount: number;

  @ApiProperty({
    description: 'Refund date',
    example: '2024-12-18T15:00:00Z',
    nullable: true,
  })
  refundDate: Date | null;

  @ApiProperty({
    description: 'Refund reason',
    example: 'Customer request',
    nullable: true,
  })
  refundReason: string | null;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Paid in full',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-12-18T10:00:00Z',
  })
  createdAt: Date;

  /**
   * Factory method to convert entity to DTO
   */
  static fromEntity(entity: Payment): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.paymentId = entity.paymentId;
    dto.invoiceId = entity.invoiceId;
    dto.paymentMethod = entity.paymentMethod;
    dto.amount = Number(entity.amount);
    dto.transactionId = entity.transactionId;
    // idempotencyKey and gatewayResponse excluded for security
    dto.paymentStatus = entity.paymentStatus;
    dto.paidAt = entity.paidAt;
    dto.receivedBy = entity.receivedBy;
    dto.refundAmount = Number(entity.refundAmount);
    dto.refundDate = entity.refundDate;
    dto.refundReason = entity.refundReason;
    dto.notes = entity.notes;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
