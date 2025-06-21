-- =================================================================
-- 1. Enable RLS for all relevant tables
-- Ensures all tables that should be protected have RLS turned on.
-- =================================================================
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."user_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."user_subcodes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."user_code_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."user_default_code_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."daily_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."daily_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."memos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."daily_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."weekly_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."weekly_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."monthly_goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."monthly_reflections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."community_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."shared_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."stats_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- =================================================================
-- 2. Create Indexes IF NOT EXISTS for performance
-- =================================================================
CREATE INDEX IF NOT EXISTS "community_comments_post_id_idx" ON "community_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_comments_profile_id_idx" ON "community_comments" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_posts_profile_id_idx" ON "community_posts" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_notes_profile_id_idx" ON "daily_notes" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_records_profile_id_idx" ON "daily_records" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memos_record_id_idx" ON "memos" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memos_profile_id_idx" ON "memos" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_participant1_id_idx" ON "conversations" USING btree ("participant1_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_participant2_id_idx" ON "conversations" USING btree ("participant2_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_recipient_id_idx" ON "notifications" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_actor_id_idx" ON "notifications" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_plans_profile_id_idx" ON "daily_plans" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monthly_goals_profile_id_idx" ON "monthly_goals" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_notes_profile_id_idx" ON "weekly_notes" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_tasks_profile_id_idx" ON "weekly_tasks" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_categories_profile_id_idx" ON "user_categories" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_subcodes_profile_id_idx" ON "user_subcodes" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shared_links_profile_id_idx" ON "shared_links" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stats_cache_profile_id_idx" ON "stats_cache" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follows_following_id_idx" ON "follows" USING btree ("following_id");--> statement-breakpoint

-- =================================================================
-- 3. DROP and RECREATE all RLS policies to ensure consistency
-- This makes the script idempotent.
-- =================================================================

-- daily_notes: RENAME daily_notes_rls to "Allow full access for owners"
DROP POLICY IF EXISTS "daily_notes_rls" ON "daily_notes";--> statement-breakpoint
DROP POLICY IF EXISTS "Allow full access for owners" ON "daily_notes";--> statement-breakpoint
CREATE POLICY "Allow full access for owners" ON "daily_notes" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "daily_notes"."profile_id") WITH CHECK ((select auth.uid()) = "daily_notes"."profile_id");--> statement-breakpoint

-- daily_records & memos: DROP old policies
DROP POLICY IF EXISTS "daily_records_rls" ON "daily_records" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "memos_rls" ON "memos" CASCADE;--> statement-breakpoint

-- stats_cache: CREATE new policy
DROP POLICY IF EXISTS "Allow users to manage their own stats cache" ON "stats_cache";--> statement-breakpoint
CREATE POLICY "Allow users to manage their own stats cache" ON "stats_cache" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "stats_cache"."profile_id") WITH CHECK ((select auth.uid()) = "stats_cache"."profile_id");--> statement-breakpoint

-- conversations: ALTER conversations_rls
DROP POLICY IF EXISTS "conversations_rls" ON "conversations";--> statement-breakpoint
CREATE POLICY "conversations_rls" ON "conversations" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "conversations"."participant1_id" OR (select auth.uid()) = "conversations"."participant2_id") WITH CHECK ((select auth.uid()) = "conversations"."participant1_id" OR (select auth.uid()) = "conversations"."participant2_id");--> statement-breakpoint

-- messages: ALTER messages_rls
DROP POLICY IF EXISTS "messages_rls" ON "messages";--> statement-breakpoint
CREATE POLICY "messages_rls" ON "messages" AS PERMISSIVE FOR ALL TO authenticated USING (
            (select auth.uid()) = "messages"."sender_id" OR
            (
                SELECT true
                FROM conversations c
                WHERE c.id = "messages"."conversation_id"
                AND (c.participant1_id = (select auth.uid()) OR c.participant2_id = (select auth.uid()))
            )
        ) WITH CHECK (
            (select auth.uid()) = "messages"."sender_id" AND
            (
                SELECT true
                FROM conversations c
                WHERE c.id = "messages"."conversation_id"
                AND (c.participant1_id = (select auth.uid()) OR c.participant2_id = (select auth.uid()))
            )
        );--> statement-breakpoint

-- All other simple ALTERs
DROP POLICY IF EXISTS "daily_plans_rls" ON "daily_plans";--> statement-breakpoint
CREATE POLICY "daily_plans_rls" ON "daily_plans" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "daily_plans"."profile_id") WITH CHECK ((select auth.uid()) = "daily_plans"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "monthly_goals_rls" ON "monthly_goals";--> statement-breakpoint
CREATE POLICY "monthly_goals_rls" ON "monthly_goals" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "monthly_goals"."profile_id") WITH CHECK ((select auth.uid()) = "monthly_goals"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "monthly_reflections_rls" ON "monthly_reflections";--> statement-breakpoint
CREATE POLICY "monthly_reflections_rls" ON "monthly_reflections" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "monthly_reflections"."profile_id") WITH CHECK ((select auth.uid()) = "monthly_reflections"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "weekly_notes_rls" ON "weekly_notes";--> statement-breakpoint
CREATE POLICY "weekly_notes_rls" ON "weekly_notes" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "weekly_notes"."profile_id") WITH CHECK ((select auth.uid()) = "weekly_notes"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "weekly_tasks_rls" ON "weekly_tasks";--> statement-breakpoint
CREATE POLICY "weekly_tasks_rls" ON "weekly_tasks" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "weekly_tasks"."profile_id") WITH CHECK ((select auth.uid()) = "weekly_tasks"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "user_categories_rls" ON "user_categories";--> statement-breakpoint
CREATE POLICY "user_categories_rls" ON "user_categories" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "user_categories"."profile_id") WITH CHECK ((select auth.uid()) = "user_categories"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "user_code_settings_rls" ON "user_code_settings";--> statement-breakpoint
CREATE POLICY "user_code_settings_rls" ON "user_code_settings" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "user_code_settings"."profile_id") WITH CHECK ((select auth.uid()) = "user_code_settings"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "user_default_code_preferences_rls" ON "user_default_code_preferences";--> statement-breakpoint
CREATE POLICY "user_default_code_preferences_rls" ON "user_default_code_preferences" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "user_default_code_preferences"."profile_id") WITH CHECK ((select auth.uid()) = "user_default_code_preferences"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "user_subcodes_rls" ON "user_subcodes";--> statement-breakpoint
CREATE POLICY "user_subcodes_rls" ON "user_subcodes" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "user_subcodes"."profile_id") WITH CHECK ((select auth.uid()) = "user_subcodes"."profile_id");--> statement-breakpoint
DROP POLICY IF EXISTS "Allow users to manage their own shared links" ON "shared_links";--> statement-breakpoint
CREATE POLICY "Allow users to manage their own shared links" ON "shared_links" AS PERMISSIVE FOR ALL TO authenticated USING ((select auth.uid()) = "shared_links"."profile_id") WITH CHECK ((select auth.uid()) = "shared_links"."profile_id");--> statement-breakpoint

-- =================================================================
-- 4. Secure Functions
-- Set search_path to prevent security warnings.
-- =================================================================
ALTER FUNCTION public.delete_user() SET search_path = '';--> statement-breakpoint
-- Also apply to handle_new_user defensively, in case it exists on the DB
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = '';
  END IF;
END;
$$;--> statement-breakpoint