import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CageSize, CageStatus } from './types/entity.types';
import { CageAssignment } from './cage-assignment.entity';

/**
 * Cage Entity
 *
 * Represents a physical cage for pet boarding or treatment.
 */
@Index('idx_cage_status', ['status'])
@Entity('cages')
export class Cage {
  @PrimaryGeneratedColumn('increment')
  cageId: number;

  @Column({ length: 20, unique: true })
  cageNumber: string;

  @Column({
    type: 'enum',
    enum: CageSize,
  })
  size: CageSize;

  @Column({ type: 'varchar', length: 50, nullable: true })
  location: string | null;

  @Column({
    type: 'enum',
    enum: CageStatus,
    default: CageStatus.AVAILABLE,
  })
  status: CageStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyRate: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ===== Relations =====

  @OneToMany(() => CageAssignment, (assignment) => assignment.cage)
  assignments?: CageAssignment[];
}
