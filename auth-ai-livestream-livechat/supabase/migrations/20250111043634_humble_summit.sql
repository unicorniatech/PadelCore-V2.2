/*
  # Tournament System Schema

  1. New Tables
    - tournaments: Main tournament information
    - tournament_registrations: Player registrations for tournaments
    - matches: Individual matches within tournaments
    - match_players: Players participating in each match

  2. Security
    - RLS enabled on all tables
    - Policies for public viewing and role-based modifications
    
  3. Indexes
    - Optimized indexes for common queries
*/

-- Create tables first, then add constraints and indexes
CREATE TABLE tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  location text NOT NULL,
  prize_pool integer DEFAULT 0,
  max_participants integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  rules jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  registration_date timestamptz DEFAULT now()
);

CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  round integer NOT NULL,
  court text,
  start_time timestamptz,
  end_time timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  score jsonb,
  winner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE match_players (
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  team integer NOT NULL,
  position integer NOT NULL,
  PRIMARY KEY (match_id, player_id)
);

-- Add constraints after table creation
ALTER TABLE tournaments
  ADD CONSTRAINT valid_dates CHECK (end_date > start_date),
  ADD CONSTRAINT valid_max_participants CHECK (max_participants > 0),
  ADD CONSTRAINT valid_status CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE tournament_registrations
  ADD CONSTRAINT unique_registration UNIQUE(tournament_id, player_id),
  ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlist'));

ALTER TABLE matches
  ADD CONSTRAINT valid_round CHECK (round > 0),
  ADD CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  ADD CONSTRAINT valid_times CHECK (end_time IS NULL OR (start_time IS NOT NULL AND end_time > start_time));

ALTER TABLE match_players
  ADD CONSTRAINT valid_team CHECK (team IN (1, 2)),
  ADD CONSTRAINT valid_position CHECK (position IN (1, 2));

-- Create indexes
CREATE INDEX tournaments_status_idx ON tournaments(status);
CREATE INDEX tournaments_dates_idx ON tournaments(start_date, end_date);
CREATE INDEX tournament_registrations_status_idx ON tournament_registrations(status);
CREATE INDEX matches_tournament_round_idx ON matches(tournament_id, round);
CREATE INDEX matches_status_idx ON matches(status);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  USING (true);

CREATE POLICY "Admins can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update tournaments"
  ON tournaments FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Players can view registrations"
  ON tournament_registrations FOR SELECT
  USING (true);

CREATE POLICY "Players can register themselves"
  ON tournament_registrations FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update their own registrations"
  ON tournament_registrations FOR UPDATE
  USING (auth.uid() = player_id);

CREATE POLICY "Matches are viewable by everyone"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage matches"
  ON matches FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Match players are viewable by everyone"
  ON match_players FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage match players"
  ON match_players FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');