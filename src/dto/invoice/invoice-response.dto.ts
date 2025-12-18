import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../../entities/types/entity.types';
import { Invoice } from '../../entities/invoice.entity';

/**
 * Invoice Response DTO
 *
 * Returned from invoice endpoints.
 * Includes factory method for conversion from entity.
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
   * Factory method to convert entity to DTO
   */
  static fromEntity(entity: Invoice): InvoiceResponseDto {
    const dto = new InvoiceResponseDto();
    dto.invoiceId = entity.invoiceId;
    dto.status = entity.status;
    dto.appointmentId = entity.appointmentId;
    dto.invoiceNumber = entity.invoiceNumber;
    dto.issueDate = entity.issueDate;
    dto.subtotal = Number(entity.subtotal);
    dto.discount = Number(entity.discount);
    dto.tax = Number(entity.tax);
    dto.totalAmount = Number(entity.totalAmount);
    dto.notes = entity.notes;
    dto.paidAt = entity.paidAt;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  /**
   * Factory method to convert entity list to DTO list
   */
  static fromEntityList(entities: Invoice[]): InvoiceResponseDto[] {
    return entities.map((entity) => InvoiceResponseDto.fromEntity(entity));
  }
}
