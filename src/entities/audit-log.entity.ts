import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * AuditLog Entity
 *
 * Separation of concerns for audit trail.
 * Logs security events, data changes, and system actions.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment')
  logId: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ length: 50 })
  action: string;

  @Column({ length: 100, nullable: true })
  entityType: string;

  @Column({ nullable: true })
  entityId: number;

  @Column({ type: 'jsonb', nullable: true })
  changes: object;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  // TODO: Implement audit query and analysis methods
}
