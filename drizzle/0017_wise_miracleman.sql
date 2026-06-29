CREATE TYPE "public"."evaluation_concept" AS ENUM('FRACO', 'REGULAR', 'BOM', 'OTIMO');--> statement-breakpoint
CREATE TYPE "public"."project_evaluation_concept" AS ENUM('FRACO', 'REGULAR', 'BOM', 'OTIMO');--> statement-breakpoint
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
ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evaluations" ADD CONSTRAINT "project_evaluations_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evaluations" ADD CONSTRAINT "project_evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;