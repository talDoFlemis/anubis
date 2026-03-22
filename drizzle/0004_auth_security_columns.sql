ALTER TABLE "users" ADD COLUMN "bootstrap_password_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "confirm_email_token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "forgot_password_token_version" integer DEFAULT 0 NOT NULL;
