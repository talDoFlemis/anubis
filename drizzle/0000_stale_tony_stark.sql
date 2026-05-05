CREATE TYPE "public"."auth_provider" AS ENUM('email', 'google');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('professor', 'candidate', 'mdcc-secretary', 'post-graduate-coordinator', 'post-graduate-vice-coordinator');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "candidates" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"university_of_origin" varchar(255) NOT NULL,
	"ira" numeric(5, 2),
	"poscomp" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professor" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"department" varchar(255) NOT NULL,
	"institution" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_provider" "auth_provider" DEFAULT 'email' NOT NULL,
	"provider_subject" varchar(255),
	"email" varchar(255),
	"cpf" varchar(11),
	"password" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"role" "role" DEFAULT 'candidate' NOT NULL,
	"status" "status" DEFAULT 'inactive' NOT NULL,
	"onboarding_completed" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"bootstrap_password_expires_at" timestamp with time zone,
	"confirm_email_token_version" integer DEFAULT 0 NOT NULL,
	"forgot_password_token_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor" ADD CONSTRAINT "professor_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "session" USING btree ("expire");