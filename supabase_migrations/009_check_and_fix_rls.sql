-- Check and fix RLS policies for Realtime
-- This version handles existing policies

-- First, drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on game_rooms
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'game_rooms') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON game_rooms';
    END LOOP;
    
    -- Drop all policies on players
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'players') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON players';
    END LOOP;
    
    -- Drop all policies on game_state
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'game_state') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON game_state';
    END LOOP;
    
    -- Drop all policies on answers
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'answers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON answers';
    END LOOP;
    
    -- Drop all policies on chat_messages
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON chat_messages';
    END LOOP;
END $$;

-- Now create the correct policies for Realtime

-- game_rooms policies
CREATE POLICY "game_rooms_select" ON game_rooms FOR SELECT USING (true);
CREATE POLICY "game_rooms_insert" ON game_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "game_rooms_update" ON game_rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "game_rooms_delete" ON game_rooms FOR DELETE USING (true);

-- players policies
CREATE POLICY "players_select" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update" ON players FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "players_delete" ON players FOR DELETE USING (true);

-- game_state policies
CREATE POLICY "game_state_select" ON game_state FOR SELECT USING (true);
CREATE POLICY "game_state_insert" ON game_state FOR INSERT WITH CHECK (true);
CREATE POLICY "game_state_update" ON game_state FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "game_state_delete" ON game_state FOR DELETE USING (true);

-- answers policies
CREATE POLICY "answers_select" ON answers FOR SELECT USING (true);
CREATE POLICY "answers_insert" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "answers_update" ON answers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "answers_delete" ON answers FOR DELETE USING (true);

-- chat_messages policies
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_messages_update" ON chat_messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "chat_messages_delete" ON chat_messages FOR DELETE USING (true);
