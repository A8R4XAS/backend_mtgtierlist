import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRole1758657000000 implements MigrationInterface {
    name = 'AddUserRole1758657000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Erstelle zuerst den Enum-Typ
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin')`);
        
        // Füge dann die role-Spalte hinzu
        await queryRunner.query(`ALTER TABLE "user" ADD "role" "public"."user_role_enum" NOT NULL DEFAULT 'user'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Entferne die role-Spalte
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
        
        // Entferne den Enum-Typ
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }
}