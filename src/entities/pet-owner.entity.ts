import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';

/**
 * PetOwner Entity
 *
 * Extends Account via foreign key relationship.
 * Represents pet owners who book appointments and manage pet profiles.
 */
@Entity('pet_owners')
export class PetOwner {
  @PrimaryGeneratedColumn('increment')
  petOwnerId: number;

  @Column({ unique: true })
  accountId: number;

  @OneToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ length: 50, default: 'Email' })
  preferredContactMethod: string;

  @Column({ length: 255, nullable: true })
  emergencyContact: string;

  @Column({ type: 'int', default: 0 })
  loyaltyPoints: number;

  @CreateDateColumn({ name: 'registrationDate' })
  registrationDate: Date;

  // Registered at / created at handled by registrationDate above

  // TODO: Implement relationships to Pet entity and methods
}
