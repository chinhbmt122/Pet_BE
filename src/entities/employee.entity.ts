import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';

/**
 * Employee Entity
 *
 * Extends Account via foreign key relationship.
 * Represents staff members: Manager, Veterinarian, CareStaff, Receptionist.
 */
@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('increment')
  employeeId: number;

  @Column({ unique: true })
  accountId: number;

  @OneToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  // Role is defined on Account.userType to avoid duplication

  @Column({ type: 'text', nullable: true })
  specialization: string;

  @Column({ length: 100, nullable: true })
  licenseNumber: string;

  @Column({ type: 'date', nullable: false })
  hireDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  salary: number;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // TODO: Implement relationships to WorkSchedule and Appointment entities
}
