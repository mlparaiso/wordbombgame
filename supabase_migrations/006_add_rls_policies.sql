-- Enable Row Level Security for game_rooms table
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Policy for game_rooms: Allow all users to read game rooms
CREATE POLICY "Allow all users to read game_rooms"
  ON game_rooms FOR SELECT
  USING (true);

-- Policy for game_rooms: Allow all users to insert game rooms
CREATE POLICY "Allow all users to insert game_rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (true);

-- Policy for game_rooms: Allow all users to update game rooms
CREATE POLICY "Allow all users to update game_rooms"
  ON game_rooms FOR UPDATE
  USING (true);

-- Policy for game_rooms: Allow all users to delete game rooms
CREATE POLICY "Allow all users to delete game_rooms"
  ON game_rooms FOR DELETE
  USING (true);

-- Enable Row Level Security for players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy for players: Allow all users to read players
CREATE POLICY "Allow all users to read players"
  ON players FOR SELECT
  USING (true);

-- Policy for players: Allow all users to insert players
CREATE POLICY "Allow all users to insert players"
  ON players FOR INSERT
  WITH CHECK (true);

-- Policy for players: Allow all users to update players
CREATE POLICY "Allow all users to update players"
  ON players FOR UPDATE
  USING (true);

-- Policy for players: Allow all users to delete players
CREATE POLICY "Allow all users to delete players"
  ON players FOR DELETE
  USING (true);
