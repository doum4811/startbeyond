-- In this migration, we are manually creating the Row-Level Security (RLS) policies
-- for the "daily_records" table. Drizzle-kit was failing to automatically detect
-- changes to these policies, so we are defining them explicitly here to ensure
-- they are correctly applied to the database.

-- 1. Policy for SELECT: Allows authenticated users to read their own records or any public records.
CREATE POLICY "Allow read on own or public records" ON "public"."daily_records"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((profile_id = auth.uid()) OR (is_public = true));

-- 2. Policy for INSERT: Allows authenticated users to insert records for themselves.
-- Both `using` and `withCheck` are specified to enforce this for new rows.
CREATE POLICY "Allow insert on own records" ON "public"."daily_records"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- 3. Policy for UPDATE: Allows authenticated users to update their own records.
-- Both `using` and `withCheck` are specified for security.
CREATE POLICY "Allow update on own records" ON "public"."daily_records"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- 4. Policy for DELETE: Allows authenticated users to delete their own records.
CREATE POLICY "Allow delete on own records" ON "public"."daily_records"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (profile_id = auth.uid()); 