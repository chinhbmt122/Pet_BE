import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../../entities/types/entity.types';
import { InvoiceDomainModel } from '../../domain/invoice.domain';

/**
 * Invoice Response DTO
 *
 * Returned from invoice endpoints.
 * Includes factory method for conversion from domain model.
 */
export class InvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID', example: 1 })
  invoiceId: number;

  @ApiProperty({
    description: 'Invoice status',
    enum: InvoiceStatus,
    example: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Appointment ID', example: 1 })
  appointmentId: number;

  @ApiProperty({
    description: 'Unique invoice number',
    example: 'INV-20241218-00001',
  })
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice issue date', example: '2024-12-18' })
  issueDate: Date;

  @ApiProperty({ description: 'Subtotal amount', example: 500000 })
  subtotal: number;

  @ApiProperty({ description: 'Discount amount', example: 50000 })
  discount: number;

  @ApiProperty({ description: 'Tax amount', example: 45000 })
  tax: number;

  @ApiProperty({ description: 'Total amount', example: 495000 })
  totalAmount: number;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Service completed',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Payment date',
    example: '2024-12-18T10:30:00Z',
    nullable: true,
  })
  paidAt: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-12-18T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-12-18T10:30:00Z',
  })
  updatedAt: Date;

  /**
   * Factory method to convert domain model to DTO
   */
  static fromDomain(domain: InvoiceDomainModel): InvoiceResponseDto {
    const dto = new InvoiceResponseDto();
    dto.invoiceId = domain.id ?? 0;
    dto.status = domain.status;
    dto.appointmentId = domain.appointmentId;
    dto.invoiceNumber = domain.invoiceNumber;
    dto.issueDate = domain.issueDate;
    dto.subtotal = domain.subtotal;
    dto.discount = domain.discount;
    dto.tax = domain.tax;
    dto.totalAmount = domain.totalAmount;
    dto.notes = domain.notes;
    dto.paidAt = domain.paidAt;
    dto.createdAt = domain.createdAt;
    dto.updatedAt = domain.updatedAt;
    return dto;
  }
}
