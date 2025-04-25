CREATE TABLE IF NOT EXISTS "Content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"mood" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"stage" varchar(50) DEFAULT 'script' NOT NULL,
	"scheduledDate" timestamp,
	"deadline" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Content" ADD CONSTRAINT "Content_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
