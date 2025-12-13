import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { PetOwner } from './pet-owner.entity';
import { Employee } from './employee.entity';
import { AuditLog } from './audit-log.entity';
import { UserType } from './types/entity.types';

export { UserType };

/**
 * Account Entity (Pure Persistence)
 *
 * Uses composition pattern with PetOwner and Employee entities.
 * This is a pure persistence entity - all domain logic lives in AccountDomainModel.
 *
 * @see domain/account.domain.ts for business logic
 * @see ADR-001 (Domain/Persistence Separation)
 *
 * Relationships:
 * - @OneToOne with PetOwner (for PET_OWNER userType)
 * - @OneToOne with Employee hierarchy (for staff userTypes)
 */
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('increment')
  accountId: number;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserType,
  })
  userType: UserType;

  @Column({ length: 255 })
  fullName: string;

  @Column({ unique: true, length: 20 })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ===== Relationships =====

  /**
   * One-to-One relationship with PetOwner
   * If userType is PET_OWNER, this will be populated
   */
  @OneToOne(() => PetOwner, (petOwner) => petOwner.account)
  petOwner?: PetOwner;

  /**
   * One-to-One relationship with Employee
   * If userType is MANAGER, VETERINARIAN, CARE_STAFF, or RECEPTIONIST, this will be populated
   */
  @OneToOne(() => Employee, (employee) => employee.account)
  employee?: Employee;

  /**
   * One-to-Many relationship with AuditLog
   * Tracks all actions performed by this account
   */
  @OneToMany(() => AuditLog, (auditLog) => auditLog.actorAccount)
  auditLogs?: AuditLog[];
}
