import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from './account.entity';

/**
 * AuditLog Entity
 *
 * Separation of concerns for audit trail.
 * Logs security events, data changes, and system actions.
 */
@Index('idx_audit_actor_account', ['actorAccountId'])
@Index('idx_audit_changed_at', ['changedAt'])
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment')
  auditId: number;

  @Column({ length: 50 })
  tableName: string;

  @Column()
  recordId: number;

  @Column({ length: 10 })
  operation: string; // 'INSERT' | 'UPDATE' | 'DELETE'

  @Column({ type: 'jsonb', nullable: true })
  changes: object | null;

  @Column({ nullable: true })
  actorAccountId: number | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorAccountId' })
  actorAccount: Account | null;

  @Column({ length: 50, nullable: true })
  actorType: string | null; // EMPLOYEE | PET_OWNER | SYSTEM | WEBHOOK

  @Column({ type: 'uuid', nullable: true })
  requestId: string | null;

  @Column({ length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'changedAt' })
  changedAt: Date;

  // TODO: Implement audit query and analysis methods
}
