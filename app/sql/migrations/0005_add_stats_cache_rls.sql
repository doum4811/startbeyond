-- Add Row-Level Security (RLS) policies for the stats_cache table.

-- 1. Enable RLS for the table
ALTER TABLE public.stats_cache ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that allows users to perform all actions (SELECT, INSERT, UPDATE, DELETE)
-- on their own records in the stats_cache table. The policy ensures that a user's authenticated
-- UID matches the profile_id associated with the cache entry.

DROP POLICY IF EXISTS "Allow full access to own stats cache" ON public.stats_cache;

CREATE POLICY "Allow full access to own stats cache"
ON public.stats_cache
FOR ALL
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id); 