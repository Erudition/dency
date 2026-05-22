import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('super-admin', 'user');
  CREATE TYPE "public"."enum_users_tenants_roles" AS ENUM('tenant-admin', 'schedule-manager', 'tenant-viewer');
  CREATE TYPE "public"."enum_annual_requirements_source" AS ENUM('acgme', 'mhs', 'program');
  CREATE TYPE "public"."enum_grad_requirements_source" AS ENUM('acgme', 'mhs', 'program');
  CREATE TYPE "public"."enum_residents_leave_reason" AS ENUM('graduated', 'transferred_out', 'dismissed', 'on_leave');
  CREATE TYPE "public"."enum_candidates_status" AS ENUM('active', 'finalized', 'archived');
  CREATE TYPE "public"."enum_schedules_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__schedules_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_tenants_roles" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_users_tenants_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_tenants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"password" varchar,
  	"username" varchar,
  	"resident_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "tenants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"domain" varchar,
  	"slug" varchar NOT NULL,
  	"allow_public_read" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "academic_years" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"starting_year" numeric NOT NULL,
  	"title" varchar,
  	"clinic_weeks_per_cycle" numeric DEFAULT 1 NOT NULL,
  	"canonical_schedule_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"available_since_id" integer NOT NULL,
  	"available_until_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rotations_staffing_configurations_preferences" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"intern_count" numeric NOT NULL,
  	"senior_count" numeric NOT NULL
  );
  
  CREATE TABLE "rotations_staffing_configurations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"since_id" integer NOT NULL,
  	"min_interns" numeric,
  	"max_interns" numeric,
  	"min_seniors" numeric,
  	"max_seniors" numeric
  );
  
  CREATE TABLE "rotations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"title" varchar NOT NULL,
  	"codename" varchar NOT NULL,
  	"intensity" numeric NOT NULL,
  	"outpatient_percentage" numeric DEFAULT 0 NOT NULL,
  	"color" varchar,
  	"is_flexible" boolean DEFAULT false,
  	"is_placeholder_id" integer,
  	"available_since_id" integer NOT NULL,
  	"available_until_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rotations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "annual_requirements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"academic_year_id" integer NOT NULL,
  	"tag_id" integer NOT NULL,
  	"source" "enum_annual_requirements_source" NOT NULL,
  	"minimum" numeric,
  	"maximum" numeric,
  	"ideal" numeric,
  	"pgy1_ideal" numeric,
  	"pgy2_ideal" numeric,
  	"pgy3_ideal" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "grad_requirements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"academic_year_id" integer NOT NULL,
  	"tag_id" integer NOT NULL,
  	"source" "enum_grad_requirements_source" NOT NULL,
  	"minimum" numeric,
  	"maximum" numeric,
  	"ideal" numeric,
  	"pgy1_ideal" numeric,
  	"pgy2_ideal" numeric,
  	"pgy3_ideal" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "residents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"display_name" varchar,
  	"start_year_id" integer NOT NULL,
  	"pgy3_year_id" integer,
  	"join_date" timestamp(3) with time zone,
  	"leave_date" timestamp(3) with time zone,
  	"leave_reason" "enum_residents_leave_reason",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "transfer_credits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"resident_id" integer NOT NULL,
  	"tag_id" integer NOT NULL,
  	"weeks" numeric NOT NULL,
  	"from_program" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "avoidance_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"resident_id" integer NOT NULL,
  	"avoided_resident_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "candidates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"title" varchar NOT NULL,
  	"starting_year_id" integer NOT NULL,
  	"status" "enum_candidates_status" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "schedules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"title" varchar,
  	"academic_year_id" integer,
  	"candidate_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_schedules_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_schedules_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tenant_id" integer,
  	"version_title" varchar,
  	"version_academic_year_id" integer,
  	"version_candidate_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__schedules_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "schedule_assignments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"schedule_id" integer NOT NULL,
  	"resident_id" integer NOT NULL,
  	"week" numeric NOT NULL,
  	"rotation_id" integer NOT NULL,
  	"locked" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
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
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"tenants_id" integer,
  	"academic_years_id" integer,
  	"tags_id" integer,
  	"rotations_id" integer,
  	"annual_requirements_id" integer,
  	"grad_requirements_id" integer,
  	"residents_id" integer,
  	"transfer_credits_id" integer,
  	"avoidance_rules_id" integer,
  	"candidates_id" integer,
  	"schedules_id" integer,
  	"schedule_assignments_id" integer,
  	"clinic_cycles_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_tenants_roles" ADD CONSTRAINT "users_tenants_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users_tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_canonical_schedule_id_schedules_id_fk" FOREIGN KEY ("canonical_schedule_id") REFERENCES "public"."schedules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tags" ADD CONSTRAINT "tags_available_since_id_academic_years_id_fk" FOREIGN KEY ("available_since_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tags" ADD CONSTRAINT "tags_available_until_id_academic_years_id_fk" FOREIGN KEY ("available_until_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotations_staffing_configurations_preferences" ADD CONSTRAINT "rotations_staffing_configurations_preferences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rotations_staffing_configurations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rotations_staffing_configurations" ADD CONSTRAINT "rotations_staffing_configurations_since_id_academic_years_id_fk" FOREIGN KEY ("since_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotations_staffing_configurations" ADD CONSTRAINT "rotations_staffing_configurations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rotations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rotations" ADD CONSTRAINT "rotations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotations" ADD CONSTRAINT "rotations_is_placeholder_id_tags_id_fk" FOREIGN KEY ("is_placeholder_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotations" ADD CONSTRAINT "rotations_available_since_id_academic_years_id_fk" FOREIGN KEY ("available_since_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotations" ADD CONSTRAINT "rotations_available_until_id_academic_years_id_fk" FOREIGN KEY ("available_until_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rotations_rels" ADD CONSTRAINT "rotations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rotations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rotations_rels" ADD CONSTRAINT "rotations_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "annual_requirements" ADD CONSTRAINT "annual_requirements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "annual_requirements" ADD CONSTRAINT "annual_requirements_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "annual_requirements" ADD CONSTRAINT "annual_requirements_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "grad_requirements" ADD CONSTRAINT "grad_requirements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "grad_requirements" ADD CONSTRAINT "grad_requirements_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "grad_requirements" ADD CONSTRAINT "grad_requirements_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "residents" ADD CONSTRAINT "residents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "residents" ADD CONSTRAINT "residents_start_year_id_academic_years_id_fk" FOREIGN KEY ("start_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "residents" ADD CONSTRAINT "residents_pgy3_year_id_academic_years_id_fk" FOREIGN KEY ("pgy3_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transfer_credits" ADD CONSTRAINT "transfer_credits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transfer_credits" ADD CONSTRAINT "transfer_credits_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transfer_credits" ADD CONSTRAINT "transfer_credits_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "avoidance_rules" ADD CONSTRAINT "avoidance_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "avoidance_rules" ADD CONSTRAINT "avoidance_rules_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "avoidance_rules" ADD CONSTRAINT "avoidance_rules_avoided_resident_id_residents_id_fk" FOREIGN KEY ("avoided_resident_id") REFERENCES "public"."residents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_starting_year_id_academic_years_id_fk" FOREIGN KEY ("starting_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedules" ADD CONSTRAINT "schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedules" ADD CONSTRAINT "schedules_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedules" ADD CONSTRAINT "schedules_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_schedules_v" ADD CONSTRAINT "_schedules_v_parent_id_schedules_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."schedules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_schedules_v" ADD CONSTRAINT "_schedules_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_schedules_v" ADD CONSTRAINT "_schedules_v_version_academic_year_id_academic_years_id_fk" FOREIGN KEY ("version_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_schedules_v" ADD CONSTRAINT "_schedules_v_version_candidate_id_candidates_id_fk" FOREIGN KEY ("version_candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_rotation_id_rotations_id_fk" FOREIGN KEY ("rotation_id") REFERENCES "public"."rotations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinic_cycles" ADD CONSTRAINT "clinic_cycles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinic_cycles" ADD CONSTRAINT "clinic_cycles_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinic_cycles_rels" ADD CONSTRAINT "clinic_cycles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clinic_cycles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinic_cycles_rels" ADD CONSTRAINT "clinic_cycles_rels_residents_fk" FOREIGN KEY ("residents_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_academic_years_fk" FOREIGN KEY ("academic_years_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rotations_fk" FOREIGN KEY ("rotations_id") REFERENCES "public"."rotations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_annual_requirements_fk" FOREIGN KEY ("annual_requirements_id") REFERENCES "public"."annual_requirements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_grad_requirements_fk" FOREIGN KEY ("grad_requirements_id") REFERENCES "public"."grad_requirements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_residents_fk" FOREIGN KEY ("residents_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_transfer_credits_fk" FOREIGN KEY ("transfer_credits_id") REFERENCES "public"."transfer_credits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_avoidance_rules_fk" FOREIGN KEY ("avoidance_rules_id") REFERENCES "public"."avoidance_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidates_fk" FOREIGN KEY ("candidates_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_schedules_fk" FOREIGN KEY ("schedules_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_schedule_assignments_fk" FOREIGN KEY ("schedule_assignments_id") REFERENCES "public"."schedule_assignments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clinic_cycles_fk" FOREIGN KEY ("clinic_cycles_id") REFERENCES "public"."clinic_cycles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_tenants_roles_order_idx" ON "users_tenants_roles" USING btree ("order");
  CREATE INDEX "users_tenants_roles_parent_idx" ON "users_tenants_roles" USING btree ("parent_id");
  CREATE INDEX "users_tenants_order_idx" ON "users_tenants" USING btree ("_order");
  CREATE INDEX "users_tenants_parent_id_idx" ON "users_tenants" USING btree ("_parent_id");
  CREATE INDEX "users_tenants_tenant_idx" ON "users_tenants" USING btree ("tenant_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_username_idx" ON "users" USING btree ("username");
  CREATE INDEX "users_resident_idx" ON "users" USING btree ("resident_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "tenants_name_idx" ON "tenants" USING btree ("name");
  CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");
  CREATE INDEX "tenants_allow_public_read_idx" ON "tenants" USING btree ("allow_public_read");
  CREATE INDEX "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  CREATE UNIQUE INDEX "academic_years_starting_year_idx" ON "academic_years" USING btree ("starting_year");
  CREATE INDEX "academic_years_canonical_schedule_idx" ON "academic_years" USING btree ("canonical_schedule_id");
  CREATE INDEX "academic_years_updated_at_idx" ON "academic_years" USING btree ("updated_at");
  CREATE INDEX "academic_years_created_at_idx" ON "academic_years" USING btree ("created_at");
  CREATE INDEX "tags_tenant_idx" ON "tags" USING btree ("tenant_id");
  CREATE INDEX "tags_available_since_idx" ON "tags" USING btree ("available_since_id");
  CREATE INDEX "tags_available_until_idx" ON "tags" USING btree ("available_until_id");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "rotations_staffing_configurations_preferences_order_idx" ON "rotations_staffing_configurations_preferences" USING btree ("_order");
  CREATE INDEX "rotations_staffing_configurations_preferences_parent_id_idx" ON "rotations_staffing_configurations_preferences" USING btree ("_parent_id");
  CREATE INDEX "rotations_staffing_configurations_order_idx" ON "rotations_staffing_configurations" USING btree ("_order");
  CREATE INDEX "rotations_staffing_configurations_parent_id_idx" ON "rotations_staffing_configurations" USING btree ("_parent_id");
  CREATE INDEX "rotations_staffing_configurations_since_idx" ON "rotations_staffing_configurations" USING btree ("since_id");
  CREATE INDEX "rotations_tenant_idx" ON "rotations" USING btree ("tenant_id");
  CREATE UNIQUE INDEX "rotations_codename_idx" ON "rotations" USING btree ("codename");
  CREATE INDEX "rotations_is_placeholder_idx" ON "rotations" USING btree ("is_placeholder_id");
  CREATE INDEX "rotations_available_since_idx" ON "rotations" USING btree ("available_since_id");
  CREATE INDEX "rotations_available_until_idx" ON "rotations" USING btree ("available_until_id");
  CREATE INDEX "rotations_updated_at_idx" ON "rotations" USING btree ("updated_at");
  CREATE INDEX "rotations_created_at_idx" ON "rotations" USING btree ("created_at");
  CREATE INDEX "rotations_rels_order_idx" ON "rotations_rels" USING btree ("order");
  CREATE INDEX "rotations_rels_parent_idx" ON "rotations_rels" USING btree ("parent_id");
  CREATE INDEX "rotations_rels_path_idx" ON "rotations_rels" USING btree ("path");
  CREATE INDEX "rotations_rels_tags_id_idx" ON "rotations_rels" USING btree ("tags_id");
  CREATE INDEX "annual_requirements_tenant_idx" ON "annual_requirements" USING btree ("tenant_id");
  CREATE INDEX "annual_requirements_academic_year_idx" ON "annual_requirements" USING btree ("academic_year_id");
  CREATE INDEX "annual_requirements_tag_idx" ON "annual_requirements" USING btree ("tag_id");
  CREATE INDEX "annual_requirements_updated_at_idx" ON "annual_requirements" USING btree ("updated_at");
  CREATE INDEX "annual_requirements_created_at_idx" ON "annual_requirements" USING btree ("created_at");
  CREATE UNIQUE INDEX "academicYear_tag_tenant_idx" ON "annual_requirements" USING btree ("academic_year_id","tag_id","tenant_id");
  CREATE INDEX "grad_requirements_tenant_idx" ON "grad_requirements" USING btree ("tenant_id");
  CREATE INDEX "grad_requirements_academic_year_idx" ON "grad_requirements" USING btree ("academic_year_id");
  CREATE INDEX "grad_requirements_tag_idx" ON "grad_requirements" USING btree ("tag_id");
  CREATE INDEX "grad_requirements_updated_at_idx" ON "grad_requirements" USING btree ("updated_at");
  CREATE INDEX "grad_requirements_created_at_idx" ON "grad_requirements" USING btree ("created_at");
  CREATE UNIQUE INDEX "academicYear_tag_tenant_1_idx" ON "grad_requirements" USING btree ("academic_year_id","tag_id","tenant_id");
  CREATE INDEX "residents_tenant_idx" ON "residents" USING btree ("tenant_id");
  CREATE INDEX "residents_start_year_idx" ON "residents" USING btree ("start_year_id");
  CREATE INDEX "residents_pgy3_year_idx" ON "residents" USING btree ("pgy3_year_id");
  CREATE INDEX "residents_updated_at_idx" ON "residents" USING btree ("updated_at");
  CREATE INDEX "residents_created_at_idx" ON "residents" USING btree ("created_at");
  CREATE INDEX "transfer_credits_tenant_idx" ON "transfer_credits" USING btree ("tenant_id");
  CREATE INDEX "transfer_credits_resident_idx" ON "transfer_credits" USING btree ("resident_id");
  CREATE INDEX "transfer_credits_tag_idx" ON "transfer_credits" USING btree ("tag_id");
  CREATE INDEX "transfer_credits_updated_at_idx" ON "transfer_credits" USING btree ("updated_at");
  CREATE INDEX "transfer_credits_created_at_idx" ON "transfer_credits" USING btree ("created_at");
  CREATE INDEX "avoidance_rules_tenant_idx" ON "avoidance_rules" USING btree ("tenant_id");
  CREATE INDEX "avoidance_rules_resident_idx" ON "avoidance_rules" USING btree ("resident_id");
  CREATE INDEX "avoidance_rules_avoided_resident_idx" ON "avoidance_rules" USING btree ("avoided_resident_id");
  CREATE INDEX "avoidance_rules_updated_at_idx" ON "avoidance_rules" USING btree ("updated_at");
  CREATE INDEX "avoidance_rules_created_at_idx" ON "avoidance_rules" USING btree ("created_at");
  CREATE INDEX "candidates_tenant_idx" ON "candidates" USING btree ("tenant_id");
  CREATE INDEX "candidates_starting_year_idx" ON "candidates" USING btree ("starting_year_id");
  CREATE INDEX "candidates_updated_at_idx" ON "candidates" USING btree ("updated_at");
  CREATE INDEX "candidates_created_at_idx" ON "candidates" USING btree ("created_at");
  CREATE INDEX "schedules_tenant_idx" ON "schedules" USING btree ("tenant_id");
  CREATE INDEX "schedules_academic_year_idx" ON "schedules" USING btree ("academic_year_id");
  CREATE INDEX "schedules_candidate_idx" ON "schedules" USING btree ("candidate_id");
  CREATE INDEX "schedules_updated_at_idx" ON "schedules" USING btree ("updated_at");
  CREATE INDEX "schedules_created_at_idx" ON "schedules" USING btree ("created_at");
  CREATE INDEX "schedules__status_idx" ON "schedules" USING btree ("_status");
  CREATE INDEX "_schedules_v_parent_idx" ON "_schedules_v" USING btree ("parent_id");
  CREATE INDEX "_schedules_v_version_version_tenant_idx" ON "_schedules_v" USING btree ("version_tenant_id");
  CREATE INDEX "_schedules_v_version_version_academic_year_idx" ON "_schedules_v" USING btree ("version_academic_year_id");
  CREATE INDEX "_schedules_v_version_version_candidate_idx" ON "_schedules_v" USING btree ("version_candidate_id");
  CREATE INDEX "_schedules_v_version_version_updated_at_idx" ON "_schedules_v" USING btree ("version_updated_at");
  CREATE INDEX "_schedules_v_version_version_created_at_idx" ON "_schedules_v" USING btree ("version_created_at");
  CREATE INDEX "_schedules_v_version_version__status_idx" ON "_schedules_v" USING btree ("version__status");
  CREATE INDEX "_schedules_v_created_at_idx" ON "_schedules_v" USING btree ("created_at");
  CREATE INDEX "_schedules_v_updated_at_idx" ON "_schedules_v" USING btree ("updated_at");
  CREATE INDEX "_schedules_v_latest_idx" ON "_schedules_v" USING btree ("latest");
  CREATE INDEX "schedule_assignments_tenant_idx" ON "schedule_assignments" USING btree ("tenant_id");
  CREATE INDEX "schedule_assignments_schedule_idx" ON "schedule_assignments" USING btree ("schedule_id");
  CREATE INDEX "schedule_assignments_resident_idx" ON "schedule_assignments" USING btree ("resident_id");
  CREATE INDEX "schedule_assignments_rotation_idx" ON "schedule_assignments" USING btree ("rotation_id");
  CREATE INDEX "schedule_assignments_updated_at_idx" ON "schedule_assignments" USING btree ("updated_at");
  CREATE INDEX "schedule_assignments_created_at_idx" ON "schedule_assignments" USING btree ("created_at");
  CREATE INDEX "clinic_cycles_tenant_idx" ON "clinic_cycles" USING btree ("tenant_id");
  CREATE INDEX "clinic_cycles_academic_year_idx" ON "clinic_cycles" USING btree ("academic_year_id");
  CREATE INDEX "clinic_cycles_updated_at_idx" ON "clinic_cycles" USING btree ("updated_at");
  CREATE INDEX "clinic_cycles_created_at_idx" ON "clinic_cycles" USING btree ("created_at");
  CREATE INDEX "clinic_cycles_rels_order_idx" ON "clinic_cycles_rels" USING btree ("order");
  CREATE INDEX "clinic_cycles_rels_parent_idx" ON "clinic_cycles_rels" USING btree ("parent_id");
  CREATE INDEX "clinic_cycles_rels_path_idx" ON "clinic_cycles_rels" USING btree ("path");
  CREATE INDEX "clinic_cycles_rels_residents_id_idx" ON "clinic_cycles_rels" USING btree ("residents_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX "payload_locked_documents_rels_academic_years_id_idx" ON "payload_locked_documents_rels" USING btree ("academic_years_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_rotations_id_idx" ON "payload_locked_documents_rels" USING btree ("rotations_id");
  CREATE INDEX "payload_locked_documents_rels_annual_requirements_id_idx" ON "payload_locked_documents_rels" USING btree ("annual_requirements_id");
  CREATE INDEX "payload_locked_documents_rels_grad_requirements_id_idx" ON "payload_locked_documents_rels" USING btree ("grad_requirements_id");
  CREATE INDEX "payload_locked_documents_rels_residents_id_idx" ON "payload_locked_documents_rels" USING btree ("residents_id");
  CREATE INDEX "payload_locked_documents_rels_transfer_credits_id_idx" ON "payload_locked_documents_rels" USING btree ("transfer_credits_id");
  CREATE INDEX "payload_locked_documents_rels_avoidance_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("avoidance_rules_id");
  CREATE INDEX "payload_locked_documents_rels_candidates_id_idx" ON "payload_locked_documents_rels" USING btree ("candidates_id");
  CREATE INDEX "payload_locked_documents_rels_schedules_id_idx" ON "payload_locked_documents_rels" USING btree ("schedules_id");
  CREATE INDEX "payload_locked_documents_rels_schedule_assignments_id_idx" ON "payload_locked_documents_rels" USING btree ("schedule_assignments_id");
  CREATE INDEX "payload_locked_documents_rels_clinic_cycles_id_idx" ON "payload_locked_documents_rels" USING btree ("clinic_cycles_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_tenants_roles" CASCADE;
  DROP TABLE "users_tenants" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "tenants" CASCADE;
  DROP TABLE "academic_years" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "rotations_staffing_configurations_preferences" CASCADE;
  DROP TABLE "rotations_staffing_configurations" CASCADE;
  DROP TABLE "rotations" CASCADE;
  DROP TABLE "rotations_rels" CASCADE;
  DROP TABLE "annual_requirements" CASCADE;
  DROP TABLE "grad_requirements" CASCADE;
  DROP TABLE "residents" CASCADE;
  DROP TABLE "transfer_credits" CASCADE;
  DROP TABLE "avoidance_rules" CASCADE;
  DROP TABLE "candidates" CASCADE;
  DROP TABLE "schedules" CASCADE;
  DROP TABLE "_schedules_v" CASCADE;
  DROP TABLE "schedule_assignments" CASCADE;
  DROP TABLE "clinic_cycles" CASCADE;
  DROP TABLE "clinic_cycles_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_tenants_roles";
  DROP TYPE "public"."enum_annual_requirements_source";
  DROP TYPE "public"."enum_grad_requirements_source";
  DROP TYPE "public"."enum_residents_leave_reason";
  DROP TYPE "public"."enum_candidates_status";
  DROP TYPE "public"."enum_schedules_status";
  DROP TYPE "public"."enum__schedules_v_version_status";`)
}
