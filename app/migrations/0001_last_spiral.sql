CREATE TABLE "follows" (
	"follower_id" uuid,
	"following_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"avatar_url" text,
	"full_name" text NOT NULL,
	"username" text NOT NULL,
	"headline" text,
	"bio" text,
	"stats" jsonb,
	"views" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_notes" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "daily_records" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "daily_records" RENAME COLUMN "duration" TO "duration_minutes";--> statement-breakpoint
ALTER TABLE "daily_records" RENAME COLUMN "public" TO "is_public";--> statement-breakpoint
ALTER TABLE "memos" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "daily_plans" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "daily_plans" RENAME COLUMN "date" TO "plan_date";--> statement-breakpoint
ALTER TABLE "daily_plans" RENAME COLUMN "duration" TO "duration_minutes";--> statement-breakpoint
ALTER TABLE "monthly_goals" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "monthly_reflections" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "weekly_notes" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "weekly_tasks" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "user_categories" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "user_categories" RENAME COLUMN "category_code" TO "code";--> statement-breakpoint
ALTER TABLE "user_code_settings" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "user_default_code_preferences" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "user_subcodes" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "user_subcodes" RENAME COLUMN "category_code" TO "parent_category_code";--> statement-breakpoint
ALTER TABLE "share_settings" RENAME COLUMN "user_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "user_code_settings" DROP CONSTRAINT "user_code_settings_user_id_unique";--> statement-breakpoint
ALTER TABLE "share_settings" DROP CONSTRAINT "share_settings_user_id_unique";--> statement-breakpoint
ALTER TABLE "daily_notes" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_notes" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_records" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_records" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "record_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_plans" ALTER COLUMN "is_completed" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_plans" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_plans" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_goals" ALTER COLUMN "is_completed" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_goals" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_goals" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_reflections" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_reflections" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_notes" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_notes" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_tasks" ALTER COLUMN "is_locked" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_tasks" ALTER COLUMN "sort_order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_tasks" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_tasks" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_categories" ALTER COLUMN "sort_order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_categories" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_categories" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_categories" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_code_settings" ALTER COLUMN "enable_autocomplete" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_code_settings" ALTER COLUMN "enable_recommendation" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_code_settings" ALTER COLUMN "recommendation_source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_code_settings" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_code_settings" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_default_code_preferences" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_default_code_preferences" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_default_code_preferences" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subcodes" ALTER COLUMN "frequency_score" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subcodes" ALTER COLUMN "is_favorite" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subcodes" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subcodes" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "is_public" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "include_records" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "include_daily_notes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "include_memos" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "include_stats" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "share_settings" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_profiles_profile_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_profiles_profile_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_profile_id_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_notes" ADD CONSTRAINT "daily_notes_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memos" ADD CONSTRAINT "memos_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_goals" ADD CONSTRAINT "monthly_goals_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_reflections" ADD CONSTRAINT "monthly_reflections_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_notes" ADD CONSTRAINT "weekly_notes_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_tasks" ADD CONSTRAINT "weekly_tasks_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_code_settings" ADD CONSTRAINT "user_code_settings_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_default_code_preferences" ADD CONSTRAINT "user_default_code_preferences_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subcodes" ADD CONSTRAINT "user_subcodes_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_settings" ADD CONSTRAINT "share_settings_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_records" DROP COLUMN "unit";--> statement-breakpoint
ALTER TABLE "daily_plans" DROP COLUMN "unit";--> statement-breakpoint
ALTER TABLE "user_code_settings" ADD CONSTRAINT "user_code_settings_profile_id_unique" UNIQUE("profile_id");--> statement-breakpoint
ALTER TABLE "share_settings" ADD CONSTRAINT "share_settings_profile_id_unique" UNIQUE("profile_id");