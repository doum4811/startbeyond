-- This migration refactors RLS policies for performance and clarity based on Supabase Linter feedback.
-- It addresses two main issues:
-- 1. Replaces `auth.uid()` with `(select auth.uid())` to prevent re-evaluation for each row.
-- 2. Consolidates multiple permissive policies for the same role and action into a single policy.

-- =================================================================
-- Table: profiles
-- =================================================================
-- Consolidate multiple UPDATE policies and optimize auth.uid()
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow owners to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
-- Consolidate multiple SELECT policies
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read-only access to profiles" ON public.profiles;

-- New, optimized policies for 'profiles'
CREATE POLICY "Allow public read access"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow individual insert access"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Allow individual update access"
  ON public.profiles FOR UPDATE TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));


-- =================================================================
-- Table: follows
-- =================================================================
-- Consolidate SELECT, INSERT, DELETE policies into a single FOR ALL policy
DROP POLICY IF EXISTS "Allow users to see their own follow relationships" ON public.follows;
DROP POLICY IF EXISTS "Allow users to follow others" ON public.follows;
DROP POLICY IF EXISTS "Allow users to unfollow others" ON public.follows;

-- New, optimized policy for 'follows'
CREATE POLICY "Allow users to manage their own follow relationships"
  ON public.follows FOR ALL TO authenticated
  USING (follower_id = (select auth.uid()) OR following_id = (select auth.uid()))
  WITH CHECK (follower_id = (select auth.uid()));


-- =================================================================
-- Table: daily_records
-- =================================================================
-- Consolidate multiple SELECT policies
DROP POLICY IF EXISTS "daily_records_rls" ON public.daily_records;
DROP POLICY IF EXISTS "Allow conditional read access for others" ON public.daily_records;

-- New, optimized policies for 'daily_records'
CREATE POLICY "Allow users to read their own and public records"
  ON public.daily_records FOR SELECT TO authenticated USING (
    profile_id = (select auth.uid()) OR (
      is_public = true AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.profile_id = daily_records.profile_id
        AND (
          p.daily_record_visibility = 'public' OR
          (p.daily_record_visibility = 'followers' AND EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = (select auth.uid()) AND f.following_id = p.profile_id))
        )
      )
    )
  );

CREATE POLICY "Allow users to write their own records"
  ON public.daily_records FOR INSERT, UPDATE, DELETE TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));


-- =================================================================
-- Table: memos
-- =================================================================
-- Consolidate multiple SELECT policies
DROP POLICY IF EXISTS "memos_rls" ON public.memos;
DROP POLICY IF EXISTS "Allow full access for memo owner" ON public.memos;
DROP POLICY IF EXISTS "Allow conditional read for public memos" ON public.memos;

-- New, optimized policies for 'memos'
CREATE POLICY "Allow users to read their own and public memos"
  ON public.memos FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.daily_records dr
      JOIN public.profiles p ON p.profile_id = dr.profile_id
      WHERE dr.id = memos.record_id AND (
        dr.profile_id = (select auth.uid()) OR
        (
          dr.is_public = true AND (
            p.daily_record_visibility = 'public' OR
            (p.daily_record_visibility = 'followers' AND EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = (select auth.uid()) AND f.following_id = p.profile_id))
          )
        )
      )
    )
  );

CREATE POLICY "Allow users to write their own memos"
  ON public.memos FOR INSERT, UPDATE, DELETE TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

-- =================================================================
-- Tables with simple FOR ALL policies
-- =================================================================

-- Function to drop and create a simple policy
-- This is a meta-comment, not actual SQL, just for explaining the pattern.
-- The pattern is: DROP, then CREATE with (select auth.uid())

-- stats_cache
DROP POLICY IF EXISTS "Allow users to manage their own stats cache" ON public.stats_cache;
DROP POLICY IF EXISTS "Allow full access to own stats cache" ON public.stats_cache;
CREATE POLICY "Manage own stats cache" ON public.stats_cache FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- user_categories
DROP POLICY IF EXISTS "user_categories_rls" ON public.user_categories;
CREATE POLICY "Manage own user categories" ON public.user_categories FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- user_subcodes
DROP POLICY IF EXISTS "user_subcodes_rls" ON public.user_subcodes;
CREATE POLICY "Manage own user subcodes" ON public.user_subcodes FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- user_code_settings
DROP POLICY IF EXISTS "user_code_settings_rls" ON public.user_code_settings;
CREATE POLICY "Manage own code settings" ON public.user_code_settings FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- user_default_code_preferences
DROP POLICY IF EXISTS "user_default_code_preferences_rls" ON public.user_default_code_preferences;
CREATE POLICY "Manage own code preferences" ON public.user_default_code_preferences FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- shared_links
DROP POLICY IF EXISTS "Allow users to manage their own shared links" ON public.shared_links;
CREATE POLICY "Manage own shared links" ON public.shared_links FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- daily_notes
DROP POLICY IF EXISTS "daily_notes_rls" ON public.daily_notes;
CREATE POLICY "Manage own daily notes" ON public.daily_notes FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- conversations
DROP POLICY IF EXISTS "conversations_rls" ON public.conversations;
CREATE POLICY "Participate in conversations" ON public.conversations FOR ALL TO authenticated USING ((select auth.uid()) = participant1_id OR (select auth.uid()) = participant2_id) WITH CHECK ((select auth.uid()) = participant1_id OR (select auth.uid()) = participant2_id);

-- daily_plans
DROP POLICY IF EXISTS "daily_plans_rls" ON public.daily_plans;
CREATE POLICY "Manage own daily plans" ON public.daily_plans FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- weekly_tasks
DROP POLICY IF EXISTS "weekly_tasks_rls" ON public.weekly_tasks;
CREATE POLICY "Manage own weekly tasks" ON public.weekly_tasks FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- weekly_notes
DROP POLICY IF EXISTS "weekly_notes_rls" ON public.weekly_notes;
CREATE POLICY "Manage own weekly notes" ON public.weekly_notes FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- monthly_goals
DROP POLICY IF EXISTS "monthly_goals_rls" ON public.monthly_goals;
CREATE POLICY "Manage own monthly goals" ON public.monthly_goals FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- monthly_reflections
DROP POLICY IF EXISTS "monthly_reflections_rls" ON public.monthly_reflections;
CREATE POLICY "Manage own monthly reflections" ON public.monthly_reflections FOR ALL TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- =================================================================
-- Tables with action-specific policies
-- =================================================================

-- community_posts
DROP POLICY IF EXISTS "Allow read access to everyone" ON public.community_posts;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.community_posts;
DROP POLICY IF EXISTS "Allow update for owners" ON public.community_posts;
DROP POLICY IF EXISTS "Allow delete for owners" ON public.community_posts;

CREATE POLICY "Allow public read on community posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Allow users to create community posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (profile_id = (select auth.uid()));
CREATE POLICY "Allow owners to update community posts" ON public.community_posts FOR UPDATE TO authenticated USING (profile_id = (select auth.uid()));
CREATE POLICY "Allow owners to delete community posts" ON public.community_posts FOR DELETE TO authenticated USING (profile_id = (select auth.uid()));

-- community_comments
DROP POLICY IF EXISTS "Allow read access to everyone for comments" ON public.community_comments;
DROP POLICY IF EXISTS "Allow insert for authenticated users for comments" ON public.community_comments;
DROP POLICY IF EXISTS "Allow update for comment owners" ON public.community_comments;
DROP POLICY IF EXISTS "Allow delete for comment owners" ON public.community_comments;

CREATE POLICY "Allow public read on community comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Allow users to create community comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (profile_id = (select auth.uid()));
CREATE POLICY "Allow owners to update community comments" ON public.community_comments FOR UPDATE TO authenticated USING (profile_id = (select auth.uid()));
CREATE POLICY "Allow owners to delete community comments" ON public.community_comments FOR DELETE TO authenticated USING (profile_id = (select auth.uid()));

-- notifications
DROP POLICY IF EXISTS "Allow authenticated users to create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to delete their own notifications" ON public.notifications;

CREATE POLICY "Allow creating notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow users to view their notifications" ON public.notifications FOR SELECT TO authenticated USING (recipient_id = (select auth.uid()));
CREATE POLICY "Allow users to update their notifications" ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = (select auth.uid()));
CREATE POLICY "Allow users to delete their notifications" ON public.notifications FOR DELETE TO authenticated USING (recipient_id = (select auth.uid()));

-- messages
DROP POLICY IF EXISTS "messages_rls" ON public.messages;
DROP POLICY IF EXISTS "Allow read access to conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Allow insert by conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Allow update by conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Allow delete by sender" ON public.messages;

CREATE POLICY "Allow read access to participants" ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND ((select auth.uid()) = c.participant1_id OR (select auth.uid()) = c.participant2_id)));
CREATE POLICY "Allow insert by participants" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND ((select auth.uid()) = c.participant1_id OR (select auth.uid()) = c.participant2_id)));
CREATE POLICY "Allow update by participants" ON public.messages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND ((select auth.uid()) = c.participant1_id OR (select auth.uid()) = c.participant2_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND ((select auth.uid()) = c.participant1_id OR (select auth.uid()) = c.participant2_id)));
CREATE POLICY "Allow delete by sender" ON public.messages FOR DELETE TO authenticated USING (sender_id = (select auth.uid()));

-- =================================================================
-- Storage Policies
-- =================================================================
-- avatars bucket
DROP POLICY IF EXISTS "Allow public read access on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on avatars" ON storage.objects;

CREATE POLICY "Allow public read on avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow insert on own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (select auth.uid()) = (storage.foldername(name))[1]::uuid);
CREATE POLICY "Allow update on own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (select auth.uid()) = (storage.foldername(name))[1]::uuid);
CREATE POLICY "Allow delete on own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (select auth.uid()) = (storage.foldername(name))[1]::uuid); 