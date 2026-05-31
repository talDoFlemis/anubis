CREATE TYPE "public"."enrollment_level" AS ENUM('masters', 'doctoral');--> statement-breakpoint
CREATE TYPE "public"."enrollment_period_status" AS ENUM('scheduled', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('draft', 'submitted', 'closed');--> statement-breakpoint
CREATE TABLE "cv_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"scoring_category_id" uuid NOT NULL,
	"description" varchar(500) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_in_area" boolean,
	"proof_file_id" uuid,
	"score" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cv_scoring_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_period_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"points_per_item" numeric(5, 2) NOT NULL,
	"max_points" numeric(5, 2) NOT NULL,
	"level" "enrollment_level" NOT NULL,
	"requires_area_verification" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollment_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" "enrollment_level" NOT NULL,
	"semester" varchar(10) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" "enrollment_period_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"enrollment_period_id" uuid NOT NULL,
	"level" "enrollment_level" NOT NULL,
	"status" "enrollment_status" DEFAULT 'draft' NOT NULL,
	"phone" varchar(20),
	"justification" text,
	"sigaa_code" varchar(50),
	"sigaa_receipt_file_id" varchar(255),
	"declaration" boolean DEFAULT false,
	"poscomp" jsonb,
	"masters_degrees" jsonb,
	"score_draft" numeric(7, 2),
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_name" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"bucket" varchar(255) NOT NULL,
	"key" varchar(1000) NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"purpose" varchar(100) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(500) NOT NULL,
	"university_id" uuid,
	"is_manual" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(500) NOT NULL,
	"abbreviation" varchar(50),
	"state" varchar(2),
	"city" varchar(255),
	"is_manual" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
--&gt; statement-breakpoint
ALTER TABLE "cv_items" ADD CONSTRAINT "cv_items_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_items" ADD CONSTRAINT "cv_items_scoring_category_id_cv_scoring_categories_id_fk" FOREIGN KEY ("scoring_category_id") REFERENCES "public"."cv_scoring_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_items" ADD CONSTRAINT "cv_items_proof_file_id_files_id_fk" FOREIGN KEY ("proof_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_scoring_categories" ADD CONSTRAINT "cv_scoring_categories_enrollment_period_id_enrollment_periods_id_fk" FOREIGN KEY ("enrollment_period_id") REFERENCES "public"."enrollment_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_enrollment_period_id_enrollment_periods_id_fk" FOREIGN KEY ("enrollment_period_id") REFERENCES "public"."enrollment_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_candidate_period_unique" ON "enrollments" USING btree ("candidate_id","enrollment_period_id");