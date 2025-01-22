/*
  # Fix Chat Message Relationships

  1. Changes
    - Safely handle existing profile_id constraint
    - Update indexes for better performance
    - Clean up RLS policies

  2. Security
    - Maintain existing data integrity
    - Ensure proper access controls
*/

-- First check if we need to add the profile_id column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' 
    AND column_name = 'profile_id'
  ) THEN
    -- Add profile_id column if it doesn't exist
    ALTER TABLE chat_messages
      ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
      
    -- Copy data from user_id to profile_id
    UPDATE chat_messages 
    SET profile_id = user_id 
    WHERE profile_id IS NULL;
  END IF;
END $$;

-- Update indexes for better performance
DROP INDEX IF EXISTS chat_messages_user_id_idx;
DROP INDEX IF EXISTS chat_messages_profile_created_idx;
DROP INDEX IF EXISTS chat_messages_status_created_idx;

CREATE INDEX IF NOT EXISTS chat_messages_profile_created_idx 
  ON chat_messages(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS chat_messages_status_created_idx 
  ON chat_messages(status, created_at DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "Everyone can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can moderate messages" ON chat_messages;
DROP POLICY IF EXISTS "Everyone can view approved messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages if not blocked" ON chat_messages;
DROP POLICY IF EXISTS "Admins can moderate all messages" ON chat_messages;

-- Create new policies
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

-- Add message constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'chat_messages' 
    AND constraint_name = 'valid_content'
  ) THEN
    ALTER TABLE chat_messages
      ADD CONSTRAINT valid_content 
      CHECK (length(content) > 0 AND length(content) <= 500);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'chat_messages' 
    AND constraint_name = 'valid_status'
  ) THEN
    ALTER TABLE chat_messages
      ADD CONSTRAINT valid_status 
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;