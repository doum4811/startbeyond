-- This migration explicitly enables Row Level Security on tables
-- where it was found to be disabled despite existing policies.

ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY; 