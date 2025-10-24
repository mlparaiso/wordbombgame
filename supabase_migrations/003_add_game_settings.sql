-- Add game settings columns to game_rooms table
ALTER TABLE game_rooms
ADD COLUMN IF NOT EXISTS max_rounds INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS lives_per_player INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS points_per_word INTEGER DEFAULT 50;

-- Add lives column to players table
ALTER TABLE players
ADD COLUMN IF NOT EXISTS lives INTEGER DEFAULT 3;

-- Add comment to document the new columns
COMMENT ON COLUMN game_rooms.max_rounds IS 'Maximum number of rounds for the game (5, 10, 15, or 20)';
COMMENT ON COLUMN game_rooms.lives_per_player IS 'Number of lives each player starts with (1-5)';
COMMENT ON COLUMN game_rooms.points_per_word IS 'Points awarded per correct word (25, 50, 75, or 100)';
COMMENT ON COLUMN players.lives IS 'Current number of lives remaining for the player';
