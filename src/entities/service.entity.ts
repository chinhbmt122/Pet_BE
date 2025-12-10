import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Service Entity
 *
 * Represents services offered by the pet care center.
 * Categories: Bathing, Spa, Grooming, Check-up (Veterinary), Vaccination.
 */
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('increment')
  serviceId: number;

  @Column({ length: 100 })
  serviceName: string;

  @Column({ length: 50 })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Implement pricing calculation methods
}
