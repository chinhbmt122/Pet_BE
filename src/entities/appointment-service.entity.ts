import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Service } from './service.entity';

/**
 * AppointmentService Entity
 * Junction table between Appointment and Service with quantity and notes
 */
@Entity('appointment_services')
export class AppointmentService {
  @PrimaryGeneratedColumn()
  appointmentServiceId: number;

  @Column()
  appointmentId: number;

  @Column()
  serviceId: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Appointment, appointment => appointment.appointmentServices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'serviceId' })
  service: Service;
}
