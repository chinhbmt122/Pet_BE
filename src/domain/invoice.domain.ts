import { InvoiceStatus } from '../entities/types/entity.types';

/**
 * Invoice Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates invoice payment state transitions with validation.
 * Supports both cash payments (direct) and online payments (async callback).
 *
 * @see epics.md → ADR-001, ADR-003 (Encapsulation)
 */
export class InvoiceDomainModel {
  private readonly _id: number | null;
  private _status: InvoiceStatus;
  private readonly _appointmentId: number;
  private readonly _invoiceNumber: string;
  private readonly _issueDate: Date;
  private readonly _subtotal: number;
  private _discount: number;
  private _tax: number;
  private readonly _totalAmount: number;
  private _notes: string | null;
  private _paidAt: Date | null;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  // ===== Private Constructor =====

  private constructor(data: {
    id: number | null;
    status: InvoiceStatus;
    appointmentId: number;
    invoiceNumber: string;
    issueDate: Date;
    subtotal: number;
    discount: number;
    tax: number;
    totalAmount: number;
    notes: string | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = data.id;
    this._status = data.status;
    this._appointmentId = data.appointmentId;
    this._invoiceNumber = data.invoiceNumber;
    this._issueDate = data.issueDate;
    this._subtotal = data.subtotal;
    this._discount = data.discount;
    this._tax = data.tax;
    this._totalAmount = data.totalAmount;
    this._notes = data.notes;
    this._paidAt = data.paidAt;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  // ===== Static Factory Methods =====

  /**
   * Creates a new invoice (for new billing)
   */
  static create(props: {
    appointmentId: number;
    invoiceNumber: string;
    subtotal: number;
    discount?: number;
    tax?: number;
    totalAmount: number;
    notes?: string;
  }): InvoiceDomainModel {
    return new InvoiceDomainModel({
      id: null,
      status: InvoiceStatus.PENDING,
      appointmentId: props.appointmentId,
      invoiceNumber: props.invoiceNumber,
      issueDate: new Date(),
      subtotal: props.subtotal,
      discount: props.discount ?? 0,
      tax: props.tax ?? 0,
      totalAmount: props.totalAmount,
      notes: props.notes ?? null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitutes from persistence (used by mapper)
   */
  static reconstitute(props: {
    id: number;
    status: InvoiceStatus;
    appointmentId: number;
    invoiceNumber: string;
    issueDate: Date;
    subtotal: number;
    discount: number;
    tax: number;
    totalAmount: number;
    notes: string | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): InvoiceDomainModel {
    return new InvoiceDomainModel(props);
  }

  // ===== Getters =====

  get id(): number | null {
    return this._id;
  }
  get status(): InvoiceStatus {
    return this._status;
  }
  get appointmentId(): number {
    return this._appointmentId;
  }
  get invoiceNumber(): string {
    return this._invoiceNumber;
  }
  get issueDate(): Date {
    return this._issueDate;
  }
  get subtotal(): number {
    return this._subtotal;
  }
  get discount(): number {
    return this._discount;
  }
  get tax(): number {
    return this._tax;
  }
  get totalAmount(): number {
    return this._totalAmount;
  }
  get notes(): string | null {
    return this._notes;
  }
  get paidAt(): Date | null {
    return this._paidAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== Cash Payment (Direct) =====

  /**
   * Pay invoice with cash at counter.
   * Transition: PENDING → PAID
   * @throws Error if invoice is not in PENDING status
   */
  payByCash(): void {
    if (!this.canPayByCash()) {
      throw new Error(
        `Cannot pay by cash: current status is ${this._status}, expected PENDING`,
      );
    }
    this._status = InvoiceStatus.PAID;
    this._paidAt = new Date();
  }

  // ===== Online Payment Flow =====

  /**
   * Start online payment process (VNPay).
   * Transition: PENDING → PROCESSING_ONLINE
   * @throws Error if invoice is not in PENDING status
   */
  startOnlinePayment(): void {
    if (!this.canStartOnlinePayment()) {
      throw new Error(
        `Cannot start online payment: current status is ${this._status}, expected PENDING`,
      );
    }
    this._status = InvoiceStatus.PROCESSING_ONLINE;
  }

  /**
   * Mark invoice as paid (after VNPay callback success).
   * Transition: PROCESSING_ONLINE → PAID
   * @throws Error if invoice is not in PROCESSING_ONLINE status
   */
  markPaid(): void {
    if (!this.canMarkPaid()) {
      throw new Error(
        `Cannot mark as paid: current status is ${this._status}, expected PROCESSING_ONLINE`,
      );
    }
    this._status = InvoiceStatus.PAID;
    this._paidAt = new Date();
  }

  /**
   * Mark invoice as failed (after VNPay callback failure).
   * Transition: PROCESSING_ONLINE → FAILED
   * @throws Error if invoice is not in PROCESSING_ONLINE status
   */
  markFailed(): void {
    if (!this.canMarkFailed()) {
      throw new Error(
        `Cannot mark as failed: current status is ${this._status}, expected PROCESSING_ONLINE`,
      );
    }
    this._status = InvoiceStatus.FAILED;
  }

  // ===== Update Methods =====

  /**
   * Update invoice notes
   */
  updateNotes(notes: string | null): void {
    if (this._status === InvoiceStatus.PAID) {
      throw new Error('Cannot update notes for paid invoice');
    }
    this._notes = notes;
  }

  /**
   * Apply discount to invoice
   */
  applyDiscount(discount: number): void {
    if (this._status !== InvoiceStatus.PENDING) {
      throw new Error('Can only apply discount to pending invoices');
    }
    if (discount < 0) {
      throw new Error('Discount cannot be negative');
    }
    this._discount = discount;
  }

  // ===== Guard Methods =====

  canPayByCash(): boolean {
    return this._status === InvoiceStatus.PENDING;
  }

  canStartOnlinePayment(): boolean {
    return this._status === InvoiceStatus.PENDING;
  }

  canMarkPaid(): boolean {
    return this._status === InvoiceStatus.PROCESSING_ONLINE;
  }

  canMarkFailed(): boolean {
    return this._status === InvoiceStatus.PROCESSING_ONLINE;
  }

  isPaid(): boolean {
    return this._status === InvoiceStatus.PAID;
  }

  isFailed(): boolean {
    return this._status === InvoiceStatus.FAILED;
  }
}
