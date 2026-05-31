ALTER TABLE "users" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector(
        'simple',
        coalesce("users"."first_name", '') || ' ' ||
        coalesce("users"."last_name", '') || ' ' ||
        coalesce("users"."email", '')
      )) STORED;--> statement-breakpoint
CREATE INDEX "users_search_vector_gin_idx" ON "users" USING gin ("search_vector");