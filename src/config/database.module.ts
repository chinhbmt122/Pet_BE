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
        const databaseUrl = configService.get('DATABASE_URL');

        const config: any = {
          type: 'postgres',
          entities: entitiesOrdered,
          synchronize: !isProduction,
          logging: !isProduction,
          migrationsRun: isProduction, // Auto-run migrations in production
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        };

        if (databaseUrl) {
          config.url = databaseUrl;
        } else {
          config.host = configService.get('DATABASE_HOST');
          config.port = configService.get('DATABASE_PORT');
          config.username = configService.get('DATABASE_USER');
          config.password = configService.get('DATABASE_PASSWORD');
          config.database = configService.get('DATABASE_NAME');
        }

        if (isProduction) {
          config.ssl = {
            rejectUnauthorized: false, // Required for many PaaS Postgres connections
          };
        }

        return config;
      },
    }),
  ],
})
export class DatabaseModule { }
