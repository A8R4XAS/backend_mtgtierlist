import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Config } from '@foal/core';
import * as entities from './app/entities';
import { DatabaseSession } from '@foal/typeorm';

export const dataSource = new DataSource({
  type: 'postgres',
  url: Config.get('database.url', 'string'),
  host: Config.get('database.host', 'string'), // fallback für dev
  port: Config.get('database.port', 'number'),
  username: Config.get('database.username', 'string'),
  password: Config.get('database.password', 'string'),
  database: Config.get('database.database', 'string'),
  synchronize: Config.get('database.synchronize', 'boolean', true),
  entities: [...Object.values(entities), DatabaseSession],
  migrations: ['build/migrations/*.js'],
} as PostgresConnectionOptions);
