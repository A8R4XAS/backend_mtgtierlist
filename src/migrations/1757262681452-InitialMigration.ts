import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1757262681452 implements MigrationInterface {
    name = 'InitialMigration1757262681452'

      public async up(queryRunner: QueryRunner): Promise<void> {
    // User
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR NOT NULL UNIQUE,
        "password" VARCHAR NOT NULL,
        "name" VARCHAR NOT NULL
      );
    `);

    // Deck
    await queryRunner.query(`
      CREATE TABLE "deck" (
        "id" SERIAL PRIMARY KEY,
        "ownerId" INTEGER,
        "commander" VARCHAR,
        "thema" VARCHAR,
        "gameplan" VARCHAR,
        "tempo" VARCHAR,
        "tier" INTEGER,
        "weaknesses" VARCHAR,
        CONSTRAINT "FK_deck_owner" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL
      );
    `);

    // User_deck
    await queryRunner.query(`
      CREATE TABLE "user_deck" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "deckId" INTEGER,
        CONSTRAINT "FK_userdeck_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_userdeck_deck" FOREIGN KEY ("deckId") REFERENCES "deck"("id") ON DELETE CASCADE
      );
    `);

    // Game
    await queryRunner.query(`
      CREATE TABLE "game" (
        "id" SERIAL PRIMARY KEY,
        "user_deck1Id" INTEGER,
        "user_deck2Id" INTEGER,
        "user_deck3Id" INTEGER,
        "user_deck4Id" INTEGER,
        "winnerId" INTEGER,
        CONSTRAINT "FK_game_ud1" FOREIGN KEY ("user_deck1Id") REFERENCES "user_deck"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_game_ud2" FOREIGN KEY ("user_deck2Id") REFERENCES "user_deck"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_game_ud3" FOREIGN KEY ("user_deck3Id") REFERENCES "user_deck"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_game_ud4" FOREIGN KEY ("user_deck4Id") REFERENCES "user_deck"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_game_winner" FOREIGN KEY ("winnerId") REFERENCES "user_deck"("id") ON DELETE SET NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "game";`);
    await queryRunner.query(`DROP TABLE "user_deck";`);
    await queryRunner.query(`DROP TABLE "deck";`);
    await queryRunner.query(`DROP TABLE "user";`);
  }

}