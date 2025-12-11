import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

/**
 * PaymentGatewayArchive Entity
 *
 * Data retention policy for historical payment gateway responses.
 * Stores archived gateway responses for compliance and debugging.
 */
@Entity('payment_gateway_archives')
export class PaymentGatewayArchive {
  @PrimaryGeneratedColumn('increment')
  archiveId: number;

  @Column()
  paymentId: number;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ length: 50 })
  gatewayName: string;

  @Column({ type: 'jsonb' })
  gatewayResponse: object;

  @Column({ type: 'timestamp' })
  transactionTimestamp: Date;

  @CreateDateColumn()
  archivedAt: Date;

  // TODO: Implement archiving and cleanup methods
}
