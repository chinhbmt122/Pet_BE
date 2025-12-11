import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Pet } from './pet.entity';
import { VaccineType } from './vaccine-type.entity';
import { MedicalRecord } from './medical-record.entity';
import { Employee } from './employee.entity';

/**
 * VaccinationHistory Entity
 *
 * Records pet vaccination transactions (SRP - separated from VaccineType catalog).
 * Tracks date administered, batch number, reactions, and next due date.
 */
@Index('idx_vacc_pet_date', ['petId', 'administrationDate'])
@Index('idx_vacc_due', ['nextDueDate'])
@Index('idx_vacc_batch', ['batchNumber'])
@Index('idx_vacc_type', ['vaccineTypeId'])
@Entity('vaccination_history')
export class VaccinationHistory {
  @PrimaryGeneratedColumn('increment')
  vaccinationId: number;

  @Column()
  petId: number;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  vaccineTypeId: number;

  @ManyToOne(() => VaccineType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vaccineTypeId' })
  vaccineType: VaccineType;

  @Column({ type: 'int', nullable: true })
  medicalRecordId: number;

  @ManyToOne(() => MedicalRecord, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'medicalRecordId' })
  medicalRecord: MedicalRecord;

  @Column({ type: 'varchar', length: 100, nullable: true })
  batchNumber: string;

  @Column({ length: 50, nullable: true })
  site: string;

  @Column({ nullable: true })
  administeredBy: number;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'administeredBy' })
  administrator: Employee;

  @Column({ type: 'text', nullable: true })
  reactions: string;

  @Column({ type: 'date' })
  administrationDate: Date;

  @Column({ type: 'date', nullable: true })
  nextDueDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  // TODO: Implement reminder notification methods
}
