import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserDeckTable1758657700000 implements MigrationInterface {
    name = 'UpdateUserDeckTable1758657700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Entferne die bestehende user_deck Tabelle
        await queryRunner.query(`
            DROP TABLE IF EXISTS "user_deck" CASCADE;
        `);

        // Erstelle die neue user_deck Tabelle mit den korrekten Relationen
        await queryRunner.query(`
            CREATE TABLE "user_deck" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "deck_id" integer NOT NULL,
                CONSTRAINT "PK_user_deck" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_user_deck_user_deck" UNIQUE ("user_id", "deck_id"),
                CONSTRAINT "FK_user_deck_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_user_deck_deck" FOREIGN KEY ("deck_id") REFERENCES "deck"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Erstelle Indizes für bessere Performance
        await queryRunner.query(`
            CREATE INDEX "IDX_user_deck_user_id" ON "user_deck" ("user_id");
            CREATE INDEX "IDX_user_deck_deck_id" ON "user_deck" ("deck_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Entferne die Indizes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_user_deck_user_id";
            DROP INDEX IF EXISTS "IDX_user_deck_deck_id";
        `);

        // Entferne die Tabelle
        await queryRunner.query(`
            DROP TABLE IF EXISTS "user_deck" CASCADE;
        `);
    }
}