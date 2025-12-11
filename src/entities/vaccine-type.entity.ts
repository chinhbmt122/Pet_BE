import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column({ length: 50 })
  category: string; // 'Core','Non-core','Optional'

  @Column({ unique: true, length: 100 })
  vaccineName: string;

  @Column({ length: 50 })
  targetSpecies: string; // 'Dog','Cat', etc.

  @Column({ length: 100, nullable: true })
  manufacturer: string;

  @Column({ type: 'text', nullable: true })
  description: string;


  @Column({ type: 'int', nullable: true })
  recommendedAgeMonths: number;

  @Column({ type: 'int', nullable: true })
  boosterIntervalMonths: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Implement vaccine schedule calculation methods
}
