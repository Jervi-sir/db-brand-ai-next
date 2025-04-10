CREATE TABLE IF NOT EXISTS "OpenAiApiUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"model" varchar(64) NOT NULL,
	"type" varchar(64) NOT NULL,
	"promptTokens" integer NOT NULL,
	"completionTokens" integer NOT NULL,
	"totalTokens" integer NOT NULL,
	"duration" numeric,
	"completedAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "AIModel" ADD COLUMN "provider" varchar(64) DEFAULT 'openai' NOT NULL;--> statement-breakpoint
ALTER TABLE "AIModel" ADD COLUMN "displayName" varchar(64);--> statement-breakpoint
ALTER TABLE "AIModel" ADD COLUMN "type" varchar(64);--> statement-breakpoint
ALTER TABLE "AIModel" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "AIModel" ADD COLUMN "maxTokens" integer;--> statement-breakpoint
ALTER TABLE "AIModel" ADD COLUMN "temperature" integer;--> statement-breakpoint
ALTER TABLE "AIModel" ADD COLUMN "customPrompts" text;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "threadId" varchar(64);--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "model" varchar(64) DEFAULT 'gpt-4o-mini';--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "promptTokens" integer;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "completionTokens" integer;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "totalTokens" integer;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "duration" numeric;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "OpenAiApiUsage" ADD CONSTRAINT "OpenAiApiUsage_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
