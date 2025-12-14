/**
 * PaymentGatewayArchive Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates archived payment gateway responses.
 * All fields are immutable - archives are append-only.
 */
export class PaymentGatewayArchiveDomainModel {
    private readonly _id: number | null;
    private readonly _paymentId: number;
    private readonly _gatewayName: string;
    private readonly _gatewayResponse: object;
    private readonly _transactionTimestamp: Date;
    private readonly _archivedAt: Date;

    // ===== Private Constructor =====

    private constructor(data: {
        id: number | null;
        paymentId: number;
        gatewayName: string;
        gatewayResponse: object;
        transactionTimestamp: Date;
        archivedAt: Date;
    }) {
        this._id = data.id;
        this._paymentId = data.paymentId;
        this._gatewayName = data.gatewayName;
        this._gatewayResponse = data.gatewayResponse;
        this._transactionTimestamp = data.transactionTimestamp;
        this._archivedAt = data.archivedAt;
    }

    // ===== Static Factory Methods =====

    /**
     * Create a new archive entry
     */
    static create(props: {
        paymentId: number;
        gatewayName: string;
        gatewayResponse: object;
        transactionTimestamp: Date;
    }): PaymentGatewayArchiveDomainModel {
        return new PaymentGatewayArchiveDomainModel({
            id: null,
            paymentId: props.paymentId,
            gatewayName: props.gatewayName,
            gatewayResponse: props.gatewayResponse,
            transactionTimestamp: props.transactionTimestamp,
            archivedAt: new Date(),
        });
    }

    /**
     * Convenience factory for VNPay responses
     */
    static archiveVNPayResponse(
        paymentId: number,
        response: object,
        transactionTimestamp?: Date,
    ): PaymentGatewayArchiveDomainModel {
        return PaymentGatewayArchiveDomainModel.create({
            paymentId,
            gatewayName: 'VNPAY',
            gatewayResponse: response,
            transactionTimestamp: transactionTimestamp ?? new Date(),
        });
    }

    static reconstitute(props: {
        id: number;
        paymentId: number;
        gatewayName: string;
        gatewayResponse: object;
        transactionTimestamp: Date;
        archivedAt: Date;
    }): PaymentGatewayArchiveDomainModel {
        return new PaymentGatewayArchiveDomainModel(props);
    }

    // ===== Getters (All readonly - archives are immutable) =====

    get id(): number | null {
        return this._id;
    }
    get paymentId(): number {
        return this._paymentId;
    }
    get gatewayName(): string {
        return this._gatewayName;
    }
    get gatewayResponse(): object {
        return this._gatewayResponse;
    }
    get transactionTimestamp(): Date {
        return this._transactionTimestamp;
    }
    get archivedAt(): Date {
        return this._archivedAt;
    }

    // ===== Query Helper Methods =====

    /**
     * Check if this archive is for a specific payment
     */
    isForPayment(paymentId: number): boolean {
        return this._paymentId === paymentId;
    }

    /**
     * Check if this is a VNPay response
     */
    isVNPay(): boolean {
        return this._gatewayName === 'VNPAY';
    }

    /**
     * Extract response code from gateway response (VNPay specific)
     */
    getVNPayResponseCode(): string | null {
        const response = this._gatewayResponse as Record<string, unknown>;
        return (response?.vnp_ResponseCode as string) ?? null;
    }

    /**
     * Check if the gateway response indicates success
     */
    isSuccessResponse(): boolean {
        const code = this.getVNPayResponseCode();
        return code === '00'; // VNPay success code
    }
}
