import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRatingTable1758657400000 implements MigrationInterface {
    name = 'UpdateRatingTable1758657400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Erstelle die Rating-Tabelle neu mit der korrekten Struktur
        await queryRunner.query(`
            DO $$ 
            BEGIN
                -- Drop die existierende Rating-Tabelle, falls vorhanden
                DROP TABLE IF EXISTS "rating";

                -- Erstelle die Rating-Tabelle mit der korrekten Struktur
                CREATE TABLE "rating" (
                    "id" SERIAL PRIMARY KEY,
                    "value" integer NOT NULL,
                    "participation_id" integer,
                    "user_id" integer,
                    CONSTRAINT "fk_participation" FOREIGN KEY ("participation_id") REFERENCES "participation"("id"),
                    CONSTRAINT "fk_user_rating" FOREIGN KEY ("user_id") REFERENCES "user"("id"),
                    CONSTRAINT "uq_participation_user" UNIQUE ("participation_id", "user_id")
                );
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "rating"`);
    }
}