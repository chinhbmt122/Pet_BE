import { ApiProperty } from '@nestjs/swagger';
import {
  PaymentMethod,
  PaymentStatus,
} from '../../entities/types/entity.types';
import { PaymentDomainModel } from '../../domain/payment.domain';

/**
 * Payment Response DTO
 *
 * Returned from payment endpoints.
 * Includes factory method for conversion from domain model.
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
    description: 'Idempotency key',
    example: 'unique-key-123',
    nullable: true,
  })
  idempotencyKey: string | null;

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

  @ApiProperty({
    description: 'Gateway response data',
    example: {},
    nullable: true,
  })
  gatewayResponse: object | null;

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
   * Factory method to convert domain model to DTO
   */
  static fromDomain(domain: PaymentDomainModel): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.paymentId = domain.id ?? 0;
    dto.invoiceId = domain.invoiceId;
    dto.paymentMethod = domain.paymentMethod;
    dto.amount = domain.amount;
    dto.transactionId = domain.transactionId;
    dto.idempotencyKey = domain.idempotencyKey;
    dto.paymentStatus = domain.paymentStatus;
    dto.paidAt = domain.paidAt;
    dto.receivedBy = domain.receivedBy;
    dto.gatewayResponse = domain.gatewayResponse;
    dto.refundAmount = domain.refundAmount;
    dto.refundDate = domain.refundDate;
    dto.refundReason = domain.refundReason;
    dto.notes = domain.notes;
    dto.createdAt = domain.createdAt;
    return dto;
  }
}
