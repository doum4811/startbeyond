-- This policy allows authenticated users to upload files to the 'avatars' bucket.
-- Users can only upload files into a folder named after their own user ID.
-- e.g. user 'abc-123' can upload to 'avatars/abc-123/path/to/file.png'
CREATE POLICY "Allow authenticated uploads to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- This policy allows anyone to view files in the 'avatars' bucket.
-- This is necessary for displaying avatars in the application.
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars'); 