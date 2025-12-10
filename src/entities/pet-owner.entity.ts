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
  ownerId: number;

  @Column({ unique: true })
  accountId: number;

  @OneToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ length: 100 })
  fullName: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @CreateDateColumn()
  registeredAt: Date;

  // TODO: Implement relationships to Pet entity and methods
}
