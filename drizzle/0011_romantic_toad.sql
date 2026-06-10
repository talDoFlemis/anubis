ALTER TABLE "users" drop column "search_vector";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (
      to_tsvector(
        'simple',
        coalesce(first_name, '') || ' ' ||
        coalesce(last_name, '') || ' ' ||
        coalesce(email, '')
      )) STORED;