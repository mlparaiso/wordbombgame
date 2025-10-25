-- Add bot support columns to players table
ALTER TABLE players
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bot_difficulty TEXT CHECK (bot_difficulty IN ('easy', 'medium', 'hard'));

-- Add bot settings to game_rooms table
ALTER TABLE game_rooms
ADD COLUMN IF NOT EXISTS enable_bots BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bot_difficulty TEXT DEFAULT 'medium' CHECK (bot_difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS bot_count INTEGER DEFAULT 0 CHECK (bot_count >= 0 AND bot_count <= 7);

-- Create index for faster bot queries
CREATE INDEX IF NOT EXISTS idx_players_is_bot ON players(is_bot) WHERE is_bot = TRUE;
CREATE INDEX IF NOT EXISTS idx_players_room_bot ON players(room_code, is_bot) WHERE is_active = TRUE;

-- Update RLS policies to allow bot operations
-- Bots should be able to insert themselves and update their own records
ALTER POLICY "Allow players to insert themselves" ON players
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON COLUMN players.is_bot IS 'Indicates if this player is a bot';
COMMENT ON COLUMN players.bot_difficulty IS 'Difficulty level for bot players (easy, medium, hard)';
COMMENT ON COLUMN game_rooms.enable_bots IS 'Whether bots are enabled for this room';
COMMENT ON COLUMN game_rooms.bot_difficulty IS 'Default difficulty level for bots in this room';
COMMENT ON COLUMN game_rooms.bot_count IS 'Number of bots to add to the room';
