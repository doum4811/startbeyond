ALTER TABLE "community_posts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "daily_record_visibility" text DEFAULT 'followers' NOT NULL;--> statement-breakpoint
DROP POLICY "community_posts_rls" ON "community_posts" CASCADE;