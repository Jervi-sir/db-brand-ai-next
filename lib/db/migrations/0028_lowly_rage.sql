CREATE TABLE IF NOT EXISTS "GeneratedSplitHistory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"client_persona" text,
	"hook_type" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sub_pillars" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GeneratedSplitHistory" ADD CONSTRAINT "GeneratedSplitHistory_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
