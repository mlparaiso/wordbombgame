-- Fix RLS policies to allow Realtime subscriptions
-- Realtime requires SELECT permission for subscriptions to work

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all access for game_rooms" ON game_rooms;
DROP POLICY IF EXISTS "Enable all access for players" ON players;
DROP POLICY IF EXISTS "Enable all access for game_state" ON game_state;
DROP POLICY IF EXISTS "Enable all access for answers" ON answers;

-- Create new policies that explicitly allow SELECT for realtime
-- game_rooms policies
CREATE POLICY "Allow read access for game_rooms"
  ON game_rooms
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access for game_rooms"
  ON game_rooms
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access for game_rooms"
  ON game_rooms
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access for game_rooms"
  ON game_rooms
  FOR DELETE
  USING (true);

-- players policies
CREATE POLICY "Allow read access for players"
  ON players
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access for players"
  ON players
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access for players"
  ON players
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access for players"
  ON players
  FOR DELETE
  USING (true);

-- game_state policies
CREATE POLICY "Allow read access for game_state"
  ON game_state
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access for game_state"
  ON game_state
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access for game_state"
  ON game_state
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access for game_state"
  ON game_state
  FOR DELETE
  USING (true);

-- answers policies
CREATE POLICY "Allow read access for answers"
  ON answers
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access for answers"
  ON answers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access for answers"
  ON answers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access for answers"
  ON answers
  FOR DELETE
  USING (true);
