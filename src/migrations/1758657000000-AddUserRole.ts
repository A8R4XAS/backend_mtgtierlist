import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRole1758657000000 implements MigrationInterface {
    name = 'AddUserRole1758657000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Prüfe ob der Enum-Typ bereits existiert
        const typeExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type 
                WHERE typname = 'user_role_enum'
            );
        `);
        
        // Erstelle den Enum-Typ nur wenn er nicht existiert
        if (!typeExists[0].exists) {
            await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin')`);
        }
        
        // Prüfe ob die Spalte bereits existiert
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'user' 
                AND column_name = 'role'
            );
        `);
        
        // Füge die role-Spalte nur hinzu wenn sie nicht existiert
        if (!columnExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "user" ADD "role" "public"."user_role_enum" NOT NULL DEFAULT 'user'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Entferne die role-Spalte
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "role"`);
        
        // Entferne den Enum-Typ
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
    }
}