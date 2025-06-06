CREATE TABLE "share_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"include_records" boolean DEFAULT true NOT NULL,
	"include_daily_notes" boolean DEFAULT true NOT NULL,
	"include_memos" boolean DEFAULT false NOT NULL,
	"include_stats" boolean DEFAULT true NOT NULL,
	"share_link_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stats_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"month_date" text NOT NULL,
	"category_distribution" jsonb NOT NULL,
	"time_analysis" jsonb NOT NULL,
	"activity_heatmap" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
