-- This migration fixes an issue where the 'id' column of the 'stats_cache' table
-- was not being automatically populated, leading to not-null constraint violations.
-- It alters the column to set a default value using gen_random_uuid().

ALTER TABLE public.stats_cache ALTER COLUMN id SET DEFAULT gen_random_uuid(); 