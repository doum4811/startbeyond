-- This migration enables Row-Level Security (RLS) for the 'stats_cache' and 'shared_links' tables.
-- While the policies were defined in the Drizzle schema, RLS was not explicitly enabled for these tables,
-- causing access errors. This script corrects that omission.

ALTER TABLE "public"."stats_cache" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."shared_links" ENABLE ROW LEVEL SECURITY; 