import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entitiesOrdered } from './entities';

/**
 * DatabaseModule
 *
 * Configures TypeORM connection using environment variables.
 * Imports all entities and enables synchronization for development.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL');

        const baseConfig = {
          type: 'postgres' as const,
          entities: entitiesOrdered,
          // For initial deployment, use synchronize to create schema
          // TODO: Switch to migrations once stable
          synchronize: true,
          logging: !isProduction,
          // Disable migrationsRun - migrations aren't compiled by nest build
          migrationsRun: false,
          ssl: isProduction ? { rejectUnauthorized: false } : undefined,
        };

        if (databaseUrl) {
          return {
            ...baseConfig,
            url: databaseUrl,
          };
        }

        return {
          ...baseConfig,
          host: configService.get<string>('DATABASE_HOST'),
          port: configService.get<number>('DATABASE_PORT'),
          username: configService.get<string>('DATABASE_USER'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
