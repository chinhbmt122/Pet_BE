import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { PetOwner } from './pet-owner.entity';
import { Appointment } from './appointment.entity';
import { MedicalRecord } from './medical-record.entity';
import { VaccinationHistory } from './vaccination-history.entity';

/**
 * Pet Entity
 *
 * Represents pets registered in the system.
 * Maintains pet information including name, species, breed, age, weight, and health condition.
 */
@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('increment')
  petId: number;

  @Column()
  ownerId: number;

  @ManyToOne(() => PetOwner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: PetOwner;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  species: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  breed: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ length: 10, nullable: false, default: 'Unknown' })
  gender: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  initialHealthStatus: string;

  @Column({ type: 'text', nullable: true })
  specialNotes: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Soft delete column - when set, record is excluded from normal queries.
   * Use repository.softDelete() to set, repository.restore() to clear.
   */
  @DeleteDateColumn()
  deletedAt: Date | null;

  // Virtual getter for computed age (years) based on birthDate
  get age(): number {
    if (!this.birthDate) return 0;
    const diff = Date.now() - new Date(this.birthDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }

  /**
   * One-to-Many relationship with Appointment
   * A pet can have multiple appointments
   */
  @OneToMany(() => Appointment, (appointment) => appointment.pet)
  appointments?: Appointment[];

  /**
   * One-to-Many relationship with MedicalRecord
   * A pet can have multiple medical records
   */
  @OneToMany(() => MedicalRecord, (record) => record.pet)
  medicalRecords?: MedicalRecord[];

  /**
   * One-to-Many relationship with VaccinationHistory
   * A pet can have multiple vaccination records
   */
  @OneToMany(() => VaccinationHistory, (vaccination) => vaccination.pet)
  vaccinationHistory?: VaccinationHistory[];
}
