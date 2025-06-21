-- This migration adds composite indexes to frequently queried columns
-- to improve the performance of data fetching, particularly on the daily page.

-- Index for daily_records table
-- This index speeds up queries that filter by a user's profile_id and a specific date or date range.
CREATE INDEX IF NOT EXISTS daily_records_profile_id_date_idx ON public.daily_records (profile_id, date);

-- Index for daily_notes table
-- Similar to daily_records, this speeds up fetching daily notes for a specific user and date.
CREATE INDEX IF NOT EXISTS daily_notes_profile_id_date_idx ON public.daily_notes (profile_id, date);

-- Index for daily_plans table
-- This improves performance when fetching a user's plans for a given day.
CREATE INDEX IF NOT EXISTS daily_plans_profile_id_plan_date_idx ON public.daily_plans (profile_id, plan_date); 