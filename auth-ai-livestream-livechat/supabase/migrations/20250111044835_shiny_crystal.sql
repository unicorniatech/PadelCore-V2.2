/*
  # Fix Profiles Schema with Dependencies

  1. Changes
    - Safely handle table dependencies
    - Recreate profiles table with proper constraints
    - Add proper indexes for performance
    - Update RLS policies
    
  2. Security
    - Proper RLS policies
    - Secure profile handling
    - Better error handling
*/

-- First drop dependent foreign keys
ALTER TABLE tournament_registrations 
  DROP CONSTRAINT IF EXISTS tournament_registrations_player_id_fkey;

ALTER TABLE matches 
  DROP CONSTRAINT IF EXISTS matches_winner_id_fkey;

ALTER TABLE match_players 
  DROP CONSTRAINT IF EXISTS match_players_player_id_fkey;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now we can safely drop and recreate the profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  rating integer DEFAULT 1000,
  matches_played integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT username_format CHECK (
    username ~* '^[a-z][a-z0-9_]*$' AND
    length(username) >= 3 AND
    length(username) <= 20
  ),
  CONSTRAINT rating_range CHECK (rating >= 0),
  CONSTRAINT valid_stats CHECK (
    matches_played >= 0 AND
    wins >= 0 AND
    losses >= 0 AND
    wins + losses <= matches_played
  )
);

-- Recreate foreign key constraints
ALTER TABLE tournament_registrations
  ADD CONSTRAINT tournament_registrations_player_id_fkey 
  FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE matches
  ADD CONSTRAINT matches_winner_id_fkey 
  FOREIGN KEY (winner_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE match_players
  ADD CONSTRAINT match_players_player_id_fkey 
  FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX profiles_username_idx ON profiles (lower(username));
CREATE INDEX profiles_rating_idx ON profiles (rating DESC);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "System can create profiles"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create improved user creation handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  username_base TEXT;
  username_final TEXT;
  username_counter INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  -- Generate base username from email or metadata
  username_base := COALESCE(
    NEW.raw_user_meta_data->>'username',
    regexp_replace(
      lower(split_part(NEW.email, '@', 1)),
      '[^a-z0-9]',
      '',
      'g'
    )
  );

  -- Ensure username starts with a letter
  IF username_base !~ '^[a-z]' THEN
    username_base := 'user' || username_base;
  END IF;

  -- Truncate if too long
  username_base := substring(username_base, 1, 15);

  -- Find unique username
  username_final := username_base;
  WHILE username_counter < max_attempts LOOP
    BEGIN
      INSERT INTO public.profiles (
        id,
        username,
        full_name,
        avatar_url,
        rating,
        matches_played,
        wins,
        losses
      ) VALUES (
        NEW.id,
        username_final,
        COALESCE(
          NEW.raw_user_meta_data->>'full_name',
          split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        1000,
        0,
        0,
        0
      );
      
      -- If successful, exit the loop
      EXIT;
    EXCEPTION 
      WHEN unique_violation THEN
        -- Only retry for username conflicts
        IF username_counter < max_attempts - 1 THEN
          username_counter := username_counter + 1;
          username_final := username_base || username_counter::text;
          CONTINUE;
        ELSE
          -- Use timestamp as last resort
          username_final := username_base || extract(epoch from now())::bigint % 1000000;
          
          INSERT INTO public.profiles (
            id,
            username,
            full_name,
            avatar_url,
            rating,
            matches_played,
            wins,
            losses
          ) VALUES (
            NEW.id,
            username_final,
            COALESCE(
              NEW.raw_user_meta_data->>'full_name',
              split_part(NEW.email, '@', 1)
            ),
            NEW.raw_user_meta_data->>'avatar_url',
            1000,
            0,
            0,
            0
          );
        END IF;
    END;
    EXIT;
  END LOOP;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Profile creation failed for user % : %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();