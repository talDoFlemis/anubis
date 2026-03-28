CREATE TYPE "public"."account_entry_type" AS ENUM('provider_link', 'attached_email');--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "entry_type" "account_entry_type" DEFAULT 'provider_link' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "attached_email" varchar(255);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "attached_email_normalized" varchar(255);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "attached_email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "attached_email_verification_token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DROP INDEX "accounts_user_provider_unique";--> statement-breakpoint
DROP INDEX "accounts_provider_social_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_user_provider_unique" ON "accounts" USING btree ("user_id", "provider") WHERE "accounts"."entry_type" = 'provider_link';--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_social_unique" ON "accounts" USING btree ("provider", "social_id") WHERE "accounts"."entry_type" = 'provider_link';--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_attached_email_normalized_unique" ON "accounts" USING btree ("attached_email_normalized") WHERE "accounts"."entry_type" = 'attached_email' AND "accounts"."attached_email_normalized" IS NOT NULL;
