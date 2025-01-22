/*
  # Fix Chat System

  1. Changes
    - Ensure single profile reference
    - Add proper indexes
    - Update RLS policies
    - Add realtime subscriptions

  2. Security
    - Maintain proper access controls
    - Ensure data integrity
*/

-- Drop any existing duplicate foreign keys
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey,
  DROP CONSTRAINT IF EXISTS chat_messages_profile_id_fkey;

-- Drop redundant columns
ALTER TABLE chat_messages
  DROP COLUMN IF EXISTS user_id;

-- Ensure profile_id exists and is properly constrained
ALTER TABLE chat_messages
  ALTER COLUMN profile_id SET NOT NULL,
  ADD CONSTRAINT chat_messages_profile_id_fkey 
    FOREIGN KEY (profile_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- Update indexes for better performance
DROP INDEX IF EXISTS chat_messages_user_id_idx;
DROP INDEX IF EXISTS chat_messages_profile_created_idx;
DROP INDEX IF EXISTS chat_messages_status_created_idx;

CREATE INDEX chat_messages_profile_created_idx 
  ON chat_messages(profile_id, created_at DESC);

CREATE INDEX chat_messages_status_created_idx 
  ON chat_messages(status, created_at DESC);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Update RLS policies
DROP POLICY IF EXISTS "Everyone can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can moderate messages" ON chat_messages;
DROP POLICY IF EXISTS "Everyone can view approved messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages if not blocked" ON chat_messages;
DROP POLICY IF EXISTS "Admins can moderate all messages" ON chat_messages;

-- Create new policies with proper checks
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
    WHERE user_id = profile_id
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can moderate all messages"
ON chat_messages FOR UPDATE
USING (auth.jwt() ->> 'role' = 'admin');

-- Add function to handle message moderation
CREATE OR REPLACE FUNCTION handle_message_moderation()
RETURNS TRIGGER AS $$
BEGIN
  -- Set moderation timestamp
  IF NEW.status != OLD.status THEN
    NEW.moderated_at = now();
    NEW.moderated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message moderation
DROP TRIGGER IF EXISTS on_message_moderation ON chat_messages;
CREATE TRIGGER on_message_moderation
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_moderation();