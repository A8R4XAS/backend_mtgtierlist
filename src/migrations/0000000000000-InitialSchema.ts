import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema0000000000000 implements MigrationInterface {
    name = 'InitialSchema0000000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Prüfe ob die user Tabelle bereits existiert (dann wurde das Schema schon erstellt)
        const userTableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user'
            );
        `);

        // Wenn die Tabellen bereits existieren, überspringe diese Migration
        if (userTableExists[0].exists) {
            console.log('Schema already exists, skipping initial schema creation');
            return;
        }

        console.log('Creating initial database schema...');

        // User Role Enum
        await queryRunner.query(`
            CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin')
        `);

        // User Tabelle
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "role" "public"."user_role_enum" NOT NULL DEFAULT 'user',
                CONSTRAINT "UQ_user_email" UNIQUE ("email"),
                CONSTRAINT "PK_user" PRIMARY KEY ("id")
            )
        `);

        // Game Tabelle
        await queryRunner.query(`
            CREATE TABLE "game" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_game" PRIMARY KEY ("id")
            )
        `);

        // Deck Tabelle
        await queryRunner.query(`
            CREATE TABLE "deck" (
                "id" SERIAL NOT NULL,
                "commander" character varying,
                "thema" character varying,
                "gameplan" character varying,
                "tempo" character varying,
                "tier" integer,
                "weaknesses" character varying,
                "ownerId" integer,
                CONSTRAINT "PK_deck" PRIMARY KEY ("id")
            )
        `);

        // User_Deck Tabelle
        await queryRunner.query(`
            CREATE TABLE "user_deck" (
                "id" SERIAL NOT NULL,
                "user_id" integer,
                "deck_id" integer,
                CONSTRAINT "PK_user_deck" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_13d8ee8596719f660d91c9c8d95" UNIQUE ("user_id", "deck_id")
            )
        `);

        // Participation Tabelle
        await queryRunner.query(`
            CREATE TABLE "participation" (
                "id" SERIAL NOT NULL,
                "is_winner" boolean NOT NULL DEFAULT false,
                "game_id" integer,
                "user_deck_id" integer,
                CONSTRAINT "PK_participation" PRIMARY KEY ("id")
            )
        `);

        // Rating Tabelle
        await queryRunner.query(`
            CREATE TABLE "rating" (
                "id" SERIAL NOT NULL,
                "value" integer NOT NULL,
                "participation_id" integer,
                "rater_id" integer,
                CONSTRAINT "PK_rating" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_008e5445ee9c8776036ae08dc65" UNIQUE ("participation_id", "rater_id")
            )
        `);

        // Sessions Tabelle (FoalTS)
        await queryRunner.query(`
            CREATE TABLE "sessions" (
                "id" character varying NOT NULL,
                "user_id" integer,
                "content" text NOT NULL,
                "flash" text NOT NULL,
                "updated_at" bigint NOT NULL,
                "created_at" bigint NOT NULL,
                CONSTRAINT "PK_sessions" PRIMARY KEY ("id")
            )
        `);

        // Foreign Keys
        await queryRunner.query(`
            ALTER TABLE "deck" 
            ADD CONSTRAINT "FK_deck_owner" 
            FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "user_deck" 
            ADD CONSTRAINT "FK_8a7bace6b0d8f3246bfcee6c830" 
            FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "user_deck" 
            ADD CONSTRAINT "FK_7fe74a8b282d7fc1492fbff3f07" 
            FOREIGN KEY ("deck_id") REFERENCES "deck"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "participation" 
            ADD CONSTRAINT "FK_1820ac99e3bff2dff16c044953b" 
            FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "participation" 
            ADD CONSTRAINT "FK_ea55272aab75990898c2a9613c7" 
            FOREIGN KEY ("user_deck_id") REFERENCES "user_deck"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "rating" 
            ADD CONSTRAINT "FK_97be4de7da39756d1d1f0f4baa1" 
            FOREIGN KEY ("participation_id") REFERENCES "participation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "rating" 
            ADD CONSTRAINT "FK_2f36180c313f672d99a14b71049" 
            FOREIGN KEY ("rater_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Indizes für bessere Performance
        await queryRunner.query(`
            CREATE INDEX "IDX_user_deck_user_id" ON "user_deck" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_user_deck_deck_id" ON "user_deck" ("deck_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_participation_game_id" ON "participation" ("game_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_participation_user_deck" ON "participation" ("user_deck_id")
        `);

        console.log('Initial schema created successfully!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all tables and types in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS "rating" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "participation" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "user_deck" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "deck" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "game" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sessions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
    }
}
