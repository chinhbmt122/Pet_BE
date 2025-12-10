import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Pet } from './pet.entity';
import { VaccineType } from './vaccine-type.entity';
import { Employee } from './employee.entity';

/**
 * VaccinationHistory Entity
 *
 * Records pet vaccination transactions (SRP - separated from VaccineType catalog).
 * Tracks date administered, batch number, reactions, and next due date.
 */
@Entity('vaccination_history')
export class VaccinationHistory {
  @PrimaryGeneratedColumn('increment')
  vaccinationId: number;

  @Column()
  petId: number;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  vaccineTypeId: number;

  @ManyToOne(() => VaccineType)
  @JoinColumn({ name: 'vaccineTypeId' })
  vaccineType: VaccineType;

  @Column()
  veterinarianId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'veterinarianId' })
  veterinarian: Employee;

  @Column({ type: 'date' })
  dateAdministered: Date;

  @Column({ length: 100, nullable: true })
  batchNumber: string;

  @Column({ type: 'date', nullable: true })
  nextDueDate: Date;

  @Column({ type: 'text', nullable: true })
  reactions: string;

  @CreateDateColumn()
  createdAt: Date;

  // TODO: Implement reminder notification methods
}
