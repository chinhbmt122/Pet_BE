import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Appointment } from './appointment.entity';
import { WorkSchedule } from './work-schedule.entity';
import { MedicalRecord } from './medical-record.entity';
import { VaccinationHistory } from './vaccination-history.entity';
import { Payment } from './payment.entity';

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

  @OneToOne('Account', 'employee', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account?: Account;

  // Role is defined on Account.userType to avoid duplication

  @Column({ type: 'text', nullable: true })
  specialization: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  licenseNumber: string;

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
   * One-to-Many relationship with MedicalRecord
   * A veterinarian can create multiple medical records
   */
  @OneToMany(() => MedicalRecord, (record) => record.veterinarian)
  medicalRecords?: MedicalRecord[];

  /**
   * One-to-Many relationship with VaccinationHistory
   * An employee can administer multiple vaccinations
   */
  @OneToMany(
    () => VaccinationHistory,
    (vaccination) => vaccination.administrator,
  )
  vaccinationsAdministered?: VaccinationHistory[];

  /**
   * One-to-Many relationship with Payment
   * An employee can receive multiple payments
   */
  @OneToMany(() => Payment, (payment) => payment.receiver)
  paymentsReceived?: Payment[];
}
