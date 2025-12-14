import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Pet } from './pet.entity';

/**
 * PetOwner Entity (Pure Persistence)
 *
 * Links to Account via foreign key relationship.
 * This is a pure persistence entity - all domain logic lives in PetOwnerDomainModel.
 *
 * @see domain/pet-owner.domain.ts for business logic
 * @see ADR-001 (Domain/Persistence Separation)
 */
@Entity('pet_owners')
export class PetOwner {
  @PrimaryGeneratedColumn('increment')
  petOwnerId: number;

  @Column({ unique: true })
  accountId: number;

  @OneToOne('Account', 'petOwner', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account?: Account;

  // ===== Profile Fields (moved from Account) =====

  @Column({ length: 100 })
  fullName: string;

  @Column({ length: 20 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  // ===== PetOwner-specific Fields =====

  @Column({ length: 50, default: 'Email' })
  preferredContactMethod: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emergencyContact: string;

  @CreateDateColumn({ name: 'registrationDate' })
  registrationDate: Date;

  /**
   * One-to-Many relationship with Pet
   * A pet owner can have multiple pets
   */
  @OneToMany(() => Pet, (pet) => pet.owner)
  pets?: Pet[];
}
