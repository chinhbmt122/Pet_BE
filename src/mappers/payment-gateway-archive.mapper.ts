import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';
import { PaymentGatewayArchiveDomainModel } from '../domain/payment-gateway-archive.domain';

/**
 * PaymentGatewayArchive Mapper (Data Mapper Pattern)
 */
export class PaymentGatewayArchiveMapper {
    static toDomain(entity: PaymentGatewayArchive): PaymentGatewayArchiveDomainModel {
        return PaymentGatewayArchiveDomainModel.reconstitute({
            id: entity.archiveId,
            paymentId: entity.paymentId,
            gatewayName: entity.gatewayName,
            gatewayResponse: entity.gatewayResponse,
            transactionTimestamp: entity.transactionTimestamp,
            archivedAt: entity.archivedAt,
        });
    }

    static toPersistence(domain: PaymentGatewayArchiveDomainModel): Partial<PaymentGatewayArchive> {
        const entity: Partial<PaymentGatewayArchive> = {
            paymentId: domain.paymentId,
            gatewayName: domain.gatewayName,
            gatewayResponse: domain.gatewayResponse,
            transactionTimestamp: domain.transactionTimestamp,
        };

        if (domain.id !== null) {
            entity.archiveId = domain.id;
        }

        return entity;
    }

    static toDomainList(entities: PaymentGatewayArchive[]): PaymentGatewayArchiveDomainModel[] {
        return entities.map((entity) => this.toDomain(entity));
    }
}
