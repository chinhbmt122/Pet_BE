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
 * Account Entity
 *
 * STI (Single Table Inheritance) base entity with userType discriminator.
 * Represents user accounts for authentication and authorization.
 * Supports five user roles: PET_OWNER, MANAGER, VETERINARIAN, CARE_STAFF, RECEPTIONIST.
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

  // Relationships

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
