import { PaymentMethod, PaymentStatus } from '../entities/types/entity.types';

/**
 * Payment Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates payment state transitions with validation.
 * Supports cash payments (direct) and online payments (VNPay, etc.).
 *
 * @see epics.md → ADR-001, ADR-003 (Encapsulation)
 */
export class PaymentDomainModel {
  private readonly _id: number | null;
  private readonly _invoiceId: number;
  private readonly _paymentMethod: PaymentMethod;
  private readonly _amount: number;
  private _transactionId: string | null;
  private _idempotencyKey: string | null;
  private _paymentStatus: PaymentStatus;
  private _paidAt: Date | null;
  private _receivedBy: number | null;
  private _gatewayResponse: object | null;
  private _refundAmount: number;
  private _refundDate: Date | null;
  private _refundReason: string | null;
  private _notes: string | null;
  private readonly _createdAt: Date;

  // ===== Private Constructor =====

  private constructor(data: {
    id: number | null;
    invoiceId: number;
    paymentMethod: PaymentMethod;
    amount: number;
    transactionId: string | null;
    idempotencyKey: string | null;
    paymentStatus: PaymentStatus;
    paidAt: Date | null;
    receivedBy: number | null;
    gatewayResponse: object | null;
    refundAmount: number;
    refundDate: Date | null;
    refundReason: string | null;
    notes: string | null;
    createdAt: Date;
  }) {
    this._id = data.id;
    this._invoiceId = data.invoiceId;
    this._paymentMethod = data.paymentMethod;
    this._amount = data.amount;
    this._transactionId = data.transactionId;
    this._idempotencyKey = data.idempotencyKey;
    this._paymentStatus = data.paymentStatus;
    this._paidAt = data.paidAt;
    this._receivedBy = data.receivedBy;
    this._gatewayResponse = data.gatewayResponse;
    this._refundAmount = data.refundAmount;
    this._refundDate = data.refundDate;
    this._refundReason = data.refundReason;
    this._notes = data.notes;
    this._createdAt = data.createdAt;
  }

  // ===== Static Factory Methods =====

  /**
   * Creates a new cash payment
   */
  static createCashPayment(props: {
    invoiceId: number;
    amount: number;
    receivedBy: number;
    notes?: string;
  }): PaymentDomainModel {
    return new PaymentDomainModel({
      id: null,
      invoiceId: props.invoiceId,
      paymentMethod: PaymentMethod.CASH,
      amount: props.amount,
      transactionId: null,
      idempotencyKey: null,
      paymentStatus: PaymentStatus.PENDING,
      paidAt: null,
      receivedBy: props.receivedBy,
      gatewayResponse: null,
      refundAmount: 0,
      refundDate: null,
      refundReason: null,
      notes: props.notes ?? null,
      createdAt: new Date(),
    });
  }

  /**
   * Creates a new online payment (VNPay, etc.)
   */
  static createOnlinePayment(props: {
    invoiceId: number;
    amount: number;
    paymentMethod: PaymentMethod;
    idempotencyKey: string;
    notes?: string;
  }): PaymentDomainModel {
    return new PaymentDomainModel({
      id: null,
      invoiceId: props.invoiceId,
      paymentMethod: props.paymentMethod,
      amount: props.amount,
      transactionId: null,
      idempotencyKey: props.idempotencyKey,
      paymentStatus: PaymentStatus.PENDING,
      paidAt: null,
      receivedBy: null,
      gatewayResponse: null,
      refundAmount: 0,
      refundDate: null,
      refundReason: null,
      notes: props.notes ?? null,
      createdAt: new Date(),
    });
  }

  /**
   * Reconstitutes from persistence (used by mapper)
   */
  static reconstitute(props: {
    id: number;
    invoiceId: number;
    paymentMethod: PaymentMethod;
    amount: number;
    transactionId: string | null;
    idempotencyKey: string | null;
    paymentStatus: PaymentStatus;
    paidAt: Date | null;
    receivedBy: number | null;
    gatewayResponse: object | null;
    refundAmount: number;
    refundDate: Date | null;
    refundReason: string | null;
    notes: string | null;
    createdAt: Date;
  }): PaymentDomainModel {
    return new PaymentDomainModel(props);
  }

  // ===== Getters =====

  get id(): number | null {
    return this._id;
  }
  get invoiceId(): number {
    return this._invoiceId;
  }
  get paymentMethod(): PaymentMethod {
    return this._paymentMethod;
  }
  get amount(): number {
    return this._amount;
  }
  get transactionId(): string | null {
    return this._transactionId;
  }
  get idempotencyKey(): string | null {
    return this._idempotencyKey;
  }
  get paymentStatus(): PaymentStatus {
    return this._paymentStatus;
  }
  get paidAt(): Date | null {
    return this._paidAt;
  }
  get receivedBy(): number | null {
    return this._receivedBy;
  }
  get gatewayResponse(): object | null {
    return this._gatewayResponse;
  }
  get refundAmount(): number {
    return this._refundAmount;
  }
  get refundDate(): Date | null {
    return this._refundDate;
  }
  get refundReason(): string | null {
    return this._refundReason;
  }
  get notes(): string | null {
    return this._notes;
  }
  get createdAt(): Date {
    return this._createdAt;
  }

  // ===== Cash Payment (Direct) =====

  /**
   * Process cash payment immediately.
   * Transition: PENDING → SUCCESS
   * @throws Error if payment is not in PENDING status
   */
  processCash(): void {
    if (!this.canProcessCash()) {
      throw new Error(
        `Cannot process cash: current status is ${this._paymentStatus}, expected PENDING`,
      );
    }
    if (this._paymentMethod !== PaymentMethod.CASH) {
      throw new Error('Cannot process as cash: payment method is not CASH');
    }
    this._paymentStatus = PaymentStatus.SUCCESS;
    this._paidAt = new Date();
  }

  // ===== Online Payment Flow =====

  /**
   * Start online payment process.
   * Transition: PENDING → PROCESSING
   * @throws Error if payment is not in PENDING status
   */
  startOnlinePayment(): void {
    if (!this.canStartOnlinePayment()) {
      throw new Error(
        `Cannot start online payment: current status is ${this._paymentStatus}, expected PENDING`,
      );
    }
    this._paymentStatus = PaymentStatus.PROCESSING;
  }

  /**
   * Mark payment as successful (after gateway callback).
   * Transition: PROCESSING → SUCCESS
   * @param transactionId - Gateway transaction ID
   * @param gatewayResponse - Full gateway response for audit
   */
  markSuccess(transactionId: string, gatewayResponse: object): void {
    if (!this.canMarkSuccess()) {
      throw new Error(
        `Cannot mark as success: current status is ${this._paymentStatus}, expected PROCESSING`,
      );
    }
    this._paymentStatus = PaymentStatus.SUCCESS;
    this._transactionId = transactionId;
    this._gatewayResponse = gatewayResponse;
    this._paidAt = new Date();
  }

  /**
   * Mark payment as failed (after gateway callback).
   * Transition: PROCESSING → FAILED
   * @param gatewayResponse - Full gateway response for audit
   */
  markFailed(gatewayResponse: object): void {
    if (!this.canMarkFailed()) {
      throw new Error(
        `Cannot mark as failed: current status is ${this._paymentStatus}, expected PROCESSING`,
      );
    }
    this._paymentStatus = PaymentStatus.FAILED;
    this._gatewayResponse = gatewayResponse;
  }

  // ===== Refund =====

  /**
   * Process refund.
   * Transition: SUCCESS → REFUNDED
   * @param amount - Refund amount
   * @param reason - Refund reason
   */
  refund(amount: number, reason: string): void {
    if (!this.canRefund()) {
      throw new Error(
        `Cannot refund: current status is ${this._paymentStatus}, expected SUCCESS`,
      );
    }
    if (amount <= 0) {
      throw new Error('Refund amount must be positive');
    }
    if (amount > this._amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }
    this._paymentStatus = PaymentStatus.REFUNDED;
    this._refundAmount = amount;
    this._refundDate = new Date();
    this._refundReason = reason;
  }

  // ===== Update Methods =====

  /**
   * Update payment notes
   */
  updateNotes(notes: string | null): void {
    this._notes = notes;
  }

  // ===== Guard Methods =====

  canProcessCash(): boolean {
    return (
      this._paymentStatus === PaymentStatus.PENDING &&
      this._paymentMethod === PaymentMethod.CASH
    );
  }

  canStartOnlinePayment(): boolean {
    return (
      this._paymentStatus === PaymentStatus.PENDING &&
      this._paymentMethod !== PaymentMethod.CASH
    );
  }

  canMarkSuccess(): boolean {
    return this._paymentStatus === PaymentStatus.PROCESSING;
  }

  canMarkFailed(): boolean {
    return this._paymentStatus === PaymentStatus.PROCESSING;
  }

  canRefund(): boolean {
    return this._paymentStatus === PaymentStatus.SUCCESS;
  }

  isSuccess(): boolean {
    return this._paymentStatus === PaymentStatus.SUCCESS;
  }

  isFailed(): boolean {
    return this._paymentStatus === PaymentStatus.FAILED;
  }

  isRefunded(): boolean {
    return this._paymentStatus === PaymentStatus.REFUNDED;
  }
}
