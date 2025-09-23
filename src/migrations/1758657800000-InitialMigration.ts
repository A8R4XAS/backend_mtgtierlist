import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1758657800000 implements MigrationInterface {
    name = 'InitialMigration1758657800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // User Tabelle
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL PRIMARY KEY,
                "username" character varying NOT NULL,
                "password" character varying NOT NULL,
                "email" character varying NOT NULL,
                CONSTRAINT "UQ_user_username" UNIQUE ("username"),
                CONSTRAINT "UQ_user_email" UNIQUE ("email")
            )
        `);

        // Deck Tabelle
        await queryRunner.query(`
            CREATE TABLE "deck" (
                "id" SERIAL PRIMARY KEY,
                "name" character varying NOT NULL,
                "description" text
            )
        `);

        // User_deck Tabelle (Verbindungstabelle)
        await queryRunner.query(`
            CREATE TABLE "user_deck" (
                "id" SERIAL PRIMARY KEY,
                "user_id" integer NOT NULL,
                "deck_id" integer NOT NULL,
                CONSTRAINT "FK_user_deck_user" FOREIGN KEY ("user_id") REFERENCES "user"("id"),
                CONSTRAINT "FK_user_deck_deck" FOREIGN KEY ("deck_id") REFERENCES "deck"("id"),
                CONSTRAINT "UQ_user_deck" UNIQUE ("user_id", "deck_id")
            )
        `);

        // Game Tabelle
        await queryRunner.query(`
            CREATE TABLE "game" (
                "id" SERIAL PRIMARY KEY,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Participation Tabelle
        await queryRunner.query(`
            CREATE TABLE "participation" (
                "id" SERIAL PRIMARY KEY,
                "is_winner" boolean NOT NULL DEFAULT false,
                "game_id" integer NOT NULL,
                "user_deck_id" integer NOT NULL,
                CONSTRAINT "FK_participation_game" FOREIGN KEY ("game_id") REFERENCES "game"("id"),
                CONSTRAINT "FK_participation_user_deck" FOREIGN KEY ("user_deck_id") REFERENCES "user_deck"("id")
            )
        `);

        // Rating Tabelle
        await queryRunner.query(`
            CREATE TABLE "rating" (
                "id" SERIAL PRIMARY KEY,
                "value" integer NOT NULL,
                "participation_id" integer NOT NULL,
                "rater_id" integer NOT NULL,
                CONSTRAINT "FK_rating_participation" FOREIGN KEY ("participation_id") REFERENCES "participation"("id"),
                CONSTRAINT "FK_rating_user" FOREIGN KEY ("rater_id") REFERENCES "user"("id"),
                CONSTRAINT "UQ_rating_participation_rater" UNIQUE ("participation_id", "rater_id")
            )
        `);

        // Indizes für bessere Performance
        await queryRunner.query(`
            CREATE INDEX "IDX_user_deck_user" ON "user_deck"("user_id");
            CREATE INDEX "IDX_user_deck_deck" ON "user_deck"("deck_id");
            CREATE INDEX "IDX_participation_game" ON "participation"("game_id");
            CREATE INDEX "IDX_participation_user_deck" ON "participation"("user_deck_id");
            CREATE INDEX "IDX_rating_participation" ON "rating"("participation_id");
            CREATE INDEX "IDX_rating_rater" ON "rating"("rater_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Lösche alle Tabellen in der richtigen Reihenfolge
        await queryRunner.query(`
            DROP TABLE IF EXISTS "rating" CASCADE;
            DROP TABLE IF EXISTS "participation" CASCADE;
            DROP TABLE IF EXISTS "game" CASCADE;
            DROP TABLE IF EXISTS "user_deck" CASCADE;
            DROP TABLE IF EXISTS "deck" CASCADE;
            DROP TABLE IF EXISTS "user" CASCADE;
        `);
    }
}