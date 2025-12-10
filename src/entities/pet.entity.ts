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

  @ManyToOne(() => PetOwner)
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

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'text', nullable: true })
  healthCondition: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Implement relationships to Appointment and MedicalRecord entities
}
