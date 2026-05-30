CREATE TABLE "research_theme_professors" (
	"research_theme_id" uuid NOT NULL,
	"professor_id" uuid NOT NULL,
	CONSTRAINT "research_theme_professors_research_theme_id_professor_id_pk" PRIMARY KEY("research_theme_id","professor_id")
);
--> statement-breakpoint
ALTER TABLE "research_theme_professors" ADD CONSTRAINT "research_theme_professors_research_theme_id_research_themes_id_fk" FOREIGN KEY ("research_theme_id") REFERENCES "public"."research_themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_theme_professors" ADD CONSTRAINT "research_theme_professors_professor_id_professor_user_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professor"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "research_theme_professors_research_theme_id_idx" ON "research_theme_professors" USING btree ("research_theme_id");--> statement-breakpoint
CREATE INDEX "research_theme_professors_professor_id_idx" ON "research_theme_professors" USING btree ("professor_id");