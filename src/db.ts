
import { Config } from '@foal/core';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const env = Config.get('.env'); // 'development' | 'test' | 'production'
const isProd = env === 'production';

const dbConfig: Partial<PostgresConnectionOptions> = isProd 
  ? {
      type: 'postgres',
      url: Config.getOrThrow('database.url', 'string'),
      ssl: { rejectUnauthorized: false }, // Render -> selbstsigniertes SSL-Zertifikat 
  } 
: {
      type: Config.getOrThrow('database.type', 'string') as any,
      host: Config.getOrThrow('database.host', 'string'),
      port: Number(Config.getOrThrow('database.port', 'string')), // Zahl konvertieren
      username: Config.getOrThrow('database.username', 'string'),
      password: Config.getOrThrow('database.password', 'string'),
      database: Config.getOrThrow('database.database', 'string'),
  };

export const dataSource = new DataSource({
  ...dbConfig,
  synchronize: Config.get('database.synchronize', 'boolean', true),
  entities: ['build/app/**/*.entity.js'],
  migrations: ['build/migrations/*.js'],
} as PostgresConnectionOptions);