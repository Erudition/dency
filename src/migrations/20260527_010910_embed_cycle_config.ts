import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "schedules_cycle_config_cohorts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "schedules_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"residents_id" integer
  );
  
  CREATE TABLE "_schedules_v_version_cycle_config_cohorts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_schedules_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"residents_id" integer
  );
  
  ALTER TABLE "clinic_cycles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clinic_cycles_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "clinic_cycles" CASCADE;
  DROP TABLE "clinic_cycles_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_clinic_cycles_fk";
  
  DROP INDEX "payload_locked_documents_rels_clinic_cycles_id_idx";
  ALTER TABLE "schedules" ADD COLUMN "cycle_config_clinic_weeks_per_cycle" numeric DEFAULT 1;
  ALTER TABLE "_schedules_v" ADD COLUMN "version_cycle_config_clinic_weeks_per_cycle" numeric DEFAULT 1;
  ALTER TABLE "schedules_cycle_config_cohorts" ADD CONSTRAINT "schedules_cycle_config_cohorts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "schedules_rels" ADD CONSTRAINT "schedules_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "schedules_rels" ADD CONSTRAINT "schedules_rels_residents_fk" FOREIGN KEY ("residents_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_schedules_v_version_cycle_config_cohorts" ADD CONSTRAINT "_schedules_v_version_cycle_config_cohorts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_schedules_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_schedules_v_rels" ADD CONSTRAINT "_schedules_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_schedules_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_schedules_v_rels" ADD CONSTRAINT "_schedules_v_rels_residents_fk" FOREIGN KEY ("residents_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "schedules_cycle_config_cohorts_order_idx" ON "schedules_cycle_config_cohorts" USING btree ("_order");
  CREATE INDEX "schedules_cycle_config_cohorts_parent_id_idx" ON "schedules_cycle_config_cohorts" USING btree ("_parent_id");
  CREATE INDEX "schedules_rels_order_idx" ON "schedules_rels" USING btree ("order");
  CREATE INDEX "schedules_rels_parent_idx" ON "schedules_rels" USING btree ("parent_id");
  CREATE INDEX "schedules_rels_path_idx" ON "schedules_rels" USING btree ("path");
  CREATE INDEX "schedules_rels_residents_id_idx" ON "schedules_rels" USING btree ("residents_id");
  CREATE INDEX "_schedules_v_version_cycle_config_cohorts_order_idx" ON "_schedules_v_version_cycle_config_cohorts" USING btree ("_order");
  CREATE INDEX "_schedules_v_version_cycle_config_cohorts_parent_id_idx" ON "_schedules_v_version_cycle_config_cohorts" USING btree ("_parent_id");
  CREATE INDEX "_schedules_v_rels_order_idx" ON "_schedules_v_rels" USING btree ("order");
  CREATE INDEX "_schedules_v_rels_parent_idx" ON "_schedules_v_rels" USING btree ("parent_id");
  CREATE INDEX "_schedules_v_rels_path_idx" ON "_schedules_v_rels" USING btree ("path");
  CREATE INDEX "_schedules_v_rels_residents_id_idx" ON "_schedules_v_rels" USING btree ("residents_id");
  ALTER TABLE "academic_years" DROP COLUMN "clinic_weeks_per_cycle";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "clinic_cycles_id";`)
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
