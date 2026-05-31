-- Add search_vector generated columns and GIN indexes to universities and courses

ALTER TABLE "universities"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(abbreviation, ''))) STORED;

CREATE INDEX "universities_search_vector_gin_idx" ON "universities" USING gin ("search_vector");

ALTER TABLE "courses"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, ''))) STORED;

CREATE INDEX "courses_search_vector_gin_idx" ON "courses" USING gin ("search_vector");
