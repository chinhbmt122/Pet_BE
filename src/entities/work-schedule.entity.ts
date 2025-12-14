import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { Employee } from './employee.entity';

/**
 * WorkSchedule Entity
 *
 * Renamed from Schedule per v3.0 OOAD principles.
 * Manages employee availability for appointment booking.
 * Used ONLY for availability checking (Law of Demeter).
 */
@Check('"endTime" > "startTime"')
@Entity('work_schedules')
export class WorkSchedule {
  @PrimaryGeneratedColumn('increment')
  scheduleId: number;

  @Column()
  employeeId: number;

  @ManyToOne(() => Employee, (employee) => employee.workSchedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'date' })
  workDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'time', nullable: true })
  breakStart: string;

  @Column({ type: 'time', nullable: true })
  breakEnd: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true })
  /** Optional notes or reason for unavailability */
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

