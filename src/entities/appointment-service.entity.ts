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
 * AppointmentService Junction Entity
 *
 * Represents the many-to-many relationship between appointments and services.
 * Allows one appointment to include multiple services.
 *
 * Additional fields:
 * - quantity: Number of times the service is performed (e.g., 2 baths)
 * - unitPrice: Price per unit at the time of booking (historical pricing)
 * - notes: Service-specific notes
 */
@Entity('appointment_services')
export class AppointmentService {
  @PrimaryGeneratedColumn('increment')
  appointmentServiceId: number;

  @Column()
  appointmentId: number;

  @ManyToOne(
    () => Appointment,
    (appointment) => appointment.appointmentServices,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column()
  serviceId: number;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
