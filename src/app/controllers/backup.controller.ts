/**
 * Dieses Modul implementiert die Backup- und Wiederherstellungsfunktionen für die MTG Tierlist Datenbank.
 * Es ermöglicht das Exportieren der Datenbank als CSV-Dateien oder SQL-Dump sowie das Importieren
 * von zuvor erstellten Backups.
 */

import { Context, Get, HttpResponseBadRequest, HttpResponseOK, Post, dependency } from '@foal/core';
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

/**
 * Controller-Klasse für die Verwaltung von Datenbank-Backups
 * Stellt Endpunkte für Export und Import von Datenbank-Backups bereit
 */
export class BackupController {
  // Verzeichnis, in dem die Backup-Dateien gespeichert werden
  private readonly BACKUP_DIR = 'backups';
  
  // Die DataSource-Instanz für Datenbankoperationen
  @dependency
  private dataSource: DataSource;

  /**
   * Exportiert alle Daten aus der Datenbank als ZIP-Archiv von CSV-Dateien
   * Endpunkt: GET /export
   * @param ctx Der Anfrage-Kontext
   * @returns Eine ZIP-Datei mit CSV-Exporten aller Datenbanktabellen
   */
  @Get('/export')
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

      // Definition aller Entitäten (Datenbanktabellen), die gesichert werden sollen
      // Die Reihenfolge ist wichtig für die spätere Wiederherstellung wegen Fremdschlüsselabhängigkeiten
      const entities = [
        { name: 'users', repo: this.dataSource.getRepository(User) },           // Benutzertabelle
        { name: 'games', repo: this.dataSource.getRepository(Game) },           // Spieltabelle
        { name: 'decks', repo: this.dataSource.getRepository(Deck) },           // Decks-Tabelle
        { name: 'ratings', repo: this.dataSource.getRepository(Rating) },       // Bewertungstabelle
        { name: 'participations', repo: this.dataSource.getRepository(Participation) }, // Teilnahmetabelle
        { name: 'user_decks', repo: this.dataSource.getRepository(User_deck) }  // Benutzer-Deck-Zuordnungstabelle
      ];

      // Exportiere jede Tabelle als separate CSV-Datei
      for (const entity of entities) {
        // Hole alle Datensätze aus der jeweiligen Tabelle
        const data = await entity.repo.find();
        // Konvertiere die komplexen Entity-Objekte in einfache JSON-Objekte
        // Dies ist notwendig, da die Entity-Objekte Methoden und Beziehungen enthalten,
        // die nicht in CSV gespeichert werden können
        const plainData = data.map(item => {
          const obj: Record<string, any> = {};
          for (const [key, value] of Object.entries(item)) {
            if (typeof value !== 'object' || value === null) {
              obj[key] = value;
            }
          }
          return obj;
        });
        const csv = Papa.unparse(plainData);
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
   * Erwartet eine ZIP-Datei mit CSV-Dateien im Request
   * @param ctx Der Anfrage-Kontext mit der hochgeladenen Backup-Datei
   * @returns Eine Erfolgsmeldung nach erfolgreicher Wiederherstellung
   */
  @Post('/import')
  async importData(ctx: Context) {
    try {
      // Prüfe, ob eine Backup-Datei im Request vorhanden ist
      const files = ctx.request.files;
      if (!files || !files.backup) {
        return new HttpResponseBadRequest('No backup file provided');
      }

      // Erstelle ein temporäres Verzeichnis für das Entpacken des Backups
      const backupFile = files.backup;
      const tempDir = path.join(this.BACKUP_DIR, 'temp_import');
      
      // Extrahiere ZIP mit adm-zip
      const zip = new AdmZip(backupFile.path);
      zip.extractAllTo(tempDir, true); // true überschreibt existierende Dateien

      // Importiere jede CSV-Datei
      const entityMap = {
        'users.csv': User,
        'games.csv': Game,
        'decks.csv': Deck,
        'ratings.csv': Rating,
        'participations.csv': Participation,
        'user_decks.csv': User_deck
      };

      // Lösche bestehende Daten in umgekehrter Reihenfolge der Abhängigkeiten
      await this.dataSource.getRepository(User_deck).clear();
      await this.dataSource.getRepository(Rating).clear();
      await this.dataSource.getRepository(Participation).clear();
      await this.dataSource.getRepository(Deck).clear();
      await this.dataSource.getRepository(Game).clear();
      await this.dataSource.getRepository(User).clear();

      // Importiere Daten in der richtigen Reihenfolge
      for (const [filename, Entity] of Object.entries(entityMap)) {
        const filePath = path.join(tempDir, filename);
        if (fs.existsSync(filePath)) {
          const csvContent = fs.readFileSync(filePath, 'utf-8');
          const { data } = Papa.parse(csvContent, { header: true });
          // Typ-Sicherheit für die importierten Daten
          const typedData = (data as Record<string, string>[]).map(item => {
            // Konvertiere Strings in die richtigen Typen
            const typedItem: Record<string, any> = {};
            for (const [key, value] of Object.entries(item)) {
              if (typeof value === 'string' && !isNaN(Number(value))) {
                typedItem[key] = Number(value);
              } else {
                typedItem[key] = value;
              }
            }
            return typedItem;
          });
          await this.dataSource.getRepository(Entity).save(typedData);
        }
      }

      // Aufräumen
      fs.rmSync(tempDir, { recursive: true });

      return new HttpResponseOK({ message: 'Import successful' });

    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
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