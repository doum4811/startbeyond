-- Custom SQL migration file, put your code below! --

-- This migration enables RLS and defines all row-level security policies.
-- It is designed to be idempotent and can be re-run safely.

-- =================================================================
-- 1. Enable RLS for all tables
-- =================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_code_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_default_code_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reflections ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 2. Define RLS Policies
-- =================================================================

-- Profiles
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Allow owners to update their own profile" ON public.profiles;
CREATE POLICY "Allow owners to update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles FOR SELECT TO public USING (true); -- Allow anon access as well

-- Follows
DROP POLICY IF EXISTS "Allow users to see their own follow relationships" ON public.follows;
CREATE POLICY "Allow users to see their own follow relationships" ON public.follows FOR SELECT TO authenticated USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Allow users to follow others" ON public.follows;
CREATE POLICY "Allow users to follow others" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Allow users to unfollow others" ON public.follows;
CREATE POLICY "Allow users to unfollow others" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Daily Records
DROP POLICY IF EXISTS "daily_records_rls" ON public.daily_records;
CREATE POLICY "daily_records_rls" ON public.daily_records FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Allow conditional read access for others" ON public.daily_records;
CREATE POLICY "Allow conditional read access for others" ON public.daily_records FOR SELECT TO authenticated USING (is_public = true AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.profile_id = daily_records.profile_id AND (p.daily_record_visibility = 'public' OR (p.daily_record_visibility = 'followers' AND EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.following_id = p.profile_id)))));

-- Memos
DROP POLICY IF EXISTS "memos_rls" ON public.memos; -- Drop old one if exists
DROP POLICY IF EXISTS "Allow full access for memo owner" ON public.memos;
CREATE POLICY "Allow full access for memo owner" ON public.memos FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Allow conditional read for public memos" ON public.memos;
CREATE POLICY "Allow conditional read for public memos" ON public.memos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.daily_records dr JOIN public.profiles p ON p.profile_id = dr.profile_id WHERE dr.id = memos.record_id AND dr.is_public = true AND (p.daily_record_visibility = 'public' OR (p.daily_record_visibility = 'followers' AND EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.following_id = p.profile_id)))));

-- Stats Cache (The missing one)
DROP POLICY IF EXISTS "Allow users to manage their own stats cache" ON public.stats_cache;
CREATE POLICY "Allow users to manage their own stats cache" ON public.stats_cache FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Other policies... (Add DROP IF EXISTS for all)
DROP POLICY IF EXISTS "user_categories_rls" ON public.user_categories;
CREATE POLICY "user_categories_rls" ON public.user_categories FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "user_subcodes_rls" ON public.user_subcodes;
CREATE POLICY "user_subcodes_rls" ON public.user_subcodes FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "user_code_settings_rls" ON public.user_code_settings;
CREATE POLICY "user_code_settings_rls" ON public.user_code_settings FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "user_default_code_preferences_rls" ON public.user_default_code_preferences;
CREATE POLICY "user_default_code_preferences_rls" ON public.user_default_code_preferences FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Allow users to manage their own shared links" ON public.shared_links;
CREATE POLICY "Allow users to manage their own shared links" ON public.shared_links FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "daily_notes_rls" ON public.daily_notes;
CREATE POLICY "daily_notes_rls" ON public.daily_notes FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "conversations_rls" ON public.conversations;
CREATE POLICY "conversations_rls" ON public.conversations FOR ALL TO authenticated USING (auth.uid() = participant1_id OR auth.uid() = participant2_id) WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);
DROP POLICY IF EXISTS "messages_rls" ON public.messages;
DROP POLICY IF EXISTS "Allow participants to view messages" ON public.messages;
DROP POLICY IF EXISTS "Allow sender to insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow participants to update message read status" ON public.messages;
DROP POLICY IF EXISTS "Allow sender to delete messages" ON public.messages;
CREATE POLICY "Allow participants to view messages" ON public.messages FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
);
CREATE POLICY "Allow sender to insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
);
CREATE POLICY "Allow participants to update message read status" ON public.messages FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
) WITH CHECK (
    -- The user must be a participant in the conversation
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
);
CREATE POLICY "Allow sender to delete messages" ON public.messages FOR DELETE TO authenticated USING (
    auth.uid() = sender_id
);
DROP POLICY IF EXISTS "Allow read access to everyone" ON public.community_posts;
CREATE POLICY "Allow read access to everyone" ON public.community_posts FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.community_posts;
CREATE POLICY "Allow insert for authenticated users" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Allow update for owners" ON public.community_posts;
CREATE POLICY "Allow update for owners" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Allow delete for owners" ON public.community_posts;
CREATE POLICY "Allow delete for owners" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Allow read access to everyone for comments" ON public.community_comments;
CREATE POLICY "Allow read access to everyone for comments" ON public.community_comments FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated users for comments" ON public.community_comments;
CREATE POLICY "Allow insert for authenticated users for comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Allow update for comment owners" ON public.community_comments;
CREATE POLICY "Allow update for comment owners" ON public.community_comments FOR UPDATE TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Allow delete for comment owners" ON public.community_comments;
CREATE POLICY "Allow delete for comment owners" ON public.community_comments FOR DELETE TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Allow authenticated users to create notifications" ON public.notifications;
CREATE POLICY "Allow authenticated users to create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow users to view their own notifications" ON public.notifications;
CREATE POLICY "Allow users to view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Allow users to update their own notifications" ON public.notifications;
CREATE POLICY "Allow users to update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Allow users to delete their own notifications" ON public.notifications;
CREATE POLICY "Allow users to delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "daily_plans_rls" ON public.daily_plans;
CREATE POLICY "daily_plans_rls" ON public.daily_plans FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "weekly_tasks_rls" ON public.weekly_tasks;
CREATE POLICY "weekly_tasks_rls" ON public.weekly_tasks FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "weekly_notes_rls" ON public.weekly_notes;
CREATE POLICY "weekly_notes_rls" ON public.weekly_notes FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "monthly_goals_rls" ON public.monthly_goals;
CREATE POLICY "monthly_goals_rls" ON public.monthly_goals FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "monthly_reflections_rls" ON public.monthly_reflections;
CREATE POLICY "monthly_reflections_rls" ON public.monthly_reflections FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);