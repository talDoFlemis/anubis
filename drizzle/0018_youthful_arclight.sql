CREATE TYPE "public"."stage" AS ENUM('mestrado', 'doutorado');--> statement-breakpoint
CREATE TYPE "public"."evaluation_concept" AS ENUM('FRACO', 'REGULAR', 'BOM', 'OTIMO');--> statement-breakpoint
CREATE TYPE "public"."project_evaluation_concept" AS ENUM('FRACO', 'REGULAR', 'BOM', 'OTIMO');--> statement-breakpoint
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
CREATE TABLE "interview_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"evaluator_id" uuid NOT NULL,
	"decision_making" "evaluation_concept" NOT NULL,
	"problem_analysis" "evaluation_concept" NOT NULL,
	"oral_communication" "evaluation_concept" NOT NULL,
	"research_work" "evaluation_concept" NOT NULL,
	"technical_knowledge" "evaluation_concept" NOT NULL,
	"observations" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"evaluator_id" uuid NOT NULL,
	"criterion_1" "project_evaluation_concept" NOT NULL,
	"criterion_2" "project_evaluation_concept" NOT NULL,
	"criterion_3" "project_evaluation_concept" NOT NULL,
	"criterion_4" "project_evaluation_concept" NOT NULL,
	"criterion_5" "project_evaluation_concept" NOT NULL,
	"observations" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "verification_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "adjusted_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "verification_justification" text;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "verified_by" uuid;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "undergrad_university_id" uuid;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "undergrad_course_id" uuid;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "mec_factor" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "ira_adjusted" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "mec_score" integer;--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_research_theme_id_research_themes_id_fk" FOREIGN KEY ("research_theme_id") REFERENCES "public"."research_themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evaluations" ADD CONSTRAINT "project_evaluations_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evaluations" ADD CONSTRAINT "project_evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_evaluator_candidate_interview" ON "interview_evaluations" USING btree ("evaluator_id","candidate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_evaluator_candidate_project" ON "project_evaluations" USING btree ("evaluator_id","candidate_id");--> statement-breakpoint
ALTER TABLE "cv_items" ADD CONSTRAINT "cv_items_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_undergrad_university_id_universities_id_fk" FOREIGN KEY ("undergrad_university_id") REFERENCES "public"."universities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_undergrad_course_id_courses_id_fk" FOREIGN KEY ("undergrad_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_items" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "cv_items" DROP COLUMN "corrected_classification";--> statement-breakpoint
ALTER TABLE "cv_items" DROP COLUMN "verification_comment";--> statement-breakpoint
ALTER TABLE "enrollments" DROP COLUMN "undergrad_university";--> statement-breakpoint
ALTER TABLE "enrollments" DROP COLUMN "undergrad_course";