-- ============================================================
-- COMPLETE SCHEMA FOR WORD BOMB GAME
-- Run this on a fresh Supabase project to set up all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: game_rooms
-- ============================================================
CREATE TABLE IF NOT EXISTS game_rooms (
  room_code TEXT PRIMARY KEY,
  host_id UUID NOT NULL,
  game_mode TEXT NOT NULL DEFAULT 'vs_all',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'abandoned')),
  max_rounds INTEGER DEFAULT 10,
  lives_per_player INTEGER DEFAULT 3,
  points_per_word INTEGER DEFAULT 50,
  current_round INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT FALSE,
  paused_at TIMESTAMP WITH TIME ZONE,
  paused_time_remaining INTEGER,
  enable_bots BOOLEAN DEFAULT FALSE,
  bot_difficulty TEXT DEFAULT 'medium' CHECK (bot_difficulty IN ('easy', 'medium', 'hard')),
  bot_count INTEGER DEFAULT 0 CHECK (bot_count >= 0 AND bot_count <= 7),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: players
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  is_spectator BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_bot BOOLEAN DEFAULT FALSE,
  bot_difficulty TEXT CHECK (bot_difficulty IN ('easy', 'medium', 'hard')),
  score INTEGER DEFAULT 0,
  lives INTEGER DEFAULT 3,
  team_number INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: game_state
-- ============================================================
CREATE TABLE IF NOT EXISTS game_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  current_combo TEXT NOT NULL,
  round_number INTEGER NOT NULL DEFAULT 1,
  time_limit INTEGER NOT NULL DEFAULT 10,
  round_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: answers
-- ============================================================
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  round_number INTEGER NOT NULL,
  word TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  time_taken NUMERIC(10,2),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: chat_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_players_room_code ON players(room_code);
CREATE INDEX IF NOT EXISTS idx_players_active ON players(room_code, is_active);
CREATE INDEX IF NOT EXISTS idx_players_is_bot ON players(is_bot) WHERE is_bot = TRUE;
CREATE INDEX IF NOT EXISTS idx_players_room_bot ON players(room_code, is_bot) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_game_state_room_code ON game_state(room_code);
CREATE INDEX IF NOT EXISTS idx_answers_room_round ON answers(room_code, round_number);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_code ON chat_messages(room_code, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- game_rooms policies
CREATE POLICY "Anyone can read game rooms" ON game_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create game rooms" ON game_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game rooms" ON game_rooms FOR UPDATE USING (true);

-- players policies
CREATE POLICY "Anyone can read players" ON players FOR SELECT USING (true);
CREATE POLICY "Anyone can add players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON players FOR UPDATE USING (true);

-- game_state policies
CREATE POLICY "Anyone can read game state" ON game_state FOR SELECT USING (true);
CREATE POLICY "Anyone can create game state" ON game_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game state" ON game_state FOR UPDATE USING (true);

-- answers policies
CREATE POLICY "Anyone can read answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert answers" ON answers FOR INSERT WITH CHECK (true);

-- chat_messages policies
CREATE POLICY "Anyone can read chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- ============================================================
-- REALTIME (enable for live updates)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
