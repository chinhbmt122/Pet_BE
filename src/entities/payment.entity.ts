import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

/**
 * Payment Entity
 *
 * Records payment transactions.
 * JSONB gatewayResponse field for extensibility (Open/Closed Principle).
 * Supports multiple gateways: VNPay, future Momo/ZaloPay without schema changes.
 */
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('increment')
  paymentId: number;

  @Column()
  invoiceId: number;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({
    type: 'enum',
    enum: ['CASH', 'BANK_TRANSFER', 'VNPAY', 'MOMO', 'ZALOPAY'],
  })
  paymentMethod: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 100, nullable: true })
  transactionId: string;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: object;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // TODO: Implement payment gateway integration methods
}
