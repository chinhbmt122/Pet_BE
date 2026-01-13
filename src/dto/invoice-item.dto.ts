import { InvoiceItem } from '../entities/invoice-item.entity';

/**
 * DTO for InvoiceItem response
 */
export class InvoiceItemDto {
  itemId: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  itemType?: string;
  serviceId?: number;

  static fromEntity(entity: InvoiceItem): InvoiceItemDto {
    const dto = new InvoiceItemDto();
    dto.itemId = entity.itemId;
    dto.invoiceId = entity.invoiceId;
    dto.description = entity.description;
    dto.quantity = entity.quantity;
    dto.unitPrice = Number(entity.unitPrice);
    dto.amount = Number(entity.amount);
    dto.itemType = entity.itemType;
    dto.serviceId = entity.serviceId;
    return dto;
  }

  static fromEntityList(entities: InvoiceItem[]): InvoiceItemDto[] {
    return entities.map((entity) => InvoiceItemDto.fromEntity(entity));
  }
}

/**
 * DTO for creating InvoiceItem
 */
export class CreateInvoiceItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  itemType?: string;
  serviceId?: number;
}
