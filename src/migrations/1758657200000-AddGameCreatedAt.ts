import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGameCreatedAt1758657200000 implements MigrationInterface {
    name = 'AddGameCreatedAt1758657200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Füge die createdAt-Spalte zur game-Tabelle hinzu
        await queryRunner.query(`ALTER TABLE "game" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Entferne die createdAt-Spalte
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "createdAt"`);
    }
}