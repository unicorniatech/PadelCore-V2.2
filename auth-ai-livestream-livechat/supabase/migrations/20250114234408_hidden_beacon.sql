-- Create tables for chat moderation
CREATE TABLE IF NOT EXISTS banned_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  blocked_at timestamptz DEFAULT now(),
  blocked_by uuid REFERENCES auth.users(id),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  created_at timestamptz DEFAULT now(),
  moderated_at timestamptz,
  moderated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage banned words"
ON banned_words
FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Everyone can view banned words"
ON banned_words
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage blocked users"
ON blocked_users
FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view if they are blocked"
ON blocked_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view chat messages"
ON chat_messages
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create messages"
ON chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can moderate messages"
ON chat_messages
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'admin');

-- Create indexes
CREATE INDEX chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX chat_messages_status_idx ON chat_messages(status);
CREATE INDEX blocked_users_user_id_idx ON blocked_users(user_id);

-- Add some common banned words
INSERT INTO banned_words (word) VALUES
  ('spam'),
  ('hack'),
  ('cheat'),
  ('scam')
ON CONFLICT DO NOTHING;