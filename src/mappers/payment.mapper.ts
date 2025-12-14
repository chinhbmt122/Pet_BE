import { Payment } from '../entities/payment.entity';
import { PaymentDomainModel } from '../domain/payment.domain';

/**
 * Payment Mapper (Data Mapper Pattern)
 *
 * Converts between Payment persistence entity and PaymentDomainModel.
 * Part of Full DDD implementation per ADR-002.
 */
export class PaymentMapper {
  /**
   * Convert persistence entity to domain model
   */
  static toDomain(entity: Payment): PaymentDomainModel {
    return PaymentDomainModel.reconstitute({
      id: entity.paymentId,
      invoiceId: entity.invoiceId,
      paymentMethod: entity.paymentMethod,
      amount: Number(entity.amount),
      transactionId: entity.transactionId,
      idempotencyKey: entity.idempotencyKey,
      paymentStatus: entity.paymentStatus,
      paidAt: entity.paidAt,
      receivedBy: entity.receivedBy,
      gatewayResponse: entity.gatewayResponse,
      refundAmount: Number(entity.refundAmount),
      refundDate: entity.refundDate,
      refundReason: entity.refundReason,
      notes: entity.notes,
      createdAt: entity.createdAt,
    });
  }

  /**
   * Convert domain model to persistence entity (for saving).
   * Returns partial entity - includes all fields for CREATE/UPDATE.
   */
  static toPersistence(domain: PaymentDomainModel): Partial<Payment> {
    const entity: Partial<Payment> = {
      // Immutable fields (needed for CREATE)
      invoiceId: domain.invoiceId,
      paymentMethod: domain.paymentMethod,
      amount: domain.amount,

      // Mutable fields
      transactionId: domain.transactionId ?? undefined,
      idempotencyKey: domain.idempotencyKey ?? undefined,
      paymentStatus: domain.paymentStatus,
      paidAt: domain.paidAt ?? undefined,
      receivedBy: domain.receivedBy ?? undefined,
      gatewayResponse: domain.gatewayResponse ?? undefined,
      refundAmount: domain.refundAmount,
      refundDate: domain.refundDate ?? undefined,
      refundReason: domain.refundReason ?? undefined,
      notes: domain.notes ?? undefined,
    };

    // Include ID if it exists (for updates)
    if (domain.id !== null) {
      entity.paymentId = domain.id;
    }

    return entity;
  }

  /**
   * Convert array of entities to domain models
   */
  static toDomainList(entities: Payment[]): PaymentDomainModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
