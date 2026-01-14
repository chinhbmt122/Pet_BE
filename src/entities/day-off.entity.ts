import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * DayOff Entity
 *
 * Manages company-wide day-off/holiday dates.
 * Used for tracking holidays and days when the business is closed.
 */
@Entity('day_offs')
export class DayOff {
  @PrimaryGeneratedColumn('increment')
  dayOffId: number;

  @Column({ type: 'date', unique: true })
  date: Date;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
