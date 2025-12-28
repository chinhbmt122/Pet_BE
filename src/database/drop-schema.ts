import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function dropSchema() {
  try {
    console.log('🔄 Initializing application context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('🗑️  Dropping schema...');
    await dataSource.query('DROP SCHEMA public CASCADE');
    await dataSource.query('CREATE SCHEMA public');
    await dataSource.query('GRANT  ALL ON SCHEMA public TO postgres');
    await dataSource.query('GRANT ALL ON SCHEMA public TO public');

    console.log('✅ Schema dropped successfully!');
    console.log('📝 Now run: npm run seed');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error dropping schema:', error);
    process.exit(1);
  }
}

dropSchema();
