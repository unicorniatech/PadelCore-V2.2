/*
  # Fix Chat Message Relationships

  1. Changes
    - Remove duplicate foreign key relationships
    - Ensure single profile reference
    - Update indexes and constraints
    - Clean up RLS policies

  2. Security
    - Maintain proper access controls
    - Ensure data integrity
*/

-- Drop existing foreign keys to avoid conflicts
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey,
  DROP CONSTRAINT IF EXISTS chat_messages_profile_id_fkey;

-- Drop the redundant user_id column
ALTER TABLE chat_messages
  DROP COLUMN IF EXISTS user_id;

-- Ensure profile_id exists and is properly constrained
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' 
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE chat_messages
      ADD COLUMN profile_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
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