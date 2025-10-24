# Enable Supabase Realtime for Game Rooms

## Problem
Joiners are stuck in the lobby because they're not receiving real-time updates when the host starts the game.

## Solution: Enable Realtime Replication

You need to enable Realtime for the `game_rooms` table in your Supabase dashboard.

### Steps:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com
   - Select your Word Bomb project

2. **Navigate to Database Replication**
   - Click on **Database** in the left sidebar
   - Click on **Replication**

3. **Enable Replication for game_rooms**
   - Find the `game_rooms` table in the list
   - Toggle the switch to **Enable** replication
   - The toggle should turn green/blue when enabled

4. **Verify Other Tables**
   While you're there, make sure these tables also have replication enabled:
   - ✅ `game_rooms` (most important for this issue)
   - ✅ `players`
   - ✅ `game_state`
   - ✅ `answers`
   - ✅ `chat_messages`

5. **Test the Fix**
   After enabling replication:
   - Create a new game (host)
   - Have a joiner join the game
   - Host clicks "Start Game"
   - Joiner should automatically transition to the game screen

## Why This is Needed

- Supabase Realtime uses PostgreSQL's replication feature
- Without replication enabled, the `.on('postgres_changes', ...)` subscriptions don't work
- This is why joiners aren't receiving updates when the room status changes to 'playing'

## Expected Behavior After Fix

When the host starts the game, you should see in the joiner's console:
```
LobbyScreen: Room update received: {new: {status: 'playing', ...}}
LobbyScreen: Room status is playing, calling onGameStart()
```

Then the joiner will automatically transition to the multiplayer game screen.
