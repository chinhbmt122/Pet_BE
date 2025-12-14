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
import { AuditOperation, ActorType } from './types/entity.types';

export { AuditOperation, ActorType };

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

  @Column({
    type: 'enum',
    enum: AuditOperation,
  })
  operation: AuditOperation;

  @Column({ type: 'jsonb', nullable: true })
  changes: object | null;

  @Column({ type: 'int', nullable: true })
  actorAccountId: number | null;

  @ManyToOne(() => Account, (account) => account.auditLogs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'actorAccountId' })
  actorAccount: Account | null;

  @Column({
    type: 'enum',
    enum: ActorType,
    nullable: true,
  })
  actorType: ActorType | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'changedAt' })
  changedAt: Date;

  // TODO: Implement audit query and analysis methods
}
