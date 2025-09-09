import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DatabaseSession } from '@foal/typeorm';
import { Config } from '@foal/core';

// DB Config: erst process.env, dann Foal Config, dann Default-Fallback
const dbConfig: Partial<PostgresConnectionOptions> = {
  type: 'postgres',
  host: process.env.DB_HOST || Config.get('database.host', 'string'),
  port: Number(process.env.DB_PORT || Config.get('database.port', 'number', 5432)),
  username: process.env.DB_USERNAME || Config.get('database.username', 'string'),
  password: process.env.DB_PASSWORD || Config.get('database.password', 'string'),
  database: process.env.DB_NAME || Config.get('database.database', 'string'),
  synchronize: process.env.DB_SYNCHRONIZE
    ? process.env.DB_SYNCHRONIZE === 'true'
    : Config.get('database.synchronize', 'boolean', true),
  ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : undefined, // SSL nur wenn DB_HOST gesetzt (Prod
};

console.log(dbConfig);

export const dataSource = new DataSource({
  ...dbConfig,
  entities: ['build/app/entities/*.js*', DatabaseSession],
  migrations: ['build/migrations/*.js'],
  logging: ['query', 'error', 'schema'],
  migrationsRun: false,
} as PostgresConnectionOptions);
