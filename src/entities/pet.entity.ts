import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PetOwner } from './pet-owner.entity';

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

  @Column({ length: 100, nullable: true })
  breed: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ length: 10, nullable: false, default: 'Unknown' })
  gender: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ length: 100, nullable: true })
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

  // Virtual getter for computed age (years) based on birthDate
  get age(): number {
    if (!this.birthDate) return 0;
    const diff = Date.now() - new Date(this.birthDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }

  // TODO: Implement relationships to Appointment and MedicalRecord entities
}
