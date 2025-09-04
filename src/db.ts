import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Config } from '@foal/core';
import * as entities from './app/entities';
import { DatabaseSession } from '@foal/typeorm';

// db.ts jetzt ohne Dev/Prod Unterscheidung, alles kommt aus Config/Env
const dbConfig: Partial<PostgresConnectionOptions> = {
  type: 'postgres',
  host: Config.get('database.host', 'string'),
  port: Config.get('database.port', 'number'),
  username: Config.get('database.username', 'string'),
  password: Config.get('database.password', 'string'),
  database: Config.get('database.database', 'string'),
  synchronize: Config.get('database.synchronize', 'boolean'),
  ssl: process.env.SETTINGS_ENV === 'production' ? { rejectUnauthorized: false } : undefined, // SSL nur in Prod
};

console.log('Database config:', { ...dbConfig });

export const dataSource = new DataSource({
  ...dbConfig,
  entities: [...Object.values(entities), DatabaseSession],
  migrations: ['build/migrations/*.js'],
} as PostgresConnectionOptions);
