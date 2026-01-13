import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { seedDemoDatabase, clearDatabase } from './seed-demo';

/**
 * DEMO Seed Runner for January 14, 2026
 * 
 * Usage:
 *   npm run seed:demo           - Seeds demo database
 *   npm run seed:demo --refresh - Clears and re-seeds demo database
 */
async function runDemoSeed() {
  console.log('🎬 DEMO Seed Runner - January 14, 2026');
  console.log('📚 Connecting to database...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const shouldRefresh = process.argv.includes('--refresh');

  try {
    if (shouldRefresh) {
      console.log('🔄 Refresh mode: clearing existing data...');
      await clearDatabase(dataSource);
    }

    await seedDemoDatabase(dataSource);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║           📋 TEST ACCOUNTS FOR DEMO (Jan 14, 2026)            ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ Role         │ Email                      │ Password          ║');
    console.log('╠══════════════╪════════════════════════════╪═══════════════════╣');
    console.log('║ Manager      │ manager@pawlovers.com      │ Password@123      ║');
    console.log('║ Vet 1        │ vet.lan@pawlovers.com      │ Password@123      ║');
    console.log('║ Vet 2        │ vet.tuan@pawlovers.com     │ Password@123      ║');
    console.log('║ Vet 3        │ vet.minh@pawlovers.com     │ Password@123      ║');
    console.log('║ Care Staff 1 │ care.hong@pawlovers.com    │ Password@123      ║');
    console.log('║ Care Staff 2 │ care.nam@pawlovers.com     │ Password@123      ║');
    console.log('║ Care Staff 3 │ care.huong@pawlovers.com   │ Password@123      ║');
    console.log('║ Receptionist │ reception@pawlovers.com    │ Password@123      ║');
    console.log('║ Pet Owner 1  │ owner.minhanh@gmail.com    │ Password@123      ║');
    console.log('║ Pet Owner 2  │ owner.quocdai@gmail.com    │ Password@123      ║');
    console.log('║ Pet Owner 3  │ owner.hoanglong@gmail.com  │ Password@123      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n📌 Demo Date: January 14, 2026');
    console.log('📌 Data includes: 15 pets, 30+ appointments, medical records, invoices, payments');
    console.log('');
  } catch (error: unknown) {
    console.error('❌ Demo seed runner failed!');
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

runDemoSeed().catch((error: unknown) => {
  console.error('❌ Demo seed runner failed before initialization.');
  console.error(error);
  process.exit(1);
});
