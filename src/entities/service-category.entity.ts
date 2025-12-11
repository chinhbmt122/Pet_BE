import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * ServiceCategory Entity
 *
 * Represents service categories offered by the pet care center.
 * Catalog entity - reference data with metadata.
 * SRP Applied: Separated from Service for independent management and metadata.
 */
@Entity('service_categories')
export class ServiceCategory {
  @PrimaryGeneratedColumn('increment')
  categoryId: number;

  @Column({ length: 50, unique: true })
  categoryName: string; // e.g., 'Grooming', 'Medical', 'Boarding', 'Training', 'Wellness', 'Special Care'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Implement category-specific pricing or rules if needed
}
