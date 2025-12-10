import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

/**
 * WorkSchedule Entity
 *
 * Renamed from Schedule per v3.0 OOAD principles.
 * Manages employee availability for appointment booking.
 * Used ONLY for availability checking (Law of Demeter).
 */
@Entity('work_schedules')
export class WorkSchedule {
  @PrimaryGeneratedColumn('increment')
  scheduleId: number;

  @Column()
  employeeId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'date' })
  workDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'time', nullable: true })
  breakStartTime: string;

  @Column({ type: 'time', nullable: true })
  breakEndTime: string;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Implement conflict detection methods
}
