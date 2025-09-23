import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAllMissingColumns1758657300000 implements MigrationInterface {
    name = 'AddAllMissingColumns1758657300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Game Entity
        await queryRunner.query(`ALTER TABLE "game" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);

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
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rating' AND column_name = 'value') THEN
                    ALTER TABLE "rating" ADD "value" integer NOT NULL;
                END IF;
            END $$;
        `);

        // Participation Entity
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participation' AND column_name = 'is_winner') THEN
                    ALTER TABLE "participation" ADD "is_winner" boolean NOT NULL DEFAULT false;
                END IF;
            END $$;
        `);

        // DeckEvaluation Entity
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deck_evaluation' AND column_name = 'value') THEN
                    ALTER TABLE "deck_evaluation" ADD "value" integer NOT NULL;
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