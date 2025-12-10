import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * VaccineType Entity
 *
 * Catalog entity for vaccine metadata (DRY principle).
 * Stores reference data: name, manufacturer, schedule.
 * Separated from VaccinationHistory per SRP.
 */
@Entity('vaccine_types')
export class VaccineType {
  @PrimaryGeneratedColumn('increment')
  vaccineTypeId: number;

  @Column({ unique: true, length: 100 })
  vaccineName: string;

  @Column({ length: 100, nullable: true })
  manufacturer: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  validityDays: number;

  @Column({ type: 'jsonb', nullable: true })
  scheduleInfo: object;

  @CreateDateColumn()
  createdAt: Date;

  // TODO: Implement vaccine schedule calculation methods
}
