import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { seedDatabase } from '../database/seed';
import { Account } from '../entities/account.entity';

/**
 * SeedService - Auto-seeds database on empty state
 *
 * This service runs on application startup and checks if the database is empty.
 * If no accounts exist, it runs the seed script to populate initial data.
 *
 * This is useful for:
 * - Render free tier (no shell access to run manual seeds)
 * - Fresh deployments
 * - Development environments
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    // Only auto-seed in production or when explicitly enabled
    const shouldAutoSeed =
      process.env.AUTO_SEED === 'true' || process.env.NODE_ENV === 'production';

    if (!shouldAutoSeed) {
      this.logger.log('Auto-seed disabled (set AUTO_SEED=true to enable)');
      return;
    }

    await this.seedIfEmpty();
  }

  async seedIfEmpty(): Promise<boolean> {
    try {
      const accountRepo = this.dataSource.getRepository(Account);
      const accountCount = await accountRepo.count();

      if (accountCount > 0) {
        this.logger.log(
          `Database already has ${accountCount} accounts, skipping seed`,
        );
        return false;
      }

      this.logger.warn('🌱 Database is empty, starting auto-seed...');
      await seedDatabase(this.dataSource);
      this.logger.log('✅ Auto-seed completed successfully!');
      return true;
    } catch (error) {
      this.logger.error('❌ Auto-seed failed:', error);
      // Don't throw - let the app continue even if seeding fails
      return false;
    }
  }

  /**
   * Manual seed trigger (can be called from an admin endpoint)
   */
  async forceSeed(): Promise<void> {
    this.logger.warn('🌱 Force seeding database...');
    await seedDatabase(this.dataSource);
    this.logger.log('✅ Force seed completed!');
  }
}
