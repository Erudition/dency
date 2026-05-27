import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import crypto from 'node:crypto'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ═══════════════════════════════════════════════════════════════════════════
  // Phase 1: Create new tables and columns
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "schedules_cycle_config_cohorts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "schedules_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"residents_id" integer
   );

   CREATE TABLE IF NOT EXISTS "_schedules_v_version_cycle_config_cohorts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
   );

   CREATE TABLE IF NOT EXISTS "_schedules_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"residents_id" integer
   );

   ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "cycle_config_clinic_weeks_per_cycle" numeric DEFAULT 1;
   ALTER TABLE "_schedules_v" ADD COLUMN IF NOT EXISTS "version_cycle_config_clinic_weeks_per_cycle" numeric DEFAULT 1;

   DO $$ BEGIN
     ALTER TABLE "schedules_cycle_config_cohorts" ADD CONSTRAINT "schedules_cycle_config_cohorts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;

   DO $$ BEGIN
     ALTER TABLE "schedules_rels" ADD CONSTRAINT "schedules_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;

   DO $$ BEGIN
     ALTER TABLE "schedules_rels" ADD CONSTRAINT "schedules_rels_residents_fk" FOREIGN KEY ("residents_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;

   DO $$ BEGIN
     ALTER TABLE "_schedules_v_version_cycle_config_cohorts" ADD CONSTRAINT "_schedules_v_version_cycle_config_cohorts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_schedules_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;

   DO $$ BEGIN
     ALTER TABLE "_schedules_v_rels" ADD CONSTRAINT "_schedules_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_schedules_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;

   DO $$ BEGIN
     ALTER TABLE "_schedules_v_rels" ADD CONSTRAINT "_schedules_v_rels_residents_fk" FOREIGN KEY ("residents_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;

   CREATE INDEX IF NOT EXISTS "schedules_cycle_config_cohorts_order_idx" ON "schedules_cycle_config_cohorts" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "schedules_cycle_config_cohorts_parent_id_idx" ON "schedules_cycle_config_cohorts" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "schedules_rels_order_idx" ON "schedules_rels" USING btree ("order");
   CREATE INDEX IF NOT EXISTS "schedules_rels_parent_idx" ON "schedules_rels" USING btree ("parent_id");
   CREATE INDEX IF NOT EXISTS "schedules_rels_path_idx" ON "schedules_rels" USING btree ("path");
   CREATE INDEX IF NOT EXISTS "schedules_rels_residents_id_idx" ON "schedules_rels" USING btree ("residents_id");
   CREATE INDEX IF NOT EXISTS "_schedules_v_version_cycle_config_cohorts_order_idx" ON "_schedules_v_version_cycle_config_cohorts" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_schedules_v_version_cycle_config_cohorts_parent_id_idx" ON "_schedules_v_version_cycle_config_cohorts" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_schedules_v_rels_order_idx" ON "_schedules_v_rels" USING btree ("order");
   CREATE INDEX IF NOT EXISTS "_schedules_v_rels_parent_idx" ON "_schedules_v_rels" USING btree ("parent_id");
   CREATE INDEX IF NOT EXISTS "_schedules_v_rels_path_idx" ON "_schedules_v_rels" USING btree ("path");
   CREATE INDEX IF NOT EXISTS "_schedules_v_rels_residents_id_idx" ON "_schedules_v_rels" USING btree ("residents_id");
  `)

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase 2: Data migration — copy clinic_cycles → embedded cycleConfig
  // ═══════════════════════════════════════════════════════════════════════════

  // Check if old tables exist (idempotent — allows re-running after partial failure)
  const oldTablesExist = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'clinic_cycles'
    ) AS exists
  `)
  if (!oldTablesExist.rows[0]?.exists) {
    console.log('[embed-cycle-config] clinic_cycles table not found — skipping data migration')
  } else {
    // Step 2a: Copy clinic_weeks_per_cycle from academic_years to canonical schedules
    await db.execute(sql`
      UPDATE "schedules" s
      SET "cycle_config_clinic_weeks_per_cycle" = ay."clinic_weeks_per_cycle"
      FROM "academic_years" ay
      WHERE ay."canonical_schedule_id" = s."id"
        AND ay."clinic_weeks_per_cycle" IS NOT NULL
    `)

    // Step 2b: Build a map of academic_year → schedule_id for all schedules
    // (canonical schedules via academic_years, and candidate schedules via their academic_year_id)
    const allAYs = await db.execute(sql`
      SELECT ay."id" AS ay_id, ay."starting_year", ay."canonical_schedule_id", ay."clinic_weeks_per_cycle"
      FROM "academic_years" ay
    `)
    const ayMap = new Map<number, { canonicalScheduleId: number | null; clinicWeeksPerCycle: number }>(
      allAYs.rows.map((r: any) => [r.ay_id, {
        canonicalScheduleId: r.canonical_schedule_id,
        clinicWeeksPerCycle: r.clinic_weeks_per_cycle ?? 1,
      }])
    )

    // Get all clinic_cycles with their academic year
    const allCycles = await db.execute(sql`
      SELECT cc."id" AS cycle_id, cc."number", cc."academic_year_id"
      FROM "clinic_cycles" cc
      ORDER BY cc."academic_year_id", cc."number"
    `)

    // Get all schedules so we can embed cycle config into candidate schedules too
    const allSchedules = await db.execute(sql`
      SELECT s."id" AS schedule_id, s."academic_year_id"
      FROM "schedules" s
    `)

    // Build: academic_year_id → list of schedule_ids that should receive this AY's cycle config
    const ayToSchedules = new Map<number, number[]>()
    for (const sched of allSchedules.rows as any[]) {
      const list = ayToSchedules.get(sched.academic_year_id) || []
      list.push(sched.schedule_id)
      ayToSchedules.set(sched.academic_year_id, list)
    }

    // Set clinic_weeks_per_cycle on ALL schedules (not just canonical)
    for (const [ayId, scheduleIds] of ayToSchedules.entries()) {
      const ayInfo = ayMap.get(ayId)
      if (!ayInfo) continue
      for (const schedId of scheduleIds) {
        await db.execute(sql`
          UPDATE "schedules"
          SET "cycle_config_clinic_weeks_per_cycle" = ${ayInfo.clinicWeeksPerCycle}
          WHERE "id" = ${schedId}
        `)
      }
    }

    // Step 2c: For each clinic_cycle, create cohort rows in all schedules for that AY
    for (const cycle of allCycles.rows as any[]) {
      const scheduleIds = ayToSchedules.get(cycle.academic_year_id) || []
      if (scheduleIds.length === 0) continue

      // Get residents assigned to this clinic_cycle
      const residents = await db.execute(sql`
        SELECT ccr."residents_id", ccr."order"
        FROM "clinic_cycles_rels" ccr
        WHERE ccr."parent_id" = ${cycle.cycle_id} AND ccr."path" = 'residents'
        ORDER BY ccr."order"
      `)

      // Embed into each schedule for this academic year
      for (const schedId of scheduleIds) {
        const cohortId = crypto.randomUUID()

        // Insert cohort row (0-based: cycle.number is 1-based in clinic_cycles)
        await db.execute(sql`
          INSERT INTO "schedules_cycle_config_cohorts" ("_order", "_parent_id", "id")
          VALUES (${cycle.number - 1}, ${schedId}, ${cohortId})
        `)

        // Insert resident relationships for this cohort
        for (const res of residents.rows as any[]) {
          await db.execute(sql`
            INSERT INTO "schedules_rels" ("parent_id", "path", "residents_id", "order")
            VALUES (
              ${schedId},
              ${'cycleConfig.cohorts.' + (cycle.number - 1) + '.residents'},
              ${res.residents_id},
              ${res.order}
            )
          `)
        }
      }
    }

    const cohortCount = await db.execute(sql`SELECT count(*) as cnt FROM "schedules_cycle_config_cohorts"`)
    const relCount = await db.execute(sql`SELECT count(*) as cnt FROM "schedules_rels"`)
    console.log(`[embed-cycle-config] Migrated ${(cohortCount.rows[0] as any).cnt} cohort rows, ${(relCount.rows[0] as any).cnt} resident assignments`)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase 3: Drop old tables and columns
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(sql`
   DO $$ BEGIN
     ALTER TABLE "clinic_cycles" DISABLE ROW LEVEL SECURITY;
   EXCEPTION WHEN undefined_table THEN NULL; END $$;

   DO $$ BEGIN
     ALTER TABLE "clinic_cycles_rels" DISABLE ROW LEVEL SECURITY;
   EXCEPTION WHEN undefined_table THEN NULL; END $$;

   DROP TABLE IF EXISTS "clinic_cycles" CASCADE;
   DROP TABLE IF EXISTS "clinic_cycles_rels" CASCADE;

   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_clinic_cycles_fk";
   DROP INDEX IF EXISTS "payload_locked_documents_rels_clinic_cycles_id_idx";

   ALTER TABLE "academic_years" DROP COLUMN IF EXISTS "clinic_weeks_per_cycle";
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "clinic_cycles_id";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "clinic_cycles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"number" numeric NOT NULL,
  	"label" varchar,
  	"academic_year_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   );

   CREATE TABLE "clinic_cycles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"residents_id" integer
   );

   ALTER TABLE "schedules_cycle_config_cohorts" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "schedules_rels" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "_schedules_v_version_cycle_config_cohorts" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "_schedules_v_rels" DISABLE ROW LEVEL SECURITY;
   DROP TABLE "schedules_cycle_config_cohorts" CASCADE;
   DROP TABLE "schedules_rels" CASCADE;
   DROP TABLE "_schedules_v_version_cycle_config_cohorts" CASCADE;
   DROP TABLE "_schedules_v_rels" CASCADE;
   ALTER TABLE "academic_years" ADD COLUMN "clinic_weeks_per_cycle" numeric DEFAULT 1 NOT NULL;
   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "clinic_cycles_id" integer;
   ALTER TABLE "clinic_cycles" ADD CONSTRAINT "clinic_cycles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "clinic_cycles" ADD CONSTRAINT "clinic_cycles_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "clinic_cycles_rels" ADD CONSTRAINT "clinic_cycles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clinic_cycles"("id") ON DELETE cascade ON UPDATE no action;
   ALTER TABLE "clinic_cycles_rels" ADD CONSTRAINT "clinic_cycles_rels_residents_fk" FOREIGN KEY ("residents_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;
   CREATE INDEX "clinic_cycles_tenant_idx" ON "clinic_cycles" USING btree ("tenant_id");
   CREATE INDEX "clinic_cycles_academic_year_idx" ON "clinic_cycles" USING btree ("academic_year_id");
   CREATE INDEX "clinic_cycles_updated_at_idx" ON "clinic_cycles" USING btree ("updated_at");
   CREATE INDEX "clinic_cycles_created_at_idx" ON "clinic_cycles" USING btree ("created_at");
   CREATE INDEX "clinic_cycles_rels_order_idx" ON "clinic_cycles_rels" USING btree ("order");
   CREATE INDEX "clinic_cycles_rels_parent_idx" ON "clinic_cycles_rels" USING btree ("parent_id");
   CREATE INDEX "clinic_cycles_rels_path_idx" ON "clinic_cycles_rels" USING btree ("path");
   CREATE INDEX "clinic_cycles_rels_residents_id_idx" ON "clinic_cycles_rels" USING btree ("residents_id");
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clinic_cycles_fk" FOREIGN KEY ("clinic_cycles_id") REFERENCES "public"."clinic_cycles"("id") ON DELETE cascade ON UPDATE no action;
   CREATE INDEX "payload_locked_documents_rels_clinic_cycles_id_idx" ON "payload_locked_documents_rels" USING btree ("clinic_cycles_id");
   ALTER TABLE "schedules" DROP COLUMN "cycle_config_clinic_weeks_per_cycle";
   ALTER TABLE "_schedules_v" DROP COLUMN "version_cycle_config_clinic_weeks_per_cycle";`)
}
