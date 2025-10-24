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
 * @param {number} maxRounds - Maximum number of rounds (default: 10)
 * @param {number} livesPerPlayer - Lives per player (default: 3)
 * @param {number} pointsPerWord - Points awarded per word (default: 50)
 * @param {boolean} isSpectator - Whether host joins as spectator (default: false)
 * @returns {Promise<{roomCode: string, playerId: string, isSpectator: boolean}>}
 */
export const createGameRoom = async (
  hostName,
  gameMode,
  difficulty,
  maxRounds = 10,
  livesPerPlayer = 3,
  pointsPerWord = 50,
  isSpectator = false
) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const roomCode = generateRoomCode();
  const hostId = crypto.randomUUID();
  
  // Create game room with settings
  const { error: roomError } = await supabase
    .from('game_rooms')
    .insert({
      room_code: roomCode,
      host_id: hostId,
      game_mode: gameMode,
      difficulty: difficulty,
      max_rounds: maxRounds,
      lives_per_player: livesPerPlayer,
      points_per_word: pointsPerWord,
      status: 'waiting'
    });
  
  if (roomError) throw roomError;
  
  // Add host as first player with initial lives
  const { error: playerError } = await supabase
    .from('players')
    .insert({
      id: hostId,
      room_code: roomCode,
      player_name: hostName,
      is_host: true,
      is_spectator: isSpectator,
      score: 0,
      lives: livesPerPlayer
    });
  
  if (playerError) throw playerError;
  
  return { roomCode, playerId: hostId, isSpectator };
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
  
  // Add player to room with initial lives from room settings
  const playerId = crypto.randomUUID();
  const { error: playerError } = await supabase
    .from('players')
    .insert({
      id: playerId,
      room_code: roomCode.toUpperCase(),
      player_name: playerName,
      is_host: false,
      score: 0,
      lives: room.lives_per_player || 3
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

/**
 * Select a team for a player
 * @param {string} playerId - The player ID
 * @param {number} teamNumber - The team number to join (1, 2, 3...)
 * @param {string} roomCode - The room code
 */
export const selectTeam = async (playerId, teamNumber, roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  // Get room info to check team capacity
  const { data: room } = await supabase
    .from('game_rooms')
    .select('game_mode')
    .eq('room_code', roomCode.toUpperCase())
    .single();
  
  if (!room) throw new Error('Room not found');
  
  const teamSize = parseInt(room.game_mode.split('_')[1]);
  
  // Check if team is full
  const { data: teamPlayers } = await supabase
    .from('players')
    .select('id')
    .eq('room_code', roomCode.toUpperCase())
    .eq('team_number', teamNumber)
    .eq('is_active', true);
  
  if (teamPlayers && teamPlayers.length >= teamSize) {
    throw new Error('Team is full');
  }
  
  // Assign player to team
  const { error } = await supabase
    .from('players')
    .update({ team_number: teamNumber })
    .eq('id', playerId);
  
  if (error) throw error;
};

/**
 * Leave current team and return to waiting area
 * @param {string} playerId - The player ID
 * @param {string} roomCode - The room code
 */
export const leaveTeam = async (playerId, roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('players')
    .update({ team_number: null })
    .eq('id', playerId);
  
  if (error) throw error;
};

/**
 * Get team capacity for a room
 * @param {string} roomCode - The room code
 * @returns {Promise<number>} - Team size (2, 3, or 4)
 */
export const getTeamCapacity = async (roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: room } = await supabase
    .from('game_rooms')
    .select('game_mode')
    .eq('room_code', roomCode.toUpperCase())
    .single();
  
  if (!room) throw new Error('Room not found');
  
  return parseInt(room.game_mode.split('_')[1]);
};

/**
 * Send a chat message
 * @param {string} roomCode - The room code
 * @param {string} playerId - The player ID (can be null for system messages)
 * @param {string} playerName - The player name
 * @param {string} message - The message text
 * @param {boolean} isSystemMessage - Whether this is a system message
 */
export const sendChatMessage = async (roomCode, playerId, playerName, message, isSystemMessage = false) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      room_code: roomCode.toUpperCase(),
      player_id: playerId,
      player_name: playerName,
      message: message,
      is_system_message: isSystemMessage
    });
  
  if (error) throw error;
};

/**
 * Get chat messages for a room
 * @param {string} roomCode - The room code
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Array>}
 */
export const getChatMessages = async (roomCode, limit = 50) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
};

/**
 * Subscribe to chat messages
 * @param {string} roomCode - The room code
 * @param {Function} callback - Callback function when new messages arrive
 * @returns {Object} Subscription object
 */
export const subscribeToChatMessages = (roomCode, callback) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  return supabase
    .channel(`chat:${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_code=eq.${roomCode.toUpperCase()}`
      },
      callback
    )
    .subscribe();
};

/**
 * Pause the game
 * @param {string} roomCode - The room code
 * @param {number} timeRemaining - Seconds remaining when paused
 */
export const pauseGame = async (roomCode, timeRemaining) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('game_rooms')
    .update({
      is_paused: true,
      paused_at: new Date().toISOString(),
      paused_time_remaining: Math.floor(timeRemaining)
    })
    .eq('room_code', roomCode.toUpperCase());
  
  if (error) throw error;
};

/**
 * Resume the game
 * @param {string} roomCode - The room code
 */
export const resumeGame = async (roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('game_rooms')
    .update({
      is_paused: false,
      paused_at: null
    })
    .eq('room_code', roomCode.toUpperCase());
  
  if (error) throw error;
};

/**
 * Kick a player from the room
 * @param {string} playerId - The player ID to kick
 */
export const kickPlayer = async (playerId) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('players')
    .update({ is_active: false })
    .eq('id', playerId);
  
  if (error) throw error;
};

/**
 * Subscribe to room changes (for pause/resume/settings)
 * @param {string} roomCode - The room code
 * @param {Function} callback - Callback function when room changes
 * @returns {Object} Subscription object
 */
export const subscribeToRoom = (roomCode, callback) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  return supabase
    .channel(`room:${roomCode}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `room_code=eq.${roomCode.toUpperCase()}`
      },
      callback
    )
    .subscribe();
};

/**
 * Get team scores (aggregated from individual player scores)
 * @param {string} roomCode - The room code
 * @returns {Promise<Array>} - Array of team scores with team info
 */
export const getTeamScores = async (roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: players, error } = await supabase
    .from('players')
    .select('team_number, score, player_name')
    .eq('room_code', roomCode.toUpperCase())
    .eq('is_active', true)
    .not('team_number', 'is', null);
  
  if (error) throw error;
  
  // Aggregate scores by team
  const teamScores = {};
  const teamMembers = {};
  
  players.forEach(player => {
    const teamNum = player.team_number;
    if (!teamScores[teamNum]) {
      teamScores[teamNum] = 0;
      teamMembers[teamNum] = [];
    }
    teamScores[teamNum] += player.score || 0;
    teamMembers[teamNum].push(player.player_name);
  });
  
  // Convert to array and sort by score
  const teams = Object.entries(teamScores).map(([teamNumber, totalScore]) => ({
    teamNumber: parseInt(teamNumber),
    totalScore,
    members: teamMembers[teamNumber],
    memberCount: teamMembers[teamNumber].length
  }));
  
  teams.sort((a, b) => b.totalScore - a.totalScore);
  
  return teams;
};
