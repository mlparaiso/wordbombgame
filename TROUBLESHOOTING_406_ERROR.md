# Troubleshooting 406 Error - Summary

## Problem
Joiners are experiencing a 406 (Not Acceptable) error when trying to join multiplayer games, preventing them from accessing the lobby and transitioning to the game screen.

## Root Cause
The 406 error is caused by Supabase's Row Level Security (RLS) policies or missing request headers in the Supabase client configuration.

## Solutions Implemented

### 1. RLS Policies Fixed (Migration 007)
- Created `supabase_migrations/007_fix_rls_policies.sql`
- Dropped all existing conflicting RLS policies
- Created new permissive policies that allow all operations on:
  - `game_rooms`
  - `players`
  - `game_state`
  - `answers`

**Status:** ✅ Migration successfully executed in Supabase

### 2. Supabase Client Headers Updated
- Updated `src/lib/supabase.js` to explicitly set required headers:
  - `Accept: application/json`
  - `Content-Type: application/json`
- Disabled session persistence (not needed for this app)

**Status:** ✅ Code updated, but requires server restart to take effect

## Next Steps Required

### To Test the Fix:

1. **Stop the development server:**
   - In your terminal where `npm start` is running, press `Ctrl+C`

2. **Restart the development server:**
   ```bash
   npm start
   ```

3. **Clear browser cache:**
   - In both host and joiner browsers, press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

4. **Test the multiplayer flow:**
   - Host creates a game
   - Joiner joins using room code
   - Host starts the game
   - Verify joiner transitions to game screen

5. **Check console output:**
   - Open browser DevTools (F12)
   - Look for:
     - ✅ No 406 errors
     - ✅ "LobbyScreen rendered with roomCode: [CODE]" messages
     - ✅ "LobbyScreen: Room update received" when host starts game

## Expected Behavior After Fix

### Joiner Console (Success):
```
Loading dictionary...
Dictionary loaded: 370105 words in XXXms
LobbyScreen rendered with roomCode: XXXXXX
LobbyScreen: Subscribing to room changes for roomCode: XXXXXX
[When host starts game]
LobbyScreen: Room update received: {...}
LobbyScreen: Room status is playing, calling onGameStart()
```

### Joiner Console (Still Failing):
```
Loading dictionary...
Dictionary loaded: 370105 words in XXXms
GET https://...supabase.co/rest/v1/players?... 406 (Not Acceptable)
```

## If 406 Error Persists

If the error continues after restarting the server, the issue may be:

1. **Supabase API Key Issue:**
   - Verify `.env.local` has correct `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
   - Ensure no extra spaces or quotes in the values

2. **Supabase Project Settings:**
   - Check if API is enabled in Supabase dashboard
   - Verify the anon key has not been regenerated

3. **Network/CORS Issue:**
   - Check if requests are being blocked by browser
   - Verify Supabase project allows requests from localhost

## Files Modified

1. `supabase_migrations/006_add_rls_policies.sql` - Initial RLS fix attempt
2. `supabase_migrations/007_fix_rls_policies.sql` - Comprehensive RLS fix
3. `src/lib/supabase.js` - Added explicit headers configuration
4. `src/components/LobbyScreen.js` - Added debug console logs

## Debugging Console Logs Added

The following logs were added to help diagnose the issue:
- `LobbyScreen rendered with roomCode: [CODE]` - Confirms component renders
- `LobbyScreen: Subscribing to room changes for roomCode: [CODE]` - Confirms subscription setup
- `LobbyScreen: Room update received: [payload]` - Confirms real-time updates work
- `LobbyScreen: Room status is playing, calling onGameStart()` - Confirms transition trigger

These logs can be removed once the issue is resolved.
