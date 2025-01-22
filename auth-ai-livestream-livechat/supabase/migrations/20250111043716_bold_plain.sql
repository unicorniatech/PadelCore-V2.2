/*
  # Authentication and Profile Schema Fix

  1. Fixes
    - Ensure auth schema is properly configured
    - Add missing profile triggers and functions
    - Update RLS policies for auth
    
  2. Security
    - Proper RLS policies for authentication
    - Secure profile handling
*/

-- Drop existing auth-related policies to avoid conflicts
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Ensure profiles table exists with proper constraints
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
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
  )
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create better RLS policies
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create or replace the profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  username_base TEXT;
  username_final TEXT;
  username_counter INTEGER := 0;
BEGIN
  -- Generate base username from email
  username_base := split_part(new.email, '@', 1);
  username_final := username_base;
  
  -- Find unique username
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = username_final) LOOP
    username_counter := username_counter + 1;
    username_final := username_base || username_counter::text;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    rating,
    matches_played,
    wins,
    losses
  ) VALUES (
    new.id,
    username_final,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    1000,
    0,
    0,
    0
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Profile creation failed: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();