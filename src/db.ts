import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Config } from '@foal/core';
import * as entities from './app/entities';
import { DatabaseSession } from '@foal/typeorm';

// Prod vs Dev erkennen
const env = process.env.SETTINGS_ENV || 'development';

const dbConfig: Partial<PostgresConnectionOptions> = {
  type: 'postgres',
  host: env === 'production' ? process.env.DB_HOST : Config.get('database.host', 'string', 'localhost'),
  port: env === 'production' ? Number(process.env.DB_PORT) || 5432 : Config.get('database.port', 'number', 5432),
  username: env === 'production' ? process.env.DB_USERNAME : Config.get('database.username', 'string', 'postgres'),
  password: env === 'production' ? process.env.DB_PASSWORD : Config.get('database.password', 'string', ''),
  database: env === 'production' ? process.env.DB_NAME : Config.get('database.database', 'string', 'mtgtierlist_local'),
  synchronize:
    env === 'production'
      ? process.env.DB_SYNCHRONIZE === 'true'
      : Config.get('database.synchronize', 'boolean', true),
  ssl: env === 'production' ? { rejectUnauthorized: false } : undefined, // Render Postgres SSL
};

console.log('Database config:', { ...dbConfig});

export const dataSource = new DataSource({
  ...dbConfig,
  entities: [...Object.values(entities), DatabaseSession],
  migrations: ['build/migrations/*.js'],
} as PostgresConnectionOptions);
