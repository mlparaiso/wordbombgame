import { supabase } from './supabase';

/**
 * Generate a random 6-digit room code
 */
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Create a new game room
 * @param {string} hostName - Name of the host player
 * @param {string} gameMode - Game mode (solo, vs_all, team_2, team_3, team_4)
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {Promise<{roomCode: string, playerId: string}>}
 */
export const createGameRoom = async (hostName, gameMode, difficulty) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const roomCode = generateRoomCode();
  const hostId = crypto.randomUUID();
  
  // Create game room
  const { error: roomError } = await supabase
    .from('game_rooms')
    .insert({
      room_code: roomCode,
      host_id: hostId,
      game_mode: gameMode,
      difficulty: difficulty,
      status: 'waiting'
    });
  
  if (roomError) throw roomError;
  
  // Add host as first player
  const { error: playerError } = await supabase
    .from('players')
    .insert({
      id: hostId,
      room_code: roomCode,
      player_name: hostName,
      is_host: true,
      score: 0
    });
  
  if (playerError) throw playerError;
  
  return { roomCode, playerId: hostId };
};

/**
 * Join an existing game room
 * @param {string} roomCode - The room code to join
 * @param {string} playerName - Name of the player joining
 * @returns {Promise<{playerId: string, gameMode: string}>}
 */
export const joinGameRoom = async (roomCode, playerName) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  // Check if room exists and is waiting
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .single();
  
  if (roomError || !room) {
    throw new Error('Room not found');
  }
  
  if (room.status !== 'waiting') {
    throw new Error('Game already started');
  }
  
  // Check if name is already taken
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('id')
    .eq('room_code', roomCode.toUpperCase())
    .eq('player_name', playerName)
    .single();
  
  if (existingPlayer) {
    throw new Error('Name already taken');
  }
  
  // Add player to room
  const playerId = crypto.randomUUID();
  const { error: playerError } = await supabase
    .from('players')
    .insert({
      id: playerId,
      room_code: roomCode.toUpperCase(),
      player_name: playerName,
      is_host: false,
      score: 0
    });
  
  if (playerError) throw playerError;
  
  return { playerId, gameMode: room.game_mode };
};

/**
 * Get all players in a room
 * @param {string} roomCode - The room code
 * @returns {Promise<Array>}
 */
export const getPlayers = async (roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .eq('is_active', true)
    .order('joined_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

/**
 * Subscribe to player changes in a room
 * @param {string} roomCode - The room code
 * @param {Function} callback - Callback function when players change
 * @returns {Object} Subscription object
 */
export const subscribeToPlayers = (roomCode, callback) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  return supabase
    .channel(`players:${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_code=eq.${roomCode.toUpperCase()}`
      },
      callback
    )
    .subscribe();
};

/**
 * Assign teams to players
 * @param {string} roomCode - The room code
 * @param {number} teamSize - Number of players per team (2, 3, or 4)
 * @param {boolean} random - Whether to assign randomly or in order
 */
export const assignTeams = async (roomCode, teamSize, random = true) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const players = await getPlayers(roomCode);
  
  if (random) {
    // Shuffle players
    players.sort(() => Math.random() - 0.5);
  }
  
  // Assign team numbers
  const updates = players.map((player, index) => ({
    id: player.id,
    team_number: Math.floor(index / teamSize) + 1
  }));
  
  // Update all players with their team assignments
  for (const update of updates) {
    await supabase
      .from('players')
      .update({ team_number: update.team_number })
      .eq('id', update.id);
  }
};

/**
 * Start the game
 * @param {string} roomCode - The room code
 * @param {string} firstCombo - The first letter combination
 */
export const startGame = async (roomCode, firstCombo) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  // Get room info for time limit
  const { data: room } = await supabase
    .from('game_rooms')
    .select('difficulty')
    .eq('room_code', roomCode.toUpperCase())
    .single();
  
  const timeLimit = room.difficulty === 'easy' ? 15 : room.difficulty === 'hard' ? 7 : 10;
  
  // Update room status
  await supabase
    .from('game_rooms')
    .update({ 
      status: 'playing',
      started_at: new Date().toISOString(),
      current_round: 1
    })
    .eq('room_code', roomCode.toUpperCase());
  
  // Create initial game state
  await supabase
    .from('game_state')
    .insert({
      room_code: roomCode.toUpperCase(),
      current_combo: firstCombo,
      round_number: 1,
      time_limit: timeLimit
    });
};

/**
 * Subscribe to game state changes
 * @param {string} roomCode - The room code
 * @param {Function} callback - Callback function when game state changes
 * @returns {Object} Subscription object
 */
export const subscribeToGameState = (roomCode, callback) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  return supabase
    .channel(`game_state:${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_state',
        filter: `room_code=eq.${roomCode.toUpperCase()}`
      },
      callback
    )
    .subscribe();
};

/**
 * Submit an answer
 * @param {string} roomCode - The room code
 * @param {string} playerId - The player ID
 * @param {number} roundNumber - Current round number
 * @param {string} word - The submitted word
 * @param {number} points - Points earned
 * @param {number} timeTaken - Time taken to answer in seconds
 */
export const submitAnswer = async (roomCode, playerId, roundNumber, word, points, timeTaken) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  // Save answer
  await supabase
    .from('answers')
    .insert({
      room_code: roomCode.toUpperCase(),
      player_id: playerId,
      round_number: roundNumber,
      word: word.toLowerCase(),
      points: points,
      time_taken: timeTaken
    });
  
  // Update player score
  const { data: player } = await supabase
    .from('players')
    .select('score')
    .eq('id', playerId)
    .single();
  
  await supabase
    .from('players')
    .update({ score: (player?.score || 0) + points })
    .eq('id', playerId);
};

/**
 * Get answers for a specific round
 * @param {string} roomCode - The room code
 * @param {number} roundNumber - The round number
 * @returns {Promise<Array>}
 */
export const getRoundAnswers = async (roomCode, roundNumber) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('answers')
    .select(`
      *,
      players (player_name, team_number)
    `)
    .eq('room_code', roomCode.toUpperCase())
    .eq('round_number', roundNumber)
    .order('submitted_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

/**
 * Subscribe to answers in real-time
 * @param {string} roomCode - The room code
 * @param {Function} callback - Callback function when answers are submitted
 * @returns {Object} Subscription object
 */
export const subscribeToAnswers = (roomCode, callback) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  return supabase
    .channel(`answers:${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'answers',
        filter: `room_code=eq.${roomCode.toUpperCase()}`
      },
      callback
    )
    .subscribe();
};

/**
 * Start next round
 * @param {string} roomCode - The room code
 * @param {string} nextCombo - The next letter combination
 * @param {number} roundNumber - The new round number
 */
export const startNextRound = async (roomCode, nextCombo, roundNumber) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  // Update game state
  await supabase
    .from('game_state')
    .update({
      current_combo: nextCombo,
      round_number: roundNumber,
      round_start_time: new Date().toISOString()
    })
    .eq('room_code', roomCode.toUpperCase());
  
  // Update room's current round
  await supabase
    .from('game_rooms')
    .update({ current_round: roundNumber })
    .eq('room_code', roomCode.toUpperCase());
};

/**
 * End the game
 * @param {string} roomCode - The room code
 */
export const endGame = async (roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  await supabase
    .from('game_rooms')
    .update({ 
      status: 'finished',
      finished_at: new Date().toISOString()
    })
    .eq('room_code', roomCode.toUpperCase());
};

/**
 * Get final leaderboard
 * @param {string} roomCode - The room code
 * @returns {Promise<Array>}
 */
export const getLeaderboard = async (roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .eq('is_active', true)
    .order('score', { ascending: false });
  
  if (error) throw error;
  return data || [];
};
