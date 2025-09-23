import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTableRelations1758657600000 implements MigrationInterface {
    name = 'UpdateTableRelations1758657600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Participation tabelle aktualisieren
        await queryRunner.query(`
            DO $$ 
            BEGIN
                -- Participation Tabelle neu erstellen
                DROP TABLE IF EXISTS "participation" CASCADE;
                CREATE TABLE "participation" (
                    "id" SERIAL PRIMARY KEY,
                    "is_winner" boolean NOT NULL DEFAULT false,
                    "game_id" integer,
                    "user_deck_id" integer,
                    CONSTRAINT "fk_game" FOREIGN KEY ("game_id") REFERENCES "game"("id"),
                    CONSTRAINT "fk_user_deck" FOREIGN KEY ("user_deck_id") REFERENCES "user_deck"("id")
                );

                -- Rating Tabelle neu erstellen
                DROP TABLE IF EXISTS "rating" CASCADE;
                CREATE TABLE "rating" (
                    "id" SERIAL PRIMARY KEY,
                    "value" integer NOT NULL,
                    "participation_id" integer,
                    "rater_id" integer,
                    CONSTRAINT "fk_participation" FOREIGN KEY ("participation_id") REFERENCES "participation"("id"),
                    CONSTRAINT "fk_rater" FOREIGN KEY ("rater_id") REFERENCES "user"("id"),
                    CONSTRAINT "uq_participation_rater" UNIQUE ("participation_id", "rater_id")
                );

                -- Indizes für bessere Performance
                CREATE INDEX "idx_participation_game" ON "participation"("game_id");
                CREATE INDEX "idx_participation_user_deck" ON "participation"("user_deck_id");
                CREATE INDEX "idx_rating_participation" ON "rating"("participation_id");
                CREATE INDEX "idx_rating_rater" ON "rating"("rater_id");
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "rating" CASCADE;
            DROP TABLE IF EXISTS "participation" CASCADE;
        `);
    }
}