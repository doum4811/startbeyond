CREATE TABLE "community_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"date" date NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"date" date NOT NULL,
	"category_code" varchar(10) NOT NULL,
	"subcode" text,
	"duration_minutes" integer,
	"comment" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"linked_plan_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant1_id" uuid NOT NULL,
	"participant2_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"actor_id" uuid,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"resource_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"plan_date" date NOT NULL,
	"category_code" varchar(10) NOT NULL,
	"subcode" text,
	"duration_minutes" integer,
	"comment" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"linked_weekly_task_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monthly_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"month_date" date NOT NULL,
	"category_code" varchar(10) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"success_criteria" jsonb,
	"weekly_breakdown" jsonb,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monthly_goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monthly_reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"month_date" date NOT NULL,
	"monthly_reflection" text,
	"monthly_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monthly_reflections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "weekly_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"week_start_date" date NOT NULL,
	"critical_success_factor" text,
	"weekly_see" text,
	"words_of_praise" text,
	"weekly_goal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "weekly_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"week_start_date" date NOT NULL,
	"category_code" varchar(10) NOT NULL,
	"subcode" text,
	"comment" text NOT NULL,
	"days" jsonb,
	"is_locked" boolean DEFAULT false NOT NULL,
	"from_monthly_goal_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"code" varchar(10) NOT NULL,
	"label" text NOT NULL,
	"icon" text,
	"color" varchar(7),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_code_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"enable_autocomplete" boolean DEFAULT true NOT NULL,
	"enable_recommendation" boolean DEFAULT true NOT NULL,
	"recommendation_source" varchar(20) DEFAULT 'frequency' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_code_settings_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
ALTER TABLE "user_code_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_default_code_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"default_category_code" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_default_code_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_subcodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"parent_category_code" varchar(10) NOT NULL,
	"subcode" text NOT NULL,
	"description" text,
	"frequency_score" integer DEFAULT 0 NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_subcodes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shared_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"token" text NOT NULL,
	"page_type" text NOT NULL,
	"period" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shared_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "shared_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stats_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"month_date" text NOT NULL,
	"category_distribution" jsonb NOT NULL,
	"activity_heatmap" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"avatar_url" text,
	"full_name" text NOT NULL,
	"username" text NOT NULL,
	"headline" text,
	"bio" text,
	"daily_record_visibility" text DEFAULT 'followers' NOT NULL,
	"stats" jsonb,
	"views" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_notes" ADD CONSTRAINT "daily_notes_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memos" ADD CONSTRAINT "memos_record_id_daily_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."daily_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memos" ADD CONSTRAINT "memos_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant1_id_fkey" FOREIGN KEY ("participant1_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant2_id_fkey" FOREIGN KEY ("participant2_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_profile_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_profiles_profile_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_profiles_profile_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_goals" ADD CONSTRAINT "monthly_goals_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_reflections" ADD CONSTRAINT "monthly_reflections_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_notes" ADD CONSTRAINT "weekly_notes_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_tasks" ADD CONSTRAINT "weekly_tasks_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_code_settings" ADD CONSTRAINT "user_code_settings_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_default_code_preferences" ADD CONSTRAINT "user_default_code_preferences_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subcodes" ADD CONSTRAINT "user_subcodes_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_cache" ADD CONSTRAINT "stats_cache_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_profiles_profile_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_profiles_profile_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_profile_id_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_reflections_profile_month_idx" ON "monthly_reflections" USING btree ("profile_id","month_date");--> statement-breakpoint
CREATE UNIQUE INDEX "user_default_pref_profile_code_idx" ON "user_default_code_preferences" USING btree ("profile_id","default_category_code");--> statement-breakpoint
CREATE UNIQUE INDEX "shared_links_profile_page_period_idx" ON "shared_links" USING btree ("profile_id","page_type","period");--> statement-breakpoint
CREATE UNIQUE INDEX "stats_cache_profile_month_idx" ON "stats_cache" USING btree ("profile_id","month_date");--> statement-breakpoint
CREATE POLICY "daily_notes_rls" ON "daily_notes" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "daily_notes"."profile_id") WITH CHECK (auth.uid() = "daily_notes"."profile_id");--> statement-breakpoint
CREATE POLICY "daily_records_rls" ON "daily_records" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "daily_records"."profile_id") WITH CHECK (auth.uid() = "daily_records"."profile_id");--> statement-breakpoint
CREATE POLICY "memos_rls" ON "memos" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "memos"."profile_id") WITH CHECK (auth.uid() = "memos"."profile_id");--> statement-breakpoint
CREATE POLICY "conversations_rls" ON "conversations" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "conversations"."participant1_id" OR auth.uid() = "conversations"."participant2_id") WITH CHECK (auth.uid() = "conversations"."participant1_id" OR auth.uid() = "conversations"."participant2_id");--> statement-breakpoint
CREATE POLICY "messages_rls" ON "messages" AS PERMISSIVE FOR ALL TO "authenticated" USING (
            auth.uid() = "messages"."sender_id" OR
            (
                SELECT true
                FROM conversations c
                WHERE c.id = "messages"."conversation_id"
                AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
            )
        ) WITH CHECK (
            auth.uid() = "messages"."sender_id" AND
            (
                SELECT true
                FROM conversations c
                WHERE c.id = "messages"."conversation_id"
                AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
            )
        );--> statement-breakpoint
CREATE POLICY "daily_plans_rls" ON "daily_plans" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "daily_plans"."profile_id") WITH CHECK (auth.uid() = "daily_plans"."profile_id");--> statement-breakpoint
CREATE POLICY "monthly_goals_rls" ON "monthly_goals" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "monthly_goals"."profile_id") WITH CHECK (auth.uid() = "monthly_goals"."profile_id");--> statement-breakpoint
CREATE POLICY "monthly_reflections_rls" ON "monthly_reflections" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "monthly_reflections"."profile_id") WITH CHECK (auth.uid() = "monthly_reflections"."profile_id");--> statement-breakpoint
CREATE POLICY "weekly_notes_rls" ON "weekly_notes" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "weekly_notes"."profile_id") WITH CHECK (auth.uid() = "weekly_notes"."profile_id");--> statement-breakpoint
CREATE POLICY "weekly_tasks_rls" ON "weekly_tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "weekly_tasks"."profile_id") WITH CHECK (auth.uid() = "weekly_tasks"."profile_id");--> statement-breakpoint
CREATE POLICY "user_categories_rls" ON "user_categories" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_categories"."profile_id") WITH CHECK (auth.uid() = "user_categories"."profile_id");--> statement-breakpoint
CREATE POLICY "user_code_settings_rls" ON "user_code_settings" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_code_settings"."profile_id") WITH CHECK (auth.uid() = "user_code_settings"."profile_id");--> statement-breakpoint
CREATE POLICY "user_default_code_preferences_rls" ON "user_default_code_preferences" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_default_code_preferences"."profile_id") WITH CHECK (auth.uid() = "user_default_code_preferences"."profile_id");--> statement-breakpoint
CREATE POLICY "user_subcodes_rls" ON "user_subcodes" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_subcodes"."profile_id") WITH CHECK (auth.uid() = "user_subcodes"."profile_id");--> statement-breakpoint
CREATE POLICY "Allow users to manage their own shared links" ON "shared_links" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "shared_links"."profile_id") WITH CHECK (auth.uid() = "shared_links"."profile_id");