ALTER TABLE "users" ADD COLUMN "auth_provider" "auth_provider" DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_subject" varchar(255);--> statement-breakpoint
UPDATE "users"
SET "provider_subject" = lower("email")
WHERE "auth_provider" = 'email' AND "email" IS NOT NULL;--> statement-breakpoint
UPDATE "users" u
SET
  "auth_provider" = a."provider",
  "provider_subject" = a."social_id"
FROM "accounts" a
WHERE a."user_id" = u."id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_provider_subject_required" CHECK (
  ("auth_provider" = 'email' AND "provider_subject" IS NOT NULL AND "password" IS NOT NULL)
  OR ("auth_provider" <> 'email' AND "provider_subject" IS NOT NULL)
);--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_provider_subject_unique" ON "users" USING btree ("auth_provider", "provider_subject");--> statement-breakpoint
DROP TABLE "accounts" CASCADE;
