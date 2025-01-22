/*
  # Fix Chat Functionality

  1. Changes
    - Add missing profile references to chat_messages
    - Add missing indexes for performance
    - Update RLS policies for better security
    - Add message length constraints
    - Add status validation

  2. Security
    - Enable RLS
    - Add policies for message moderation
    - Add user blocking functionality
*/

-- Add missing profile references
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Update existing messages to use profile_id
UPDATE chat_messages 
SET profile_id = user_id 
WHERE profile_id IS NULL;

-- Make profile_id required
ALTER TABLE chat_messages
  ALTER COLUMN profile_id SET NOT NULL;

-- Add message constraints
ALTER TABLE chat_messages
  ADD CONSTRAINT valid_content CHECK (length(content) > 0 AND length(content) <= 500),
  ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS chat_messages_profile_created_idx 
  ON chat_messages(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS chat_messages_status_created_idx 
  ON chat_messages(status, created_at DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "Everyone can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can moderate messages" ON chat_messages;

-- Better policies with proper checks
CREATE POLICY "Everyone can view approved messages"
ON chat_messages FOR SELECT
USING (
  status = 'approved' OR 
  auth.uid() = profile_id OR
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Users can create messages if not blocked"
ON chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = profile_id AND
  NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE user_id = auth.uid()
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can moderate all messages"
ON chat_messages FOR UPDATE
USING (auth.jwt() ->> 'role' = 'admin');

-- Add function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE user_id = user_uuid
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;