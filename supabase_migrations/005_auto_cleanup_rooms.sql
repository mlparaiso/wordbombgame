-- Function to automatically mark rooms as abandoned if they have no active players
CREATE OR REPLACE FUNCTION cleanup_abandoned_rooms()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark rooms as abandoned if they have no active players
  UPDATE game_rooms
  SET 
    status = 'abandoned',
    finished_at = NOW()
  WHERE 
    status = 'waiting'
    AND room_code NOT IN (
      SELECT DISTINCT room_code 
      FROM players 
      WHERE is_active = true
    );
END;
$$;

-- Function to delete old abandoned rooms (older than 1 hour)
CREATE OR REPLACE FUNCTION delete_old_rooms()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete game_state records for old rooms
  DELETE FROM game_state
  WHERE room_code IN (
    SELECT room_code 
    FROM game_rooms 
    WHERE status = 'abandoned' 
    AND finished_at < NOW() - INTERVAL '1 hour'
  );
  
  -- Delete answers for old rooms
  DELETE FROM answers
  WHERE room_code IN (
    SELECT room_code 
    FROM game_rooms 
    WHERE status = 'abandoned' 
    AND finished_at < NOW() - INTERVAL '1 hour'
  );
  
  -- Delete chat messages for old rooms
  DELETE FROM chat_messages
  WHERE room_code IN (
    SELECT room_code 
    FROM game_rooms 
    WHERE status = 'abandoned' 
    AND finished_at < NOW() - INTERVAL '1 hour'
  );
  
  -- Delete players for old rooms
  DELETE FROM players
  WHERE room_code IN (
    SELECT room_code 
    FROM game_rooms 
    WHERE status = 'abandoned' 
    AND finished_at < NOW() - INTERVAL '1 hour'
  );
  
  -- Finally, delete the old rooms themselves
  DELETE FROM game_rooms
  WHERE status = 'abandoned' 
  AND finished_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Trigger function to check for abandoned rooms when a player becomes inactive
CREATE OR REPLACE FUNCTION check_room_on_player_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Only check if player was set to inactive
  IF NEW.is_active = false AND OLD.is_active = true THEN
    -- Count active players in the room
    SELECT COUNT(*) INTO active_count
    FROM players
    WHERE room_code = NEW.room_code
    AND is_active = true;
    
    -- If no active players, mark room as abandoned
    IF active_count = 0 THEN
      UPDATE game_rooms
      SET 
        status = 'abandoned',
        finished_at = NOW()
      WHERE room_code = NEW.room_code
      AND status = 'waiting';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on players table
DROP TRIGGER IF EXISTS trigger_check_abandoned_room ON players;
CREATE TRIGGER trigger_check_abandoned_room
AFTER UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION check_room_on_player_update();

-- Run initial cleanup of existing abandoned rooms
SELECT cleanup_abandoned_rooms();

-- Note: To set up automatic periodic cleanup, you'll need to use Supabase's pg_cron extension
-- or call delete_old_rooms() from your application periodically
-- For now, you can manually run: SELECT delete_old_rooms();
