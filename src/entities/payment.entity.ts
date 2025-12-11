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
}
