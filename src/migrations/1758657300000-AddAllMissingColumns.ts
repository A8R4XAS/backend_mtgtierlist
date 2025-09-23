import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAllMissingColumns1758657300000 implements MigrationInterface {
    name = 'AddAllMissingColumns1758657300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Deck Entity
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deck' AND column_name = 'commander') THEN
                    ALTER TABLE "deck" ADD "commander" character varying;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deck' AND column_name = 'thema') THEN
                    ALTER TABLE "deck" ADD "thema" character varying;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deck' AND column_name = 'gameplan') THEN
                    ALTER TABLE "deck" ADD "gameplan" character varying;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deck' AND column_name = 'tempo') THEN
                    ALTER TABLE "deck" ADD "tempo" character varying;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deck' AND column_name = 'tier') THEN
                    ALTER TABLE "deck" ADD "tier" integer;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deck' AND column_name = 'weaknesses') THEN
                    ALTER TABLE "deck" ADD "weaknesses" character varying;
                END IF;
            END $$;
        `);

        // Rating Entity
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'rating'
                ) THEN
                    CREATE TABLE "rating" (
                        "id" SERIAL PRIMARY KEY,
                        "value" integer NOT NULL,
                        "deck_id" integer,
                        "user_id" integer,
                        CONSTRAINT "fk_deck" FOREIGN KEY ("deck_id") REFERENCES "deck"("id"),
                        CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "user"("id")
                    );
                END IF;
            END $$;
        `);

        // Participation Entity
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'participation'
                ) THEN
                    CREATE TABLE "participation" (
                        "id" SERIAL PRIMARY KEY,
                        "is_winner" boolean NOT NULL DEFAULT false,
                        "game_id" integer,
                        "user_id" integer,
                        "deck_id" integer,
                        CONSTRAINT "fk_game" FOREIGN KEY ("game_id") REFERENCES "game"("id"),
                        CONSTRAINT "fk_user_participation" FOREIGN KEY ("user_id") REFERENCES "user"("id"),
                        CONSTRAINT "fk_deck_participation" FOREIGN KEY ("deck_id") REFERENCES "deck"("id")
                    );
                END IF;
            END $$;
        `);

        // DeckEvaluation Entity
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'deck_evaluation'
                ) THEN
                    CREATE TABLE "deck_evaluation" (
                        "id" SERIAL PRIMARY KEY,
                        "value" integer NOT NULL,
                        "deck_id" integer,
                        "user_id" integer,
                        "category" character varying,
                        CONSTRAINT "fk_deck_evaluation" FOREIGN KEY ("deck_id") REFERENCES "deck"("id"),
                        CONSTRAINT "fk_user_evaluation" FOREIGN KEY ("user_id") REFERENCES "user"("id")
                    );
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Game Entity
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "createdAt"`);

        // Deck Entity
        await queryRunner.query(`ALTER TABLE "deck" DROP COLUMN IF EXISTS "commander"`);
        await queryRunner.query(`ALTER TABLE "deck" DROP COLUMN IF EXISTS "thema"`);
        await queryRunner.query(`ALTER TABLE "deck" DROP COLUMN IF EXISTS "gameplan"`);
        await queryRunner.query(`ALTER TABLE "deck" DROP COLUMN IF EXISTS "tempo"`);
        await queryRunner.query(`ALTER TABLE "deck" DROP COLUMN IF EXISTS "tier"`);
        await queryRunner.query(`ALTER TABLE "deck" DROP COLUMN IF EXISTS "weaknesses"`);

        // Rating Entity
        await queryRunner.query(`ALTER TABLE "rating" DROP COLUMN IF EXISTS "value"`);

        // Participation Entity
        await queryRunner.query(`ALTER TABLE "participation" DROP COLUMN IF EXISTS "is_winner"`);

        // DeckEvaluation Entity
        await queryRunner.query(`ALTER TABLE "deck_evaluation" DROP COLUMN IF EXISTS "value"`);
    }
}