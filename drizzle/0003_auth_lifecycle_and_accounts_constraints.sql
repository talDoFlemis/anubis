ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_user_provider_unique" ON "accounts" USING btree ("user_id", "provider");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_social_unique" ON "accounts" USING btree ("provider", "social_id");--> statement-breakpoint
INSERT INTO "accounts" ("user_id", "provider", "social_id")
SELECT "users"."id", 'email', NULL
FROM "users"
WHERE "users"."password" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "accounts"
    WHERE "accounts"."user_id" = "users"."id"
      AND "accounts"."provider" = 'email'
  );
