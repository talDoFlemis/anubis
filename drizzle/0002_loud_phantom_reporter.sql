CREATE TYPE "public"."research_theme_level" AS ENUM('masters', 'doctoral');--> statement-breakpoint
CREATE TABLE "research_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professor_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"vacancies" integer NOT NULL,
	"level" "research_theme_level" NOT NULL,
	"references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_themes" ADD CONSTRAINT "research_themes_professor_id_professor_user_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professor"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "research_themes_level_idx" ON "research_themes" USING btree ("level");--> statement-breakpoint
CREATE INDEX "research_themes_professor_id_idx" ON "research_themes" USING btree ("professor_id");