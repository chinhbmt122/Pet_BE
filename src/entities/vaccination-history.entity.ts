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
import { Veterinarian } from './veterinarian.entity';

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

  @ManyToOne(() => Veterinarian, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'administeredBy' })
  administrator: Veterinarian;

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

  // ===== Domain Methods (per ADR-002: Pragmatic + Methods) =====

  /**
   * Calculates the next due date based on vaccine booster interval.
   * Requires vaccineType relation to be loaded.
   *
   * @returns Date of next vaccination, or null if no interval defined
   */
  calculateNextDueDate(): Date | null {
    if (!this.vaccineType?.boosterIntervalMonths) {
      return null;
    }

    const adminDate = new Date(this.administrationDate);
    const nextDate = new Date(adminDate);
    nextDate.setMonth(nextDate.getMonth() + this.vaccineType.boosterIntervalMonths);

    return nextDate;
  }

  /**
   * Checks if vaccination is due (nextDueDate has passed).
   *
   * @returns true if overdue, false otherwise
   */
  isDue(): boolean {
    if (!this.nextDueDate) {
      return false;
    }
    return new Date() > new Date(this.nextDueDate);
  }

  /**
   * Returns days until next vaccination is due.
   * Negative value means overdue.
   *
   * @returns Number of days until due, or null if no due date
   */
  daysUntilDue(): number | null {
    if (!this.nextDueDate) {
      return null;
    }
    const now = new Date();
    const dueDate = new Date(this.nextDueDate);
    const diffMs = dueDate.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}
