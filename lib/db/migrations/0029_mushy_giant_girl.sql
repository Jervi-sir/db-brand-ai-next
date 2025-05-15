ALTER TABLE "GeneratedSplitHistory" ALTER COLUMN "client_persona" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "GeneratedSplitHistory" ADD COLUMN "content_pillar" text NOT NULL;--> statement-breakpoint
ALTER TABLE "GeneratedSplitHistory" ADD COLUMN "chosen_sub_pillars" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "GeneratedSplitHistory" ADD COLUMN "scripts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "GeneratedSplitHistory" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;