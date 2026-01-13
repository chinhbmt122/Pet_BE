import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * EmailLog Entity
 *
 * Tracks all emails sent by the system for auditing and debugging.
 * Helps monitor delivery status and troubleshoot email issues.
 */
@Index('idx_email_log_recipient', ['recipient'])
@Index('idx_email_log_status', ['status'])
@Index('idx_email_log_sent_at', ['sentAt'])
@Index('idx_email_log_type', ['emailType'])
@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('increment')
  emailLogId: number;

  @Column({ type: 'varchar', length: 255 })
  recipient: string;

  @Column({ type: 'varchar', length: 100 })
  emailType: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'failed', 'bounced'],
    default: 'pending',
  })
  status: 'pending' | 'sent' | 'failed' | 'bounced';

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn()
  sentAt: Date;
}
