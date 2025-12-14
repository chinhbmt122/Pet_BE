import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CageAssignmentStatus } from './types/entity.types';
import { Cage } from './cage.entity';
import { Pet } from './pet.entity';
import { Employee } from './employee.entity';

/**
 * CageAssignment Entity
 *
 * Represents a pet's stay in a cage for boarding or treatment.
 */
@Index('idx_assignment_cage', ['cageId'])
@Index('idx_assignment_pet', ['petId'])
@Index('idx_assignment_status', ['status'])
@Entity('cage_assignments')
export class CageAssignment {
  @PrimaryGeneratedColumn('increment')
  assignmentId: number;

  @Column()
  cageId: number;

  @ManyToOne(() => Cage, (cage) => cage.assignments)
  @JoinColumn({ name: 'cageId' })
  cage?: Cage;

  @Column()
  petId: number;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'petId' })
  pet?: Pet;

  @Column({ type: 'date' })
  checkInDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedCheckOutDate: Date | null;

  @Column({ type: 'date', nullable: true })
  actualCheckOutDate: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyRate: number;

  @Column({ type: 'int', nullable: true })
  assignedById: number | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assignedById' })
  assignedBy?: Employee;

  @Column({
    type: 'enum',
    enum: CageAssignmentStatus,
    default: CageAssignmentStatus.ACTIVE,
  })
  status: CageAssignmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
