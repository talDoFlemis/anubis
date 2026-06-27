ALTER TABLE "cv_items" ADD COLUMN "validated_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "score_validated" numeric(7, 2);