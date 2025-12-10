import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';

/**
 * Account Entity
 *
 * STI (Single Table Inheritance) base entity with userType discriminator.
 * Represents user accounts for authentication and authorization.
 * Supports five user roles: PET_OWNER, MANAGER, VETERINARIAN, CARE_STAFF, RECEPTIONIST.
 */
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('increment')
  accountId: number;

  @Column({ unique: true, length: 100 })
  username: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 20, nullable: true })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: [
      'PET_OWNER',
      'MANAGER',
      'VETERINARIAN',
      'CARE_STAFF',
      'RECEPTIONIST',
    ],
  })
  userType: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Implement relationships and methods
}
