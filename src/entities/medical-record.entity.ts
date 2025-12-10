import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from './pet.entity';
import { Employee } from './employee.entity';
import { Appointment } from './appointment.entity';

/**
 * MedicalRecord Entity
 *
 * Maintains comprehensive medical records for pets.
 * Records diagnosis, treatment details, prescriptions, and follow-up recommendations.
 * JSONB field for medicalSummary enables extensibility (Open/Closed Principle).
 */
@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('increment')
  recordId: number;

  @Column()
  petId: number;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  veterinarianId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'veterinarianId' })
  veterinarian: Employee;

  @Column({ nullable: true })
  appointmentId: number;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column({ type: 'timestamp' })
  examinationDate: Date;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'text' })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  prescription: string;

  @Column({ type: 'jsonb', nullable: true })
  medicalSummary: object;

  @Column({ type: 'text', nullable: true })
  followUpRecommendations: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Implement immutable record methods
}
