# Netlify Environment Variables Setup

## Required Environment Variables

Set these in your Netlify dashboard:
**Site Settings → Environment Variables → Add a variable**

| Variable | Value |
|---|---|
| `REACT_APP_SUPABASE_URL` | `https://lpevhjwegdhdsyohsawo.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZXZoandlZ2RoZHN5b2hzYXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjE1NTAsImV4cCI6MjA4NzEzNzU1MH0._B13d_KzdKKpyImqg8vn9CjPCYcc-h8SS0Q9g7YbHpo` |

## Steps

1. Go to https://app.netlify.com
2. Select your **wordbombgame** site
3. Click **Site configuration** → **Environment variables**
4. Click **Add a variable** for each variable above
5. After adding both, go to **Deploys** → **Trigger deploy** → **Deploy site**

## Database Setup (One-time)

Run the SQL in `supabase_migrations/000_complete_schema.sql` in your Supabase SQL Editor:
https://supabase.com/dashboard/project/lpevhjwegdhdsyohsawo/sql/new

This creates all required tables:
- `game_rooms` - stores game room info
- `players` - stores player data
- `game_state` - stores current round state
- `answers` - stores submitted words
- `chat_messages` - stores lobby chat

## Local Development

The `.env` file is already set up with the correct credentials.
Run `npm start` to test locally.
