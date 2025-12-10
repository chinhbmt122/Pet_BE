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

  @OneToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ length: 100 })
  fullName: string;

  @Column({
    type: 'enum',
    enum: ['MANAGER', 'VETERINARIAN', 'CARE_STAFF', 'RECEPTIONIST'],
  })
  role: string;

  @Column({ type: 'text', nullable: true })
  specialization: string;

  @Column({ type: 'date', nullable: true })
  hireDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  // TODO: Implement relationships to WorkSchedule and Appointment entities
}
