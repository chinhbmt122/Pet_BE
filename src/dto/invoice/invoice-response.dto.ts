import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceDomainModel } from '../../domain/invoice.domain';

export class InvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: number;

  @ApiProperty({ description: 'Appointment ID' })
  appointmentId: number;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Issue date' })
  issueDate: Date;

  @ApiProperty({ description: 'Subtotal amount' })
  subtotal: number;

  @ApiProperty({ description: 'Discount amount' })
  discount: number;

  @ApiProperty({ description: 'Tax amount' })
  tax: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Invoice status' })
  status: string;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'Payment date', nullable: true })
  paidAt: Date | null;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Is overdue (computed)' })
  isOverdue: boolean;

  @ApiProperty({ description: 'Days since issued (computed)' })
  daysSinceIssued: number;

  static fromDomain(domain: InvoiceDomainModel): InvoiceResponseDto {
    const dto = new InvoiceResponseDto();
    dto.id = domain.id!;
    dto.appointmentId = domain.appointmentId;
    dto.invoiceNumber = domain.invoiceNumber;
    dto.issueDate = domain.issueDate;
    dto.subtotal = domain.subtotal;
    dto.discount = domain.discount;
    dto.tax = domain.tax;
    dto.totalAmount = domain.totalAmount;
    dto.status = domain.status;
    dto.notes = domain.notes;
    dto.paidAt = domain.paidAt;
    dto.createdAt = domain.createdAt;
    dto.isOverdue = domain.isOverdue();
    dto.daysSinceIssued = domain.daysSinceIssued();
    return dto;
  }

  static fromDomainList(domains: InvoiceDomainModel[]): InvoiceResponseDto[] {
    return domains.map((d) => InvoiceResponseDto.fromDomain(d));
  }
}
