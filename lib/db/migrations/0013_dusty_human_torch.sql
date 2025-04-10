ALTER TABLE "OpenAiApiUsage" DROP CONSTRAINT "OpenAiApiUsage_chatId_Chat_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "OpenAiApiUsage" ADD CONSTRAINT "OpenAiApiUsage_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
