ALTER TABLE "community_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "community_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "monthly_goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "monthly_reflections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "weekly_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "weekly_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_code_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_default_code_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_subcodes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "share_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stats_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "community_comments_rls" ON "community_comments" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "community_comments"."profile_id") WITH CHECK (auth.uid() = "community_comments"."profile_id");--> statement-breakpoint
CREATE POLICY "community_posts_rls" ON "community_posts" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "community_posts"."profile_id") WITH CHECK (auth.uid() = "community_posts"."profile_id");--> statement-breakpoint
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
CREATE POLICY "notifications_rls" ON "notifications" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "notifications"."recipient_id") WITH CHECK (auth.uid() = "notifications"."recipient_id");--> statement-breakpoint
CREATE POLICY "daily_plans_rls" ON "daily_plans" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "daily_plans"."profile_id") WITH CHECK (auth.uid() = "daily_plans"."profile_id");--> statement-breakpoint
CREATE POLICY "monthly_goals_rls" ON "monthly_goals" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "monthly_goals"."profile_id") WITH CHECK (auth.uid() = "monthly_goals"."profile_id");--> statement-breakpoint
CREATE POLICY "monthly_reflections_rls" ON "monthly_reflections" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "monthly_reflections"."profile_id") WITH CHECK (auth.uid() = "monthly_reflections"."profile_id");--> statement-breakpoint
CREATE POLICY "weekly_notes_rls" ON "weekly_notes" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "weekly_notes"."profile_id") WITH CHECK (auth.uid() = "weekly_notes"."profile_id");--> statement-breakpoint
CREATE POLICY "weekly_tasks_rls" ON "weekly_tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "weekly_tasks"."profile_id") WITH CHECK (auth.uid() = "weekly_tasks"."profile_id");--> statement-breakpoint
CREATE POLICY "user_categories_rls" ON "user_categories" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_categories"."profile_id") WITH CHECK (auth.uid() = "user_categories"."profile_id");--> statement-breakpoint
CREATE POLICY "user_code_settings_rls" ON "user_code_settings" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_code_settings"."profile_id") WITH CHECK (auth.uid() = "user_code_settings"."profile_id");--> statement-breakpoint
CREATE POLICY "user_default_code_preferences_rls" ON "user_default_code_preferences" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_default_code_preferences"."profile_id") WITH CHECK (auth.uid() = "user_default_code_preferences"."profile_id");--> statement-breakpoint
CREATE POLICY "user_subcodes_rls" ON "user_subcodes" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_subcodes"."profile_id") WITH CHECK (auth.uid() = "user_subcodes"."profile_id");--> statement-breakpoint
CREATE POLICY "share_settings_rls" ON "share_settings" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid()::text = "share_settings"."profile_id") WITH CHECK (auth.uid()::text = "share_settings"."profile_id");--> statement-breakpoint
CREATE POLICY "stats_cache_rls" ON "stats_cache" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid()::text = "stats_cache"."profile_id") WITH CHECK (auth.uid()::text = "stats_cache"."profile_id");