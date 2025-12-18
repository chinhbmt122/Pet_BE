import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { Employee } from './employee.entity';
import { PaymentGatewayArchive } from './payment-gateway-archive.entity';
import { PaymentMethod, PaymentStatus } from './types/entity.types';

export { PaymentMethod, PaymentStatus };

/**
 * Payment Entity
 *
 * Records payment transactions.
 * JSONB gatewayResponse field for extensibility (Open/Closed Principle).
 * Supports multiple gateways: VNPay, future Momo/ZaloPay without schema changes.
 */
@Index('idx_payment_txn', ['transactionId'], { unique: true })
@Index('idx_payment_idem', ['idempotencyKey'], { unique: true })
@Index('idx_payment_paid_at', ['paidAt'])
@Index('idx_payment_status', ['paymentStatus'])
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('increment')
  paymentId: number;

  @Column()
  invoiceId: number;

  @ManyToOne(() => Invoice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  transactionId: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  idempotencyKey: string | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'int', nullable: true })
  receivedBy: number | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receivedBy' })
  receiver: Employee;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: object;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  refundDate: Date;

  @Column({ type: 'text', nullable: true })
  refundReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
  @CreateDateColumn()
  createdAt: Date;

  /**
   * One-to-Many relationship with PaymentGatewayArchive
   * A payment can have multiple gateway response archives
   */
  @OneToMany(() => PaymentGatewayArchive, (archive) => archive.payment)
  gatewayArchives?: PaymentGatewayArchive[];

  // ===== Static Factory Methods =====

  /**
   * Creates a new cash payment
   */
  static createCashPayment(props: {
    invoiceId: number;
    amount: number;
    receivedBy: number;
    notes?: string;
  }): Payment {
    const payment = new Payment();
    payment.invoiceId = props.invoiceId;
    payment.paymentMethod = PaymentMethod.CASH;
    payment.amount = props.amount;
    payment.transactionId = null;
    payment.idempotencyKey = null;
    payment.paymentStatus = PaymentStatus.PENDING;
    payment.paidAt = null;
    payment.receivedBy = props.receivedBy;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    payment.gatewayResponse = null as any;
    payment.refundAmount = 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    payment.refundDate = null as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    payment.refundReason = null as any;
    payment.notes = props.notes ?? null;
    return payment;
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
  }): Payment {
    const payment = new Payment();
    payment.invoiceId = props.invoiceId;
    payment.paymentMethod = props.paymentMethod;
    payment.amount = props.amount;
    payment.transactionId = null;
    payment.idempotencyKey = props.idempotencyKey;
    payment.paymentStatus = PaymentStatus.PENDING;
    payment.paidAt = null;
    payment.receivedBy = null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    payment.gatewayResponse = null as any;
    payment.refundAmount = 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    payment.refundDate = null as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    payment.refundReason = null as any;
    payment.notes = props.notes ?? null;
    return payment;
  }

  // ===== Business Logic Methods =====

  /**
   * Process cash payment immediately.
   * Transition: PENDING → SUCCESS
   * @throws Error if payment is not in PENDING status
   */
  processCash(): void {
    if (!this.canProcessCash()) {
      throw new Error(
        `Cannot process cash: current status is ${this.paymentStatus}, expected PENDING`,
      );
    }
    if (this.paymentMethod !== PaymentMethod.CASH) {
      throw new Error('Cannot process as cash: payment method is not CASH');
    }
    this.paymentStatus = PaymentStatus.SUCCESS;
    this.paidAt = new Date();
  }

  /**
   * Start online payment process.
   * Transition: PENDING → PROCESSING
   * @throws Error if payment is not in PENDING status
   */
  startOnlinePayment(): void {
    if (!this.canStartOnlinePayment()) {
      throw new Error(
        `Cannot start online payment: current status is ${this.paymentStatus}, expected PENDING`,
      );
    }
    this.paymentStatus = PaymentStatus.PROCESSING;
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
        `Cannot mark as success: current status is ${this.paymentStatus}, expected PROCESSING`,
      );
    }
    this.paymentStatus = PaymentStatus.SUCCESS;
    this.transactionId = transactionId;
    this.gatewayResponse = gatewayResponse;
    this.paidAt = new Date();
  }

  /**
   * Mark payment as failed (after gateway callback).
   * Transition: PROCESSING → FAILED
   * @param gatewayResponse - Full gateway response for audit
   */
  markFailed(gatewayResponse: object): void {
    if (!this.canMarkFailed()) {
      throw new Error(
        `Cannot mark as failed: current status is ${this.paymentStatus}, expected PROCESSING`,
      );
    }
    this.paymentStatus = PaymentStatus.FAILED;
    this.gatewayResponse = gatewayResponse;
  }

  /**
   * Process refund.
   * Transition: SUCCESS → REFUNDED
   * @param amount - Refund amount
   * @param reason - Refund reason
   */
  refund(amount: number, reason: string): void {
    if (!this.canRefund()) {
      throw new Error(
        `Cannot refund: current status is ${this.paymentStatus}, expected SUCCESS`,
      );
    }
    if (amount <= 0) {
      throw new Error('Refund amount must be positive');
    }
    if (amount > this.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }
    this.paymentStatus = PaymentStatus.REFUNDED;
    this.refundAmount = amount;
    this.refundDate = new Date();
    this.refundReason = reason;
  }

  /**
   * Update payment notes
   */
  updateNotes(notes: string | null): void {
    this.notes = notes;
  }

  // ===== Guard Methods =====

  canProcessCash(): boolean {
    return (
      this.paymentStatus === PaymentStatus.PENDING &&
      this.paymentMethod === PaymentMethod.CASH
    );
  }

  canStartOnlinePayment(): boolean {
    return (
      this.paymentStatus === PaymentStatus.PENDING &&
      this.paymentMethod !== PaymentMethod.CASH
    );
  }

  canMarkSuccess(): boolean {
    return this.paymentStatus === PaymentStatus.PROCESSING;
  }

  canMarkFailed(): boolean {
    return this.paymentStatus === PaymentStatus.PROCESSING;
  }

  canRefund(): boolean {
    return this.paymentStatus === PaymentStatus.SUCCESS;
  }

  isSuccess(): boolean {
    return this.paymentStatus === PaymentStatus.SUCCESS;
  }

  isFailed(): boolean {
    return this.paymentStatus === PaymentStatus.FAILED;
  }

  isRefunded(): boolean {
    return this.paymentStatus === PaymentStatus.REFUNDED;
  }
}
