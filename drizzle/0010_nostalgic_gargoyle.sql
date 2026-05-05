CREATE TABLE "professor" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"department" varchar(255) NOT NULL,
	"institution" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "professor" ADD CONSTRAINT "professor_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;