import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rotations" ADD COLUMN "preferred_duration" numeric;
  ALTER TABLE "residents" ADD COLUMN "is_synthetic" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rotations" DROP COLUMN "preferred_duration";
  ALTER TABLE "residents" DROP COLUMN "is_synthetic";`)
}
