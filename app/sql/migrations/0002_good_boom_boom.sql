CREATE TABLE "stats_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"month_date" text NOT NULL,
	"category_distribution" jsonb NOT NULL,
	"time_analysis" jsonb NOT NULL,
	"activity_heatmap" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "share_settings" DROP CONSTRAINT "share_settings_profile_id_unique";--> statement-breakpoint
ALTER TABLE "share_settings" DROP CONSTRAINT "share_settings_share_link_token_unique";--> statement-breakpoint
ALTER TABLE "share_settings" DROP CONSTRAINT "share_settings_profile_id_profiles_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "profile_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "share_settings" DROP COLUMN "share_link_token";