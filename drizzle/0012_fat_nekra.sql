ALTER TABLE "cv_items" ADD COLUMN "classification" varchar(50);--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "is_complete" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "is_resumo" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "is_periodico" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "is_autor_principal" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "is_dissertacao" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "is_encontro_ic" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "is_in_area" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "docencia_type" varchar(50);--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "evento_type" varchar(50);--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "is_verified" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "corrected_classification" varchar(50);--> statement-breakpoint
ALTER TABLE "cv_items" ADD COLUMN "verification_comment" text;