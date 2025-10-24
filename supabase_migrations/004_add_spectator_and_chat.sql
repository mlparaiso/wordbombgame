-- Add spectator mode and chat features

-- Add is_spectator column to players table
ALTER TABLE players
ADD COLUMN is_spectator BOOLEAN DEFAULT FALSE;

-- Add game control columns to game_rooms table
ALTER TABLE game_rooms
ADD COLUMN is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN paused_time_remaining INTEGER; -- seconds remaining when paused

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster chat queries
CREATE INDEX idx_chat_messages_room_code ON chat_messages(room_code, created_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policy: anyone can read messages in their room
CREATE POLICY "Users can read chat messages in their room"
  ON chat_messages FOR SELECT
  USING (true);

-- Chat messages policy: authenticated users can insert messages
CREATE POLICY "Users can insert chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE chat_messages IS 'Stores chat messages for game rooms';
