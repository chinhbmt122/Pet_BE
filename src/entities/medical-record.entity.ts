import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from './pet.entity';
import { Veterinarian } from './veterinarian.entity';
import { Appointment } from './appointment.entity';
import { VaccinationHistory } from './vaccination-history.entity';

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

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  veterinarianId: number;

  @ManyToOne(() => Veterinarian, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'veterinarianId' })
  veterinarian: Veterinarian;

  @Column({ type: 'int', nullable: true })
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

  @Column({ type: 'jsonb', nullable: true })
  medicalSummary: object;

  @Column({ type: 'date', nullable: true })
  followUpDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * One-to-Many relationship with VaccinationHistory
   * A medical record can include multiple vaccination records
   */
  @OneToMany(
    () => VaccinationHistory,
    (vaccination) => vaccination.medicalRecord,
  )
  vaccinations?: VaccinationHistory[];
}
