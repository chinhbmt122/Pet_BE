import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  TableInheritance,
} from 'typeorm';
import { Account } from './account.entity';
import { Appointment } from './appointment.entity';
import { WorkSchedule } from './work-schedule.entity';
import { Payment } from './payment.entity';

/**
 * Employee Base Entity (Abstract, Pure Persistence)
 *
 * Uses Single Table Inheritance with 'role' discriminator column.
 * This is a pure persistence entity - all domain logic lives in EmployeeDomainModel hierarchy.
 *
 * Child entities: Veterinarian, CareStaff, Manager, Receptionist
 *
 * @see domain/employee.domain.ts for business logic
 * @see ADR-001 (Domain/Persistence Separation)
 */
@Entity('employees')
@TableInheritance({ column: { type: 'varchar', name: 'role' } })
export abstract class Employee {
  @PrimaryGeneratedColumn('increment')
  employeeId: number;

  @Column({ unique: true })
  accountId: number;

  @OneToOne('Account', 'employee', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account?: Account;

  // ===== Profile Fields (moved from Account) =====

  @Column({ length: 100 })
  fullName: string;

  @Column({ length: 20 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  // ===== Employee-specific Fields =====

  @Column({ type: 'date', nullable: false })
  hireDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  salary: number;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * One-to-Many relationship with Appointment
   * An employee can handle multiple appointments
   */
  @OneToMany(() => Appointment, (appointment) => appointment.employee)
  appointments?: Appointment[];

  /**
   * One-to-Many relationship with WorkSchedule
   * An employee can have multiple work schedules
   */
  @OneToMany(() => WorkSchedule, (schedule) => schedule.employee)
  workSchedules?: WorkSchedule[];

  /**
   * One-to-Many relationship with Payment
   * An employee can receive multiple payments
   */
  @OneToMany(() => Payment, (payment) => payment.receiver)
  paymentsReceived?: Payment[];
}
