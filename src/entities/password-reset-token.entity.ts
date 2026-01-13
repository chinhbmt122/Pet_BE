import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * PasswordResetToken Entity
 *
 * Stores tokens for password reset functionality.
 * Tokens expire after 15 minutes for security.
 */
@Index('idx_password_reset_token', ['token'], { unique: true })
@Index('idx_password_reset_email', ['email'])
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
