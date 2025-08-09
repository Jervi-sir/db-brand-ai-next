ALTER TABLE "SplitPromptHistory" ALTER COLUMN "modelId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "SplitPromptHistory" ADD COLUMN "modelCodeName" varchar(128);