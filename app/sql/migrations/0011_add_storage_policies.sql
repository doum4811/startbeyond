-- Enable RLS for the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Policy for public access to avatars
-- Allows anyone to view files in the 'avatars' bucket.
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
CREATE POLICY "Allow public read access to avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- 2. Policy for authenticated users to manage their own avatars
-- Allows authenticated users to insert, update, or delete their own avatar.
-- The user's ID must match the first part of the file path (e.g., 'user-id/avatar.png').
DROP POLICY IF EXISTS "Allow authenticated users to manage their own avatars" ON storage.objects;
CREATE POLICY "Allow authenticated users to manage their own avatars"
    FOR ALL
    TO authenticated
    USING (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- Enable RLS for the storage.buckets table
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 3. Policy to ensure buckets are visible
DROP POLICY IF EXISTS "Make buckets publicly visible" ON storage.buckets;
CREATE POLICY "Make buckets publicly visible"
    ON storage.buckets FOR SELECT
    USING (true); 