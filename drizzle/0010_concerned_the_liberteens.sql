ALTER TABLE "enrollments" ADD COLUMN "primary_theme_id" uuid;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "secondary_theme_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, ''))) STORED;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(abbreviation, ''))) STORED;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_primary_theme_id_research_themes_id_fk" FOREIGN KEY ("primary_theme_id") REFERENCES "public"."research_themes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_secondary_theme_id_research_themes_id_fk" FOREIGN KEY ("secondary_theme_id") REFERENCES "public"."research_themes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "courses_search_vector_gin_idx" ON "courses" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "universities_search_vector_gin_idx" ON "universities" USING gin ("search_vector");