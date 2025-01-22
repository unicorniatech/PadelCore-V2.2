/*
  # Fix chat messages relationships

  1. Changes
    - Add foreign key relationship between chat_messages and profiles
    - Add indexes for better query performance
    - Update RLS policies for better security
*/

-- First ensure the foreign key exists
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey,
  ADD CONSTRAINT chat_messages_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- Update indexes for better join performance
DROP INDEX IF EXISTS chat_messages_user_id_idx;
CREATE INDEX chat_messages_user_id_created_at_idx 
  ON chat_messages(user_id, created_at DESC);

-- Update RLS policies for better security
DROP POLICY IF EXISTS "Everyone can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can moderate messages" ON chat_messages;

CREATE POLICY "Everyone can view chat messages"
ON chat_messages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create messages"
ON chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE user_id = auth.uid()
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can moderate messages"
ON chat_messages FOR UPDATE
USING (
  auth.jwt() ->> 'role' = 'admin'
);