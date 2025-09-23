import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateParticipationTable1758657700001 implements MigrationInterface {
    name = 'UpdateParticipationTable1758657700001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Entferne die bestehende participation Tabelle
        await queryRunner.query(`
            DROP TABLE IF EXISTS "participation" CASCADE;
        `);

        // Erstelle die neue participation Tabelle
        await queryRunner.query(`
            CREATE TABLE "participation" (
                "id" SERIAL NOT NULL,
                "is_winner" boolean NOT NULL DEFAULT false,
                "game_id" integer NOT NULL,
                "user_deck_id" integer NOT NULL,
                CONSTRAINT "PK_participation" PRIMARY KEY ("id"),
                CONSTRAINT "FK_participation_game" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_participation_user_deck" FOREIGN KEY ("user_deck_id") REFERENCES "user_deck"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Erstelle Indizes für bessere Performance
        await queryRunner.query(`
            CREATE INDEX "IDX_participation_game_id" ON "participation" ("game_id");
            CREATE INDEX "IDX_participation_user_deck" ON "participation" ("user_deck_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Entferne die Indizes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_participation_game_id";
            DROP INDEX IF EXISTS "IDX_participation_user_deck";
        `);

        // Entferne die Tabelle
        await queryRunner.query(`
            DROP TABLE IF EXISTS "participation" CASCADE;
        `);
    }
}