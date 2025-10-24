# Supabase Setup Guide for Word Bomb Multiplayer

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name:** Word Bomb
   - **Database Password:** (create a strong password)
   - **Region:** Choose closest to your users
5. Click "Create new project" (takes ~2 minutes)

## Step 2: Get API Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

3. Update `.env.local` file with your credentials:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Game Rooms Table
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, playing, finished
  game_mode VARCHAR(20) NOT NULL, -- solo, vs_all, team_2, team_3, team_4
  difficulty VARCHAR(10) NOT NULL, -- easy, medium, hard
  max_players INTEGER DEFAULT 8,
  current_round INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Players Table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(6) NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  player_name VARCHAR(50) NOT NULL,
  team_number INTEGER,
  score INTEGER DEFAULT 0,
  is_host BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_code, player_name)
);

-- Game State Table (current round info)
CREATE TABLE game_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(6) UNIQUE NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  current_combo VARCHAR(2) NOT NULL,
  round_number INTEGER NOT NULL,
  round_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_limit INTEGER NOT NULL, -- in seconds
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers Table (player submissions)
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(6) NOT NULL REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  word VARCHAR(100) NOT NULL,
  points INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken DECIMAL(5,2) -- seconds taken to answer
);

-- Create indexes for better performance
CREATE INDEX idx_game_rooms_code ON game_rooms(room_code);
CREATE INDEX idx_players_room ON players(room_code);
CREATE INDEX idx_answers_room ON answers(room_code);
CREATE INDEX idx_answers_player ON answers(player_id);

-- Enable Row Level Security
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all on game_rooms" ON game_rooms FOR ALL USING (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all on game_state" ON game_state FOR ALL USING (true);
CREATE POLICY "Allow all on answers" ON answers FOR ALL USING (true);
```

4. Click "Run" to execute the SQL

## Step 4: Enable Realtime

1. Go to **Database** → **Replication**
2. Find these tables and enable replication for each:
   - `game_rooms`
   - `players`
   - `game_state`
   - `answers`
3. Toggle "Enable" for each table

## Step 5: Test Connection

1. Restart your React development server:
```bash
npm start
```

2. Check the browser console - you should NOT see the warning:
   "Supabase credentials not found"

## Step 6: Deploy to Netlify

When deploying to Netlify, add environment variables:

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add:
   - `REACT_APP_SUPABASE_URL` = your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your anon key

## Database Schema Overview

```
game_rooms
├── room_code (6-digit code)
├── host_id
├── status (waiting/playing/finished)
├── game_mode (solo/vs_all/team_2/team_3/team_4)
└── difficulty (easy/medium/hard)

players
├── room_code
├── player_name
├── team_number
├── score
└── is_host

game_state
├── room_code
├── current_combo (e.g., "AB")
├── round_number
└── time_limit

answers
├── room_code
├── player_id
├── word
├── points
└── time_taken
```

## Troubleshooting

**Issue:** "Supabase credentials not found"
- **Solution:** Make sure `.env.local` exists and has correct values
- Restart development server after adding env variables

**Issue:** Database queries fail
- **Solution:** Check RLS policies are enabled
- Verify tables were created successfully in SQL Editor

**Issue:** Realtime not working
- **Solution:** Enable replication for all tables
- Check browser console for WebSocket errors

## Next Steps

Once Supabase is set up:
1. The app will automatically detect the configuration
2. Multiplayer features will be enabled
3. You can create/join games with room codes
4. Real-time updates will work across all players

## Security Notes (For Production)

Currently, RLS policies allow all operations. For production:
1. Restrict who can create rooms
2. Prevent players from modifying other players' data
3. Add rate limiting
4. Validate room codes server-side

Need help? Check Supabase docs: https://supabase.com/docs
