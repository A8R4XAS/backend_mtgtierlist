// 3p
import { Logger, ServiceManager } from '@foal/core';
import { type DataSourceOptions } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { unparse, parse } from 'papaparse';
import * as AdmZip from 'adm-zip';

// App
import { dataSource } from '../db';
import { User, Game, Deck, Rating, Participation, User_deck } from '../app/entities';

// Typen für CSV-Parsing und Datenbank
type EntityConstructor = typeof User | typeof Game | typeof Deck | typeof Rating | typeof Participation | typeof User_deck;

// Record-Typ für CSV-Daten
interface CSVRecord {
    [key: string]: string | null;
}

// Hilfsfunktion zum sicheren Fehlerhandling
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

// Konfiguration aus der Datenquelle extrahieren
function getDatabaseConfig(options: DataSourceOptions): { host: string; port: number; database: string; username: string; password: string; } {
    return {
        host: (options as any).host || 'localhost',
        port: (options as any).port || 5432,
        database: (options as any).database as string || 'postgres',
        username: (options as any).username || 'postgres',
        password: (options as any).password || ''
    };
}

// Schema für die CLI-Parameter
export const schema = {
    properties: {
        type: { type: 'string', enum: ['csv', 'sql'], default: 'csv' },
        operation: { type: 'string', enum: ['backup', 'restore'] },
        file: { type: 'string' }
    },
    type: 'object'
};

// Backup-Verzeichnis relativ zum Projektroot
const BACKUP_DIR = 'backups';

/**
 * Hauptfunktion des Backup-Tools
 */
export async function main(args: { operation: string, type?: string, file?: string }, services: ServiceManager, logger: Logger) {
    // Initialisiere die Datenbankverbindung
    await dataSource.initialize();

    try {
        // Stelle sicher, dass das Backup-Verzeichnis existiert
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        const operation = args.operation.toLowerCase();
        if (operation === 'backup') {
            console.log('Starting backup operation...');
            await createBackup(args.type || 'csv', logger);
        } else if (operation === 'restore') {
            if (!args.file) {
                throw new Error('File parameter is required for restore operation');
            }
            const filePath = path.resolve(args.file);
            console.log(`Starting restore operation from file: ${filePath}`);
            await restoreBackup(filePath, logger);
        } else {
            throw new Error('Invalid operation');
        }
    } catch (error) {
        logger.error('Operation failed: ' + getErrorMessage(error));
        throw error;
    } finally {
        await dataSource.destroy();
    }
}

/**
 * Erstellt ein Backup der Datenbank
 */
async function createBackup(type: string, logger: Logger) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (type === 'sql') {
        await createSqlBackup(timestamp, logger);
        return;
    }

    // Temporäres Verzeichnis für CSV-Dateien
    const tempDir = path.join(BACKUP_DIR, `temp_${timestamp}`);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
        // Liste aller zu sichernden Entitäten
        const entities: { name: string; entity: EntityConstructor }[] = [
            { name: 'users', entity: User },
            { name: 'games', entity: Game },
            { name: 'decks', entity: Deck },
            { name: 'ratings', entity: Rating },
            { name: 'participations', entity: Participation },
            { name: 'user_decks', entity: User_deck }
        ];

        // Exportiere jede Entität als CSV
        for (const { name, entity } of entities) {
            const repository = dataSource.getRepository(entity);
            const data = await repository.find();
            const csv = unparse(data);
            fs.writeFileSync(path.join(tempDir, `${name}.csv`), csv);
            logger.info(`Exported ${name}`);
        }

        // Erstelle ZIP-Archiv
        const zip = new AdmZip();
        zip.addLocalFolder(tempDir);
        const zipPath = path.join(BACKUP_DIR, `backup_${timestamp}.zip`);
        zip.writeZip(zipPath);
        logger.info(`Backup created: ${zipPath}`);

        // Räume auf
        fs.rmSync(tempDir, { recursive: true });
    } catch (error) {
        logger.error('Backup failed: ' + getErrorMessage(error));
        throw error;
    }
}

/**
 * Erstellt ein SQL-Backup der Datenbank
 */
async function createSqlBackup(timestamp: string, logger: Logger) {
    const { exec } = require('child_process');
    const filename = path.join(BACKUP_DIR, `dump_${timestamp}.sql`);
    const dbConfig = getDatabaseConfig(dataSource.options);
    const command = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -F p > ${filename}`;
    
    return new Promise<string>((resolve, reject) => {
        exec(command, (error: Error | null) => {
            if (error) {
                logger.error('SQL dump failed: ' + error.message);
                reject(error);
                return;
            }
            logger.info(`SQL backup created: ${filename}`);
            resolve(filename);
        });
    });
}

/**
 * Stellt ein Backup wieder her
 */
async function restoreBackup(filePath: string, logger: Logger) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Backup file not found: ${filePath}`);
        }

        if (path.extname(filePath) === '.sql') {
            await restoreSqlBackup(filePath, logger);
            return;
        }

        // Entpacke ZIP-Archiv
        const tempDir = path.join(BACKUP_DIR, 'temp_restore');
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
        fs.mkdirSync(tempDir, { recursive: true });
        
        logger.info(`Extracting backup from ${filePath}`);
        const zip = new AdmZip(filePath);
        zip.extractAllTo(tempDir, true);

        // Überprüfe die extrahierten Dateien
        const files = fs.readdirSync(tempDir);
        logger.info(`Found ${files.length} files in backup`);

        try {
            // Lösche bestehende Daten mit CASCADE
            logger.info('Clearing existing data...');
            await dataSource.query('TRUNCATE TABLE "user_deck", "rating", "participation", "deck", "game", "user" CASCADE');

            // Stelle Daten in der richtigen Reihenfolge wieder her
            const entityOrder = [
                { filename: 'users.csv', entity: User },
                { filename: 'games.csv', entity: Game },
                { filename: 'decks.csv', entity: Deck },
                { filename: 'participations.csv', entity: Participation },
                { filename: 'ratings.csv', entity: Rating },
                { filename: 'user_decks.csv', entity: User_deck }
            ];

            for (const { filename, entity } of entityOrder) {
                const csvPath = path.join(tempDir, filename);
                if (fs.existsSync(csvPath)) {
                    logger.info(`Restoring ${filename}`);
                    const content = fs.readFileSync(csvPath, 'utf-8');
                    const { data } = parse<CSVRecord>(content, { header: true });
                    if (Array.isArray(data) && data.length > 0) {
                        const repository = dataSource.getRepository(entity);
                        const metadata = repository.metadata;
                        
                        // Konvertiere die Daten in Entity-Instanzen
                        const entities = data.map(item => {
                            // Erstelle eine neue Instanz der Entity
                            const instance = new entity();
                            
                            // Konvertiere und setze die Werte
                            for (const key in item) {
                                const value = item[key];
                                const column = metadata.findColumnWithPropertyName(key);
                                
                                if (column) {
                                    // Konvertiere den Wert basierend auf dem Spaltentyp
                                    if (value === 'null' || value === '') {
                                        instance[key] = null;
                                    } else if (column.type === Number || column.type === 'int' || column.type === 'integer') {
                                        instance[key] = Number(value);
                                    } else if (column.type === Boolean) {
                                        instance[key] = value === 'true';
                                    } else if (column.type === Date) {
                                        instance[key] = value ? new Date(value) : null;
                                    } else if (column.type === 'enum') {
                                        instance[key] = value;
                                    } else {
                                        instance[key] = value;
                                    }
                                }
                            }
                            return instance;
                        });

                        // Speichere die Entities in Batches
                        const batchSize = 50;
                        for (let i = 0; i < entities.length; i += batchSize) {
                            const batch = entities.slice(i, i + batchSize);
                            try {
                                await repository.save(batch);
                                logger.info(`Restored batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(entities.length / batchSize)} for ${filename}`);
                            } catch (error) {
                                logger.error(`Error restoring batch: ${getErrorMessage(error)}`);
                                throw error;
                            }
                        }
                        
                        logger.info(`Successfully restored ${data.length} records from ${filename}`);
                    }
                } else {
                    logger.warn(`File ${filename} not found in backup`);
                }
            }

            logger.info('Restore completed successfully');
        } finally {
            // Räume auf
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true });
            }
        }
    } catch (error) {
        logger.error('Restore failed: ' + getErrorMessage(error));
        throw error;
    }
}

/**
 * Stellt ein SQL-Backup wieder her
 */
async function restoreSqlBackup(filePath: string, logger: Logger) {
    const { exec } = require('child_process');
    const dbConfig = getDatabaseConfig(dataSource.options);
    const command = `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} < ${filePath}`;
    
    return new Promise<void>((resolve, reject) => {
        exec(command, (error: Error | null) => {
            if (error) {
                logger.error('SQL restore failed: ' + error.message);
                reject(error);
                return;
            }
            logger.info('SQL restore completed successfully');
            resolve();
        });
    });
}