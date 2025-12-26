import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { seedDatabase, clearDatabase } from './seed';

/**
 * Seed Runner
 *
 * Usage:
 *   npm run seed           - Seeds the database
 *   npm run seed:refresh   - Clears and re-seeds the database
 */
async function runSeed() {
  console.log('📚 Connecting to database...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const shouldRefresh = process.argv.includes('--refresh');

  try {
    if (shouldRefresh) {
      console.log('🔄 Refresh mode: clearing existing data...');
      await clearDatabase(dataSource);
    }

    await seedDatabase(dataSource);

    console.log('\n📋 Test Accounts Created:');
    console.log(
      '┌──────────────────────────────┬─────────────────┬──────────────┐',
    );
    console.log(
      '│ Email                        │ Password        │ Role         │',
    );
    console.log(
      '├──────────────────────────────┼─────────────────┼──────────────┤',
    );
    console.log(
      '│ manager@pawlovers.com        │ Password@123    │ Manager      │',
    );
    console.log(
      '│ vet1@pawlovers.com           │ Password@123    │ Veterinarian │',
    );
    console.log(
      '│ vet2@pawlovers.com           │ Password@123    │ Veterinarian │',
    );
    console.log(
      '│ care1@pawlovers.com          │ Password@123    │ Care Staff   │',
    );
    console.log(
      '│ care2@pawlovers.com          │ Password@123    │ Care Staff   │',
    );
    console.log(
      '│ reception@pawlovers.com      │ Password@123    │ Receptionist │',
    );
    console.log(
      '│ owner1@gmail.com             │ Password@123    │ Pet Owner    │',
    );
    console.log(
      '│ owner2@gmail.com             │ Password@123    │ Pet Owner    │',
    );
    console.log(
      '│ owner3@gmail.com             │ Password@123    │ Pet Owner    │',
    );
    console.log(
      '└──────────────────────────────┴─────────────────┴──────────────┘',
    );
  } catch (error: unknown) {
    console.error('❌ Seed runner failed!');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Error:', error);
    }
    process.exit(1);
  } finally {
    await app.close();
  }

  process.exit(0);
}

runSeed().catch((error: unknown) => {
  console.error('❌ Seed runner failed before initialization.');
  console.error(error);
  process.exit(1);
});
