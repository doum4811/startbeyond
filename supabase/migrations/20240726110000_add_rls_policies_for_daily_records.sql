-- Enable RLS for daily_records and memos tables
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- To make this script rerunnable, drop existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to read public daily records" ON public.daily_records;
DROP POLICY IF EXISTS "Allow authenticated users to read memos of public records" ON public.memos;
DROP POLICY IF EXISTS "Allow owners to manage their own daily records" ON public.daily_records;
DROP POLICY IF EXISTS "Allow owners to manage their own memos" ON public.memos;


-- Policy: Allow authenticated users to read public daily records
-- This policy allows any user who is logged in (authenticated) to view a daily record
-- if its 'is_public' flag is set to true. This is a broad read-only access
-- for public content, which is then further filtered by application logic
-- based on the profile owner's specific visibility settings (e.g., 'followers-only').
CREATE POLICY "Allow authenticated users to read public daily records"
ON public.daily_records FOR SELECT
TO authenticated
USING (is_public = true);


-- Policy: Allow authenticated users to read memos of public records
-- This policy allows authenticated users to read memos that are associated with
-- a public daily record. It checks the 'is_public' status of the parent daily_record.
CREATE POLICY "Allow authenticated users to read memos of public records"
ON public.memos FOR SELECT
TO authenticated
USING (
  (SELECT is_public FROM public.daily_records WHERE id = memos.record_id) = true
);