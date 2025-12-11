import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { Pet } from './pet.entity';
import { Employee } from './employee.entity';
import { Service } from './service.entity';

/**
 * Appointment Entity
 *
 * References Employee directly (Law of Demeter - no scheduleId).
 * Manages appointment lifecycle: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED/CANCELLED.
 */
@Index(['employeeId', 'appointmentDate', 'startTime'], { unique: true })
@Check("endTime > startTime")
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('increment')
  appointmentId: number;

  @Column()
  petId: number;

  @ManyToOne(() => Pet, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  employeeId: number;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  serviceId: number;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ type: 'date' })
  appointmentDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  /** Optional cancellation reason */
  cancellationReason: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  /** Timestamp when appointment was cancelled */
  cancelledAt: Date | null;

  // TODO: Implement methods for status transitions and validation
}
