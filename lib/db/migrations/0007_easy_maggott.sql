CREATE TABLE IF NOT EXISTS "AIModel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"endpoint" varchar(256) NOT NULL,
	"apiKey" varchar(128),
	"capability" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "SubscriptionModel" (
	"subscriptionPlanId" uuid NOT NULL,
	"aiModelId" uuid NOT NULL,
	CONSTRAINT "SubscriptionModel_subscriptionPlanId_aiModelId_pk" PRIMARY KEY("subscriptionPlanId","aiModelId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"capabilities" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserSubscription" (
	"userId" uuid NOT NULL,
	"subscriptionPlanId" uuid NOT NULL,
	"subscribedAt" timestamp DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	CONSTRAINT "UserSubscription_userId_subscriptionPlanId_pk" PRIMARY KEY("userId","subscriptionPlanId")
);
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "capability" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SubscriptionModel" ADD CONSTRAINT "SubscriptionModel_subscriptionPlanId_SubscriptionPlan_id_fk" FOREIGN KEY ("subscriptionPlanId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SubscriptionModel" ADD CONSTRAINT "SubscriptionModel_aiModelId_AIModel_id_fk" FOREIGN KEY ("aiModelId") REFERENCES "public"."AIModel"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_subscriptionPlanId_SubscriptionPlan_id_fk" FOREIGN KEY ("subscriptionPlanId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
