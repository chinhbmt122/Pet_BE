import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from './service.entity';

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

  /**
   * One-to-Many relationship with Service
   * A category can have multiple services
   */
  @OneToMany(() => Service, (service) => service.serviceCategory)
  services?: Service[];
}
