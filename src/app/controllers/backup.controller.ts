/**
 * Dieses Modul implementiert die Backup- und Wiederherstellungsfunktionen für die MTG Tierlist Datenbank.
 * Es ermöglicht das Exportieren der Datenbank als CSV-Dateien oder SQL-Dump sowie das Importieren
 * von zuvor erstellten Backups.
 */

import { Context, Get, HttpResponseBadRequest, HttpResponseOK, Post, dependency, UserRequired, UseSessions } from '@foal/core';
import { ParseAndValidateFiles } from '@foal/storage';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
// Import der Entity-Definitionen für alle Datenbanktabellen
import { User } from '../entities/user.entity';
import { Game } from '../entities/game.entity';
import { Deck } from '../entities/deck.entity';
import { Rating } from '../entities/rating_participation.entity';
import { Participation } from '../entities/participation.entity';
import { User_deck } from '../entities/user_deck.entity';
// Import der benötigten Hilfsbibliotheken
import * as Papa from 'papaparse';          // Für CSV-Verarbeitung
import * as fs from 'fs';                   // Für Dateisystemoperationen
import * as path from 'path';               // Für Pfadmanipulation
import * as AdmZip from 'adm-zip';          // Für ZIP-Operationen
// Import der eigenen Hooks
import { AdminRequired } from '../hooks';

/**
 * Controller-Klasse für die Verwaltung von Datenbank-Backups
 * Stellt Endpunkte für Export und Import von Datenbank-Backups bereit
 * Nur für authentifizierte Admin-Benutzer zugänglich
 */
@UseSessions()
@UserRequired()
export class BackupController {
  // Verzeichnis, in dem die Backup-Dateien gespeichert werden
  private readonly BACKUP_DIR = 'backups';
  
  // Die DataSource-Instanz für Datenbankoperationen
  @dependency
  private dataSource: DataSource;

  /**
   * Exportiert alle Daten aus der Datenbank als ZIP-Archiv von CSV-Dateien
   * Endpunkt: GET /export
   * Nur für Admin-Benutzer zugänglich
   * @param ctx Der Anfrage-Kontext
   * @returns Eine ZIP-Datei mit CSV-Exporten aller Datenbanktabellen
   */
  @Get('/export')
  @AdminRequired()
  async exportData(ctx: Context) {
    try {
      // Erstelle das Backup-Verzeichnis, falls es noch nicht existiert
      // Dies verhindert Fehler beim ersten Backup-Versuch
      if (!fs.existsSync(this.BACKUP_DIR)) {
        fs.mkdirSync(this.BACKUP_DIR);
      }

      // Erstelle einen Zeitstempel für den Backup-Namen
      // Ersetze : und . durch - um gültige Dateinamen zu gewährleisten
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      // Erstelle einen temporären Ordner für die CSV-Dateien
      const backupPath = path.join(this.BACKUP_DIR, `backup_${timestamp}`);
      fs.mkdirSync(backupPath);

      // Definition aller Entitäten mit ihren Relations für vollständigen Export
      // Die Reihenfolge ist wichtig für die spätere Wiederherstellung wegen Fremdschlüsselabhängigkeiten
      const entities = [
        { 
          name: 'users', 
          repo: this.dataSource.getRepository(User),
          relations: [] // Users haben keine Foreign Keys
        },
        { 
          name: 'games', 
          repo: this.dataSource.getRepository(Game),
          relations: [] // Games haben keine Foreign Keys
        },
        { 
          name: 'decks', 
          repo: this.dataSource.getRepository(Deck),
          relations: ['owner'] // Deck hat owner (User)
        },
        { 
          name: 'user_decks', 
          repo: this.dataSource.getRepository(User_deck),
          relations: ['user', 'deck'] // User_deck hat user und deck
        },
        { 
          name: 'participations', 
          repo: this.dataSource.getRepository(Participation),
          relations: ['game', 'user_deck'] // Participation hat game und user_deck
        },
        { 
          name: 'ratings', 
          repo: this.dataSource.getRepository(Rating),
          relations: ['participation', 'rater'] // Rating hat participation und rater (User)
        }
      ];

      // Exportiere jede Tabelle als separate CSV-Datei
      for (const entity of entities) {
        console.log(`📄 Exporting ${entity.name}...`);
        
        // Verwende rohe SQL-Query für direkten Zugriff auf die Tabellendaten
        let rawData: any[];
        
        if (entity.name === 'user_decks') {
          // Für user_decks holen wir die Foreign Key IDs direkt
          rawData = await this.dataSource.query('SELECT * FROM "user_deck"');
        } else if (entity.name === 'participations') {
          rawData = await this.dataSource.query('SELECT * FROM "participation"');
        } else if (entity.name === 'ratings') {
          rawData = await this.dataSource.query('SELECT * FROM "rating"');
        } else if (entity.name === 'decks') {
          rawData = await this.dataSource.query('SELECT * FROM "deck"');
        } else {
          // Für einfache Tabellen ohne Foreign Keys
          rawData = await this.dataSource.query(`SELECT * FROM "${entity.name === 'users' ? 'user' : entity.name === 'games' ? 'game' : entity.name}"`);
        }
        
        console.log(`✅ Found ${rawData.length} records for ${entity.name}`);
        if (rawData.length > 0) {
          console.log('🔍 Sample data:', JSON.stringify(rawData[0], null, 2));
        }
        
        const csv = Papa.unparse(rawData);
        fs.writeFileSync(path.join(backupPath, `${entity.name}.csv`), csv);
      }

      // Erstelle ZIP-Archiv mit adm-zip
      const zip = new AdmZip();
      
      // Füge alle Dateien aus dem temporären Verzeichnis zum ZIP hinzu
      zip.addLocalFolder(backupPath);
      
      // Speichere das ZIP-Archiv
      const zipPath = `${backupPath}.zip`;
      zip.writeZip(zipPath);
      
      // Lösche temporäres Verzeichnis nach ZIP-Erstellung
      fs.rmSync(backupPath, { recursive: true });

      // Sende ZIP-Datei
      const zipContent = fs.readFileSync(zipPath);
      fs.unlinkSync(zipPath); // Lösche die temporäre ZIP-Datei
      
      const response = new HttpResponseOK(zipContent);
      response.setHeader('Content-Type', 'application/zip');
      response.setHeader('Content-Disposition', `attachment; filename="backup_${timestamp}.zip"`);
      return response;

    } catch (error) {
      console.error('Backup error:', error);
      throw error;
    }
  }

  /**
   * Importiert Daten aus einem zuvor erstellten Backup
   * Endpunkt: POST /import
   * Nur für Admin-Benutzer zugänglich
   * Erwartet eine ZIP-Datei mit CSV-Dateien im Request
   * @param ctx Der Anfrage-Kontext mit der hochgeladenen Backup-Datei
   * @returns Eine Erfolgsmeldung nach erfolgreicher Wiederherstellung
   */
  @Post('/import')
  @AdminRequired()
  @ParseAndValidateFiles({
    backupFile: { required: true, saveTo: 'uploads' }
  })
  async importData(ctx: Context): Promise<HttpResponseOK | HttpResponseBadRequest> {
    try {
      console.log('📁 Starting file upload processing with FoalTS storage...');

      // Mit @foal/storage ist die Datei jetzt verfügbar unter ctx.files.get('backupFile')
      const backupFiles = ctx.files.get('backupFile');
      console.log('📁 Backup files array:', backupFiles);

      if (!backupFiles || backupFiles.length === 0) {
        console.log('❌ No backup file provided');
        return new HttpResponseBadRequest({
          message: 'No backup file provided. Make sure to use form-data with key "backupFile"'
        });
      }

      // FoalTS Storage gibt uns ein Array von File-Objekten, wir nehmen das erste
      const backupFile = backupFiles[0];
      console.log('📁 Full backup file object:', JSON.stringify(backupFile, null, 2));
      
      let filePath = backupFile.path;
      let shouldCleanupTempFile = false;

      console.log('📁 Initial file path from FoalTS:', filePath);

      // FoalTS gibt bereits den vollständigen Pfad zurück (z.B. "uploads/filename.zip")
      // Wir müssen nichts hinzufügen!
      
      // Fallback: Falls kein path vorhanden ist, aber ein buffer, erstelle eine temporäre Datei
      if (!filePath && backupFile.buffer) {
        console.log('📁 No file path, but buffer available. Creating temp file...');
        
        // Erstelle temporäre Datei aus dem Buffer im uploads-Verzeichnis
        const tempFileName = `uploads/temp_backup_${Date.now()}.zip`;
        filePath = tempFileName;
        
        // Stelle sicher, dass das uploads-Verzeichnis existiert
        if (!fs.existsSync('uploads')) {
          fs.mkdirSync('uploads');
        }
        
        fs.writeFileSync(filePath, backupFile.buffer);
        shouldCleanupTempFile = true;
        
        console.log('📁 Created temp file at:', filePath);
      }

      console.log('📁 Processing file at path:', filePath);
      console.log('📁 File exists:', fs.existsSync(filePath));

      if (!filePath || !fs.existsSync(filePath)) {
        return new HttpResponseBadRequest({
          message: 'File path not found or file does not exist'
        });
      }

      // Verarbeite das Backup
      await this.processBackupImport(filePath);
      
      // Cleanup der temporären Datei
      try {
        if (shouldCleanupTempFile && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🧹 Cleaned up temporary file:', filePath);
        }
      } catch (cleanupError) {
        console.warn('⚠️ Could not cleanup file:', cleanupError);
      }
      
      return new HttpResponseOK({ 
        message: 'Import successful',
        fileName: backupFile.filename || 'backup.zip'
      });

    } catch (error) {
      console.error('❌ Import error:', error);
      return new HttpResponseBadRequest({
        message: 'Import failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Verarbeitet die eigentliche Backup-Import-Logik
   * @param zipFilePath Pfad zur hochgeladenen ZIP-Datei
   */
  private async processBackupImport(zipFilePath: string): Promise<void> {
    console.log('🔄 Processing backup import from:', zipFilePath);
    
    // Verwende ein temporäres Import-Verzeichnis im aktuellen Arbeitsverzeichnis
    // Nicht das BACKUP_DIR verwenden, da zipFilePath bereits von FoalTS kommt
    const tempDir = 'temp_import';
    
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir);

    // Extrahiere ZIP mit adm-zip
    console.log('📦 Extracting ZIP file...');
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(tempDir, true);

    // Importiere jede CSV-Datei in der KORREKTEN Abhängigkeitsreihenfolge
    // Zuerst die Basis-Tabellen ohne Fremdschlüssel, dann die abhängigen Tabellen
    const entityMap = [
      { filename: 'users.csv', Entity: User },           // Basis: Keine Abhängigkeiten
      { filename: 'games.csv', Entity: Game },           // Basis: Keine Abhängigkeiten  
      { filename: 'decks.csv', Entity: Deck },           // Basis: Keine Abhängigkeiten
      { filename: 'user_decks.csv', Entity: User_deck }, // Abhängig von: User, Deck
      { filename: 'participations.csv', Entity: Participation }, // Abhängig von: Game, User_deck
      { filename: 'ratings.csv', Entity: Rating }        // Abhängig von: Participation, User (als rater)
    ];

    console.log('🗑️ Clearing existing data...');
    // Deaktiviere Foreign Key Constraints temporär und lösche alle Daten
    await this.dataSource.query('SET session_replication_role = replica;');
    
    // Lösche alle Daten aus allen Tabellen
    await this.dataSource.query('TRUNCATE TABLE "rating" CASCADE;');
    await this.dataSource.query('TRUNCATE TABLE "participation" CASCADE;');
    await this.dataSource.query('TRUNCATE TABLE "user_deck" CASCADE;');
    await this.dataSource.query('TRUNCATE TABLE "deck" CASCADE;');
    await this.dataSource.query('TRUNCATE TABLE "game" CASCADE;');
    await this.dataSource.query('TRUNCATE TABLE "user" CASCADE;');
    
    // Reaktiviere Foreign Key Constraints
    await this.dataSource.query('SET session_replication_role = DEFAULT;');

    console.log('📥 Importing data...');
    // Importiere Daten in der richtigen Reihenfolge
    for (const { filename, Entity } of entityMap) {
      const filePath = path.join(tempDir, filename);
      if (fs.existsSync(filePath)) {
        console.log(`📄 Processing ${filename}...`);
        const csvContent = fs.readFileSync(filePath, 'utf-8');
        const { data } = Papa.parse(csvContent, { header: true });
        
        // Typ-Sicherheit für die importierten Daten
        const typedData = (data as Record<string, string>[]).map(item => {
          const typedItem: Record<string, any> = {};
          for (const [key, value] of Object.entries(item)) {
            // Behandle Foreign Key Spalten speziell
            if (key === 'userId' && value && value.trim() !== '') {
              typedItem['user'] = { id: Number(value) };
            } else if (key === 'deckId' && value && value.trim() !== '') {
              typedItem['deck'] = { id: Number(value) };
            } else if (key === 'gameId' && value && value.trim() !== '') {
              typedItem['game'] = { id: Number(value) };
            } else if (key === 'userDeckId' && value && value.trim() !== '') {
              typedItem['user_deck'] = { id: Number(value) };
            } else if (key === 'participationId' && value && value.trim() !== '') {
              typedItem['participation'] = { id: Number(value) };
            } else if (key === 'raterId' && value && value.trim() !== '') {
              typedItem['rater'] = { id: Number(value) };
            } else if (key === 'ownerId' && value && value.trim() !== '') {
              typedItem['owner'] = { id: Number(value) };
            } else if (key === 'id' && value && value.trim() !== '') {
              // Behalte Original-IDs bei um Foreign Key Konsistenz zu gewährleisten
              typedItem[key] = Number(value);
            } else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
              // Normale numerische Werte
              typedItem[key] = Number(value);
            } else {
              // String-Werte oder NULL
              typedItem[key] = value === '' ? null : value;
            }
          }
          return typedItem;
        });
        
        if (typedData.length > 0) {
          // Verwende rohe SQL INSERT um Original-IDs beizubehalten
          if (filename === 'users.csv') {
            for (const item of typedData) {
              await this.dataSource.query(
                'INSERT INTO "user"(id, email, password, name, role) VALUES ($1, $2, $3, $4, $5)',
                [item.id, item.email, item.password, item.name, item.role]
              );
            }
          } else if (filename === 'games.csv') {
            for (const item of typedData) {
              await this.dataSource.query(
                'INSERT INTO "game"(id, "createdAt") VALUES ($1, $2)',
                [item.id, item.createdAt]
              );
            }
          } else if (filename === 'decks.csv') {
            for (const item of typedData) {
              await this.dataSource.query(
                'INSERT INTO "deck"(id, commander, thema, gameplan, tempo, tier, weaknesses, "ownerId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [item.id, item.commander, item.thema, item.gameplan, item.tempo, item.tier, item.weaknesses, item.owner?.id]
              );
            }
          } else if (filename === 'user_decks.csv') {
            for (const item of typedData) {
              await this.dataSource.query(
                'INSERT INTO "user_deck"(id, "userId", "deckId") VALUES ($1, $2, $3)',
                [item.id, item.user?.id, item.deck?.id]
              );
            }
          } else if (filename === 'participations.csv') {
            for (const item of typedData) {
              await this.dataSource.query(
                'INSERT INTO "participation"(id, is_winner, "gameId", "userDeckId") VALUES ($1, $2, $3, $4)',
                [item.id, item.is_winner, item.game?.id, item.user_deck?.id]
              );
            }
          } else if (filename === 'ratings.csv') {
            for (const item of typedData) {
              await this.dataSource.query(
                'INSERT INTO "rating"(id, value, "participationId", "raterId") VALUES ($1, $2, $3, $4)',
                [item.id, item.value, item.participation?.id, item.rater?.id]
              );
            }
          } else {
            // Fallback für unbekannte Tabellen
            await this.dataSource.getRepository(Entity).save(typedData);
          }
          console.log(`✅ Imported ${typedData.length} records from ${filename}`);
        }
      } else {
        console.log(`⚠️ File not found: ${filename}`);
      }
    }

    // Aufräumen
    console.log('🧹 Cleaning up temporary files...');
    fs.rmSync(tempDir, { recursive: true });
    
    console.log('🎉 Import completed successfully!');
  }

  /**
   * Generiert einen SQL-Dump der gesamten Datenbank
   * Endpunkt: GET /sql-dump
   * Nutzt das PostgreSQL-Tool pg_dump für ein vollständiges Backup
   * @param ctx Der Anfrage-Kontext
   * @returns Eine SQL-Datei mit dem kompletten Datenbank-Dump
   */
  @Get('/sql-dump')
  async generateSqlDump(ctx: Context) {
    try {
      // Erstelle einen Zeitstempel für den Dateinamen
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `dump_${timestamp}.sql`;
      
      // Verwende pg_dump für PostgreSQL
      // pg_dump ist ein PostgreSQL-Kommandozeilentool für Datenbank-Backups
      const { exec } = require('child_process');
      
      // Hole die Datenbankkonfiguration aus der DataSource
      const options = this.dataSource.options as PostgresConnectionOptions;
      const dbConfig = {
        host: options.host || 'localhost',
        port: options.port || 5432,
        database: options.database || 'mtgtierlist',
        user: options.username || 'postgres',
        password: options.password || ''
      };

      const dumpCommand = `PGPASSWORD="${dbConfig.password.toString()}" pg_dump -h ${dbConfig.host.toString()} -p ${dbConfig.port.toString()} -U ${dbConfig.user.toString()} -d ${dbConfig.database.toString()} -F p > ${filename}`;
      
      exec(dumpCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('SQL dump error:', error);
          throw error;
        }
      });

      // Warte bis die Datei erstellt wurde
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Sende SQL-Datei
      const sqlContent = fs.readFileSync(filename);
      fs.unlinkSync(filename); // Lösche temporäre Datei

      const response = new HttpResponseOK(sqlContent);
      response.setHeader('Content-Type', 'application/sql');
      response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return response;

    } catch (error) {
      console.error('SQL dump error:', error);
      throw error;
    }
  }
}