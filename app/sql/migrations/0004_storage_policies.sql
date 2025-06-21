-- Create policies for Supabase Storage to allow users to manage their own avatars.
-- These policies assume a bucket named 'avatars' exists.

-- 1. Allow public read access to all files in the 'avatars' bucket.
CREATE POLICY "Allow public read access on avatars"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'avatars' );

-- 2. Allow authenticated users to insert their own avatar.
-- The policy checks if the user's ID is present in the file path.
-- e.g., 'avatars/00000000-0000-0000-0000-000000000000/avatar.png'
CREATE POLICY "Allow authenticated insert on avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
);

-- 3. Allow authenticated users to update their own avatar.
-- Users can only update files within their own folder.
CREATE POLICY "Allow authenticated update on avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
);

-- 4. Allow authenticated users to delete their own avatar.
-- Users can only delete files within their own folder.
CREATE POLICY "Allow authenticated delete on avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
); 