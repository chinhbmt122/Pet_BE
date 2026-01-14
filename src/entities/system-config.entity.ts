import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * SystemConfig Entity
 *
 * Stores system-wide configuration including persistent day-off rules.
 * Examples: weekly recurring days off (e.g., Sunday), business hours, etc.
 */
@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('increment')
  configId: number;

  /**
   * Unique configuration key (e.g., 'persistent_days_off', 'business_hours')
   */
  @Column({ length: 100, unique: true })
  configKey: string;

  /**
   * Configuration value stored as JSON string for flexibility.
   * For persistent_days_off: JSON array of day numbers (0=Sunday, 6=Saturday)
   * Example: "[0]" means Sunday is always off
   * Example: "[0,6]" means Sunday and Saturday are always off
   */
  @Column({ type: 'text' })
  configValue: string;

  /**
   * Human-readable description of this configuration
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Whether this configuration is currently active
   */
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
