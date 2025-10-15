import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGameCreatedAt1758657200000 implements MigrationInterface {
    name = 'AddGameCreatedAt1758657200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Prüfe ob die game Tabelle existiert
        const gameTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'game'
            );
        `);

        // Wenn die Tabelle nicht existiert, überspringe diese Migration
        if (!gameTableExists[0].exists) {
            console.log('Game table does not exist yet, skipping AddGameCreatedAt migration');
            return;
        }

        // Prüfe ob die Spalte bereits existiert
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'game' 
                AND column_name = 'createdAt'
            );
        `);
        
        // Füge die createdAt-Spalte nur hinzu wenn sie nicht existiert
        if (!columnExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "game" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Entferne die createdAt-Spalte
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN IF EXISTS "createdAt"`);
    }
}