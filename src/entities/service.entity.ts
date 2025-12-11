import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ServiceCategory } from './service-category.entity';

/**
 * Service Entity
 *
 * Represents services offered by the pet care center.
 * References ServiceCategory for catalog management (SRP: separated category concerns).
 * SRP Applied: Service details only, category metadata managed separately.
 */
@Index('idx_service_category', ['serviceCategoryId'])
@Index('idx_service_available', ['isAvailable'])
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('increment')
  serviceId: number;

  @Column({ length: 100, unique: true })
  serviceName: string;

  @Column()
  categoryId: number;

  @ManyToOne(() => ServiceCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  serviceCategory: ServiceCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'int' })
  estimatedDuration: number;

  @Column({ length: 50 })
  requiredStaffType: string; // 'Veterinarian', 'CareStaff', 'Any'

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Implement pricing calculation methods
}
