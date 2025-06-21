-- Drop the old, overly restrictive policy that was defined for ALL commands.
DROP POLICY IF EXISTS "messages_rls" ON "public"."messages";

-- 1. SELECT Policy: Allow participants to read any message in their conversation.
CREATE POLICY "Allow read access to conversation participants"
ON "public"."messages"
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM "public"."conversations" "c"
        WHERE "c"."id" = "messages"."conversation_id"
          AND ("c"."participant1_id" = auth.uid() OR "c"."participant2_id" = auth.uid())
    )
);

-- 2. INSERT Policy: Allow users to insert messages as themselves into conversations they are part of.
CREATE POLICY "Allow insert by conversation participants"
ON "public"."messages"
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = "sender_id" AND
    EXISTS (
        SELECT 1
        FROM "public"."conversations" "c"
        WHERE "c"."id" = "messages"."conversation_id"
          AND ("c"."participant1_id" = auth.uid() OR "c"."participant2_id" = auth.uid())
    )
);

-- 3. UPDATE Policy: Allow participants to update messages in their conversation.
-- This is permissive enough to allow a recipient to update the `is_read` status.
CREATE POLICY "Allow update by conversation participants"
ON "public"."messages"
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM "public"."conversations" "c"
        WHERE "c"."id" = "messages"."conversation_id"
          AND ("c"."participant1_id" = auth.uid() OR "c"."participant2_id" = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "public"."conversations" "c"
        WHERE "c"."id" = "messages"."conversation_id"
          AND ("c"."participant1_id" = auth.uid() OR "c"."participant2_id" = auth.uid())
    )
);

-- 4. DELETE Policy: Allow only the original sender to delete their message.
CREATE POLICY "Allow delete by sender"
ON "public"."messages"
FOR DELETE
TO authenticated
USING (auth.uid() = "sender_id"); 