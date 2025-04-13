CREATE TABLE IF NOT EXISTS "CodeUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"codeId" uuid NOT NULL,
	"usedAt" timestamp DEFAULT now() NOT NULL,
	"isSuccess" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"maxUses" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	CONSTRAINT "Codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "usedCode" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CodeUsage" ADD CONSTRAINT "CodeUsage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CodeUsage" ADD CONSTRAINT "CodeUsage_codeId_Codes_id_fk" FOREIGN KEY ("codeId") REFERENCES "public"."Codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
