import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';

/**
 * Invoice Entity
 *
 * Represents financial invoices for appointments.
 * Tracks invoice status: PENDING, PROCESSING_ONLINE, PAID, FAILED.
 */
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('increment')
  invoiceId: number;

  @Column()
  appointmentId: number;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column({ length: 50, unique: true })
  invoiceNumber: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'PROCESSING_ONLINE', 'PAID', 'FAILED'],
    default: 'PENDING',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  // TODO: Implement invoice calculation and status transition methods
}
