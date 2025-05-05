CREATE TABLE IF NOT EXISTS "ScriptHistory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id" uuid,
	"user_prompt" text NOT NULL,
	"topic_prompt" text,
	"content_idea" varchar(255) NOT NULL,
	"hook_type" varchar(255) NOT NULL,
	"generated_scripts" jsonb NOT NULL,
	"used_model_id" varchar(255),
	"token_usage" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ScriptHistory" ADD CONSTRAINT "ScriptHistory_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ScriptHistory" ADD CONSTRAINT "ScriptHistory_content_id_Content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."Content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_script_history_user_id" ON "ScriptHistory" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_script_history_created_at" ON "ScriptHistory" USING btree ("created_at");