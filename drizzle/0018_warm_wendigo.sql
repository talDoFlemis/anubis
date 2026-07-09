CREATE TYPE "public"."stage" AS ENUM('mestrado', 'doutorado');--> statement-breakpoint
CREATE TYPE "public"."score_type" AS ENUM('cv_score', 'ira', 'final');--> statement-breakpoint
CREATE TABLE "classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"research_theme_id" uuid NOT NULL,
	"ira" numeric(5, 2) DEFAULT '0' NOT NULL,
	"interview_score" numeric(5, 2) NOT NULL,
	"cv_score" numeric(5, 2) NOT NULL,
	"project_score" numeric(5, 2),
	"final_score" numeric(5, 2) NOT NULL,
	"rank" integer NOT NULL,
	"stage" "stage" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"adjusted_by" uuid NOT NULL,
	"score_type" "score_type" NOT NULL,
	"original_value" numeric(7, 2) NOT NULL,
	"adjusted_value" numeric(7, 2) NOT NULL,
	"justification" text NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "undergrad_university_id" uuid;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "undergrad_course_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "mec_grade" integer;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_research_theme_id_research_themes_id_fk" FOREIGN KEY ("research_theme_id") REFERENCES "public"."research_themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_adjustments" ADD CONSTRAINT "score_adjustments_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_adjustments" ADD CONSTRAINT "score_adjustments_adjusted_by_users_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "score_adjustments_enrollment_type_unique" ON "score_adjustments" USING btree ("enrollment_id","score_type");--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_undergrad_university_id_universities_id_fk" FOREIGN KEY ("undergrad_university_id") REFERENCES "public"."universities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_undergrad_course_id_courses_id_fk" FOREIGN KEY ("undergrad_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;