import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Config } from '@foal/core';
import * as entities from './app/entities'; // importiert alle Entities aus index.ts
import { DatabaseSession } from '@foal/typeorm';

const isProd = Config.get('settings.env', 'string') === 'production';

const dbConfig: Partial<PostgresConnectionOptions> = isProd
  ? {
      type: 'postgres',
      url: Config.get('database.url', 'string'),
      ssl: { rejectUnauthorized: false },
    }
  : {
      type: 'postgres',
      host: Config.get('database.host', 'string'),
      port: Config.get('database.port', 'number'),
      username: Config.get('database.username', 'string'),
      password: Config.get('database.password', 'string'),
      database: Config.get('database.database', 'string'),
    };

export const dataSource = new DataSource({
  ...dbConfig,
  synchronize: Config.get('database.synchronize', 'boolean', true),
  entities: [ 
    ...Object.values(entities), // alle Entities aus index.ts
    DatabaseSession], 
  migrations: ['build/migrations/*.js'],
} as PostgresConnectionOptions);
