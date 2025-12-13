import { Invoice } from '../entities/invoice.entity';
import { InvoiceDomainModel } from '../domain/invoice.domain';

/**
 * Invoice Mapper (Data Mapper Pattern)
 *
 * Converts between Invoice persistence entity and InvoiceDomainModel.
 * Part of Full DDD implementation per ADR-002.
 */
export class InvoiceMapper {
    /**
     * Convert persistence entity to domain model
     */
    static toDomain(entity: Invoice): InvoiceDomainModel {
        return InvoiceDomainModel.reconstitute({
            id: entity.invoiceId,
            status: entity.status,
            appointmentId: entity.appointmentId,
            invoiceNumber: entity.invoiceNumber,
            issueDate: entity.issueDate,
            subtotal: Number(entity.subtotal),
            discount: Number(entity.discount),
            tax: Number(entity.tax),
            totalAmount: Number(entity.totalAmount),
            notes: entity.notes,
            paidAt: entity.paidAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        });
    }

    /**
     * Convert domain model to persistence entity (for saving).
     * Returns partial entity - includes all fields for CREATE, or just mutable fields for UPDATE.
     */
    static toPersistence(domain: InvoiceDomainModel): Partial<Invoice> {
        const entity: Partial<Invoice> = {
            // Immutable fields (needed for CREATE)
            appointmentId: domain.appointmentId,
            invoiceNumber: domain.invoiceNumber,
            issueDate: domain.issueDate,
            subtotal: domain.subtotal,
            totalAmount: domain.totalAmount,

            // Mutable fields (can change via domain methods)
            status: domain.status,
            discount: domain.discount,
            tax: domain.tax,
            notes: domain.notes ?? '',
            paidAt: domain.paidAt ?? undefined,
        };

        // Include ID if it exists (for updates)
        if (domain.id !== null) {
            entity.invoiceId = domain.id;
        }

        return entity;
    }

    /**
     * Convert array of entities to domain models
     */
    static toDomainList(entities: Invoice[]): InvoiceDomainModel[] {
        return entities.map((entity) => this.toDomain(entity));
    }
}
