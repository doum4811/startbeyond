-- Enable RLS for the table if not already enabled
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy if it exists, to avoid conflicts
DROP POLICY IF EXISTS "Allow all users to read community posts" ON public.community_posts;

-- Create a new policy that allows public read access to all posts
CREATE POLICY "Allow all users to read community posts"
ON public.community_posts
FOR SELECT
USING (true); 