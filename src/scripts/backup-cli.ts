#!/usr/bin/env node

/**
 * MTG Tierlist Backup CLI Tool
 * 
 * Dieses Command-Line-Interface (CLI) Tool ermöglicht das Erstellen und Wiederherstellen
 * von Datenbank-Backups für die MTG Tierlist Anwendung. Es bietet folgende Funktionen:
 * 
 * - Manuelles Erstellen von Backups (CSV oder SQL)
 * - Wiederherstellen von Backups
 * - Planen automatischer Backups
 * - Automatisches Löschen alter Backups
 */

import * as fs from 'fs';                   // Für Dateisystemoperationen
import * as FormData from 'form-data';      // Für das Hochladen von Dateien
import fetch from 'node-fetch';             // Für HTTP-Anfragen
import { Readable } from 'stream';          // Für Stream-Verarbeitung
import * as path from 'path';               // Für Pfadmanipulation
import { Command } from 'commander';         // Für die CLI-Befehlsverarbeitung
import * as cron from 'node-cron';          // Für geplante Backups

// API-URL für den Backend-Server, kann über Umgebungsvariable überschrieben werden
const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';
// Pfad zum Backup-Verzeichnis, relativ zum Skript-Verzeichnis
const BACKUP_DIR = path.join(__dirname, '../backups');
// Erstelle eine neue Command-Instanz für die CLI-Befehle
const program = new Command();

/**
 * Interface für die Backup-Optionen
 * @property type - Art des Backups (CSV oder SQL)
 * @property interval - Cron-Ausdruck für geplante Backups
 */
interface BackupOptions {
  type?: 'csv' | 'sql';     // Art des Backups
  interval?: string;        // Zeitplan für automatische Backups
}

// Stelle sicher, dass das Backup-Verzeichnis existiert
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Lädt ein Backup von der API herunter und speichert es lokal
 * @param type - Art des Backups ('csv' oder 'sql')
 * @returns Promise mit dem Pfad zur gespeicherten Backup-Datei
 */
async function downloadBackup(type: BackupOptions['type'] = 'csv') {
  // Erstelle einen Zeitstempel für den Dateinamen
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  // Wähle den richtigen API-Endpunkt je nach Backup-Typ
  const endpoint = type === 'sql' ? '/backup/sql-dump' : '/backup/export';
  // Wähle die richtige Dateiendung je nach Backup-Typ
  const extension = type === 'sql' ? 'sql' : 'zip';
  
  try {
    // Lade das Backup von der API herunter
    const response = await fetch(`${API_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const filePath = path.join(BACKUP_DIR, `backup_${timestamp}.${extension}`);
    const fileStream = fs.createWriteStream(filePath);
    
    await new Promise((resolve, reject) => {
      // Konvertiere den Response body in einen Readable Stream
      const responseBody = Readable.fromWeb(response.body as any);
      responseBody.pipe(fileStream);
      fileStream.on('finish', () => {
        console.log(`Backup saved to ${filePath}`);
        resolve(filePath);
      });
      fileStream.on('error', reject);
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Backup failed:', error.message);
    } else {
      console.error('Backup failed with unknown error');
    }
    throw error;
  }
}

/**
 * Stellt ein Backup wieder her, indem es die Backup-Datei an die API sendet
 * @param filePath - Pfad zur lokalen Backup-Datei
 */
async function restoreBackup(filePath: string) {
  try {
    // Erstelle ein FormData-Objekt für den Datei-Upload
    const formData = new FormData();
    // Füge die Backup-Datei dem FormData hinzu
    formData.append('backup', fs.createReadStream(filePath));

    // Sende die Datei an den Import-Endpunkt
    const response = await fetch(`${API_URL}/backup/import`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders() // Füge die notwendigen Headers für Multipart-Formulardaten hinzu
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Restore completed successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Restore failed:', error.message);
    } else {
      console.error('Restore failed with unknown error');
    }
    throw error;
  }
}

// Konfiguration der CLI-Befehle
program
  .version('1.0.0')
  .description('MTG Tierlist Database Backup Tool');

// Befehl zum Erstellen eines Backups
program
  .command('backup')
  .description('Create a backup of the database')
  // Option für den Backup-Typ (standardmäßig CSV)
  .option('-t, --type <type>', 'backup type (csv or sql)', 'csv')
  // Handler für den Backup-Befehl
  .action(async (options: BackupOptions) => {
    try {
      await downloadBackup(options.type);
    } catch (error: unknown) {
      process.exit(1);
    }
  });

program
  .command('restore <file>')
  .description('Restore database from a backup file')
  .action(async file => {
    try {
      await restoreBackup(file);
    } catch (error: unknown) {
      process.exit(1);
    }
  });

// Befehl zum Einrichten automatischer Backups
program
  .command('schedule')
  .description('Schedule automatic backups')
  // Option für den Backup-Zeitplan (Standard: täglich um Mitternacht)
  .option('-i, --interval <cron>', 'cron schedule expression', '0 0 * * *')
  // Option für den Backup-Typ (Standard: CSV)
  .option('-t, --type <type>', 'backup type (csv or sql)', 'csv')
  // Handler für den Schedule-Befehl
  .action(options => {
    console.log(`Scheduling automatic backups with cron: ${options.interval}`);
    
    cron.schedule(options.interval, async () => {
      try {
        await downloadBackup(options.type);
        // Optional: Lösche alte Backups
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 Tage
        const files = fs.readdirSync(BACKUP_DIR);
        
        for (const file of files) {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filePath);
          
          if (Date.now() - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`Deleted old backup: ${file}`);
          }
        }
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    });
    
    // Halte den Prozess am Laufen
    process.stdin.resume();
  });

program.parse(process.argv);