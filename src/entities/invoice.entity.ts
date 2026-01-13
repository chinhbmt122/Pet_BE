import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Payment } from './payment.entity';
import { InvoiceItem } from './invoice-item.entity';
import { InvoiceStatus } from './types/entity.types';

export { InvoiceStatus };

/**
 * Invoice Entity
 *
 * Represents financial invoices for appointments.
 * Tracks invoice status: PENDING, PROCESSING_ONLINE, PAID, FAILED.
 */
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('increment')
  invoiceId: number;

  @Column()
  appointmentId: number;

  @OneToOne(() => Appointment, (appointment) => appointment.invoice, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column({ length: 50, unique: true })
  invoiceNumber: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  /**
   * One-to-Many relationship with Payment
   * An invoice can have multiple payment transactions
   */
  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments?: Payment[];

  /**
   * One-to-Many relationship with InvoiceItem
   * An invoice can have multiple line items
   */
  @OneToMany(() => InvoiceItem, (item) => item.invoice, {
    cascade: true,
  })
  items?: InvoiceItem[];

  // ===== Business Logic Methods =====

  /**
   * Pay invoice with cash at counter.
   * Transition: PENDING → PAID
   * @throws Error if invoice is not in PENDING status
   */
  payByCash(): void {
    if (!this.canPayByCash()) {
      throw new Error(
        `Cannot pay by cash: current status is ${this.status}, expected PENDING`,
      );
    }
    this.status = InvoiceStatus.PAID;
    this.paidAt = new Date();
  }

  /**
   * Start online payment process (VNPay).
   * Transition: PENDING → PROCESSING_ONLINE
   * @throws Error if invoice is not in PENDING status
   */
  startOnlinePayment(): void {
    if (!this.canStartOnlinePayment()) {
      throw new Error(
        `Cannot start online payment: current status is ${this.status}, expected PENDING`,
      );
    }
    this.status = InvoiceStatus.PROCESSING_ONLINE;
  }

  /**
   * Mark invoice as paid (after VNPay callback success).
   * Transition: PROCESSING_ONLINE → PAID
   * @throws Error if invoice is not in PROCESSING_ONLINE status
   */
  markPaid(): void {
    if (!this.canMarkPaid()) {
      throw new Error(
        `Cannot mark as paid: current status is ${this.status}, expected PROCESSING_ONLINE`,
      );
    }
    this.status = InvoiceStatus.PAID;
    this.paidAt = new Date();
  }

  /**
   * Mark invoice as failed (after VNPay callback failure).
   * Transition: PROCESSING_ONLINE → FAILED
   * @throws Error if invoice is not in PROCESSING_ONLINE status
   */
  markFailed(): void {
    if (!this.canMarkFailed()) {
      throw new Error(
        `Cannot mark as failed: current status is ${this.status}, expected PROCESSING_ONLINE`,
      );
    }
    this.status = InvoiceStatus.FAILED;
  }

  /**
   * Update invoice notes
   */
  updateNotes(notes: string | null): void {
    if (this.status === InvoiceStatus.PAID) {
      throw new Error('Cannot update notes for paid invoice');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.notes = notes as any;
  }

  /**
   * Apply discount to invoice
   */
  applyDiscount(discount: number): void {
    if (this.status !== InvoiceStatus.PENDING) {
      throw new Error('Can only apply discount to pending invoices');
    }
    if (discount < 0) {
      throw new Error('Discount cannot be negative');
    }
    this.discount = discount;
    this.recalculateTotalAmount();
  }

  /**
   * Update tax amount
   */
  updateTax(tax: number): void {
    if (this.status !== InvoiceStatus.PENDING) {
      throw new Error('Can only update tax for pending invoices');
    }
    if (tax < 0) {
      throw new Error('Tax cannot be negative');
    }
    this.tax = tax;
    this.recalculateTotalAmount();
  }

  /**
   * Mark invoice as processing (transitioning to online payment)
   * This is an alias for startOnlinePayment for backward compatibility
   */
  markAsProcessing(): void {
    this.startOnlinePayment();
  }

  /**
   * Mark invoice as paid with optional paid date
   * Can be used directly for cash payments or after online payment success
   */
  markAsPaid(paidAt?: Date): void {
    // Allow marking as paid from PENDING (cash) or PROCESSING_ONLINE (callback)
    if (this.status === InvoiceStatus.PENDING) {
      this.payByCash();
    } else if (this.status === InvoiceStatus.PROCESSING_ONLINE) {
      this.markPaid();
    } else {
      throw new Error(`Cannot mark as paid: current status is ${this.status}`);
    }

    if (paidAt) {
      this.paidAt = paidAt;
    }
  }

  /**
   * Check if invoice is overdue (unpaid after 30 days)
   */
  isOverdue(): boolean {
    if (this.status === InvoiceStatus.PAID) {
      return false;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return new Date(this.issueDate) < thirtyDaysAgo;
  }

  /**
   * Recalculate total amount based on subtotal, discount, and tax
   * Private helper method
   */
  private recalculateTotalAmount(): void {
    this.totalAmount = this.subtotal - this.discount + this.tax;
  }

  // ===== Guard Methods =====

  canPayByCash(): boolean {
    return this.status === InvoiceStatus.PENDING;
  }

  canStartOnlinePayment(): boolean {
    return this.status !== InvoiceStatus.PAID;
  }

  canMarkPaid(): boolean {
    return this.status === InvoiceStatus.PROCESSING_ONLINE;
  }

  canMarkFailed(): boolean {
    return this.status === InvoiceStatus.PROCESSING_ONLINE;
  }

  isPaid(): boolean {
    return this.status === InvoiceStatus.PAID;
  }

  isFailed(): boolean {
    return this.status === InvoiceStatus.FAILED;
  }
}
