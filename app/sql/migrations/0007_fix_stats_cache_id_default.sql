-- This migration manually updates the default value for the 'id' column on the 'stats_cache' table.
-- Drizzle-kit was not detecting the change from `default(sql'...')` to `defaultRandom()`,
-- so this script explicitly sets the default to `gen_random_uuid()` to fix the 'id' being null on insert.

ALTER TABLE "public"."stats_cache" ALTER COLUMN "id" SET DEFAULT gen_random_uuid(); 