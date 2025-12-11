import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VaccinationHistory } from './vaccination-history.entity';
import { VaccineCategory } from './types/entity.types';

export { VaccineCategory };

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

  @Column({
    type: 'enum',
    enum: VaccineCategory,
  })
  category: VaccineCategory;

  @Column({ unique: true, length: 100 })
  vaccineName: string;

  @Column({ length: 50 })
  targetSpecies: string; // 'Dog','Cat', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
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

  /**
   * One-to-Many relationship with VaccinationHistory
   * A vaccine type can be used in multiple vaccination records
   */
  @OneToMany(() => VaccinationHistory, (vaccination) => vaccination.vaccineType)
  vaccinations?: VaccinationHistory[];
}
