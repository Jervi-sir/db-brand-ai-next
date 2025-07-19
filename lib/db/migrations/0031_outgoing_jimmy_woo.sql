CREATE TABLE IF NOT EXISTS "SplitPromptHistory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modelId" uuid NOT NULL,
	"prompt" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userEmail" varchar(128),
	"isCurrent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SplitPromptHistory" ADD CONSTRAINT "SplitPromptHistory_modelId_AIModel_id_fk" FOREIGN KEY ("modelId") REFERENCES "public"."AIModel"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
