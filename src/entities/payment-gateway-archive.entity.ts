import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

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
