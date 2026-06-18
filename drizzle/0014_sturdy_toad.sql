CREATE TYPE "public"."undergrad_degree_type" AS ENUM('bacharelado', 'licenciatura', 'tecnologo');--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "undergrad_university" varchar(255);--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "undergrad_course" varchar(255);--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "undergrad_degree_type" "undergrad_degree_type";--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "ira" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "candidates" DROP COLUMN "university_of_origin";--> statement-breakpoint
ALTER TABLE "candidates" DROP COLUMN "ira";