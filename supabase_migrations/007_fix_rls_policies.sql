-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Allow all on game_rooms" ON game_rooms;
DROP POLICY IF EXISTS "Allow all on players" ON players;
DROP POLICY IF EXISTS "Allow all on game_state" ON game_state;
DROP POLICY IF EXISTS "Allow all on answers" ON answers;

DROP POLICY IF EXISTS "Allow all users to read game_rooms" ON game_rooms;
DROP POLICY IF EXISTS "Allow all users to insert game_rooms" ON game_rooms;
DROP POLICY IF EXISTS "Allow all users to update game_rooms" ON game_rooms;
DROP POLICY IF EXISTS "Allow all users to delete game_rooms" ON game_rooms;

DROP POLICY IF EXISTS "Allow all users to read players" ON players;
DROP POLICY IF EXISTS "Allow all users to insert players" ON players;
DROP POLICY IF EXISTS "Allow all users to update players" ON players;
DROP POLICY IF EXISTS "Allow all users to delete players" ON players;

-- Ensure RLS is enabled
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Create new permissive policies for game_rooms
CREATE POLICY "Enable all access for game_rooms"
  ON game_rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for players
CREATE POLICY "Enable all access for players"
  ON players
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for game_state
CREATE POLICY "Enable all access for game_state"
  ON game_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for answers
CREATE POLICY "Enable all access for answers"
  ON answers
  FOR ALL
  USING (true)
  WITH CHECK (true);
