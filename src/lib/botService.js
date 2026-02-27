import { supabase } from './supabase';
import { generateBotName } from './botNames';
import { validateWordComplete } from './wordValidation';
import { submitAnswer } from './gameService';

/**
 * Bot difficulty configurations
 */
const BOT_CONFIGS = {
  easy: {
    minDelay: 3000,      // 3 seconds
    maxDelay: 5000,      // 5 seconds
    minWordLength: 4,
    maxWordLength: 6,
    failureRate: 0.10    // 10% chance to timeout
  },
  medium: {
    minDelay: 2000,      // 2 seconds
    maxDelay: 3000,      // 3 seconds
    minWordLength: 5,
    maxWordLength: 8,
    failureRate: 0.05    // 5% chance to timeout
  },
  hard: {
    minDelay: 1000,      // 1 second
    maxDelay: 2000,      // 2 seconds
    minWordLength: 7,
    maxWordLength: 12,
    failureRate: 0.02    // 2% chance to timeout
  }
};

/**
 * Load dictionary words from public/words.txt
 * @returns {Promise<Array<string>>} Array of valid words
 */
let cachedDictionary = null;
export const loadDictionary = async () => {
  if (cachedDictionary) {
    return cachedDictionary;
  }

  try {
    const response = await fetch('/words.txt');
    const text = await response.text();
    cachedDictionary = text
      .split('\n')
      .map(word => word.trim().toLowerCase())
      .filter(word => word.length >= 3);
    return cachedDictionary;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    return [];
  }
};

/**
 * Get a valid word for the bot to submit
 * @param {string} combo - The letter combination to find
 * @param {string} difficulty - Bot difficulty level
 * @param {Array<string>} usedWords - Words already used in this game
 * @returns {Promise<string|null>} A valid word or null if none found
 */
export const getBotWord = async (combo, difficulty, usedWords = []) => {
  const dictionary = await loadDictionary();
  const config = BOT_CONFIGS[difficulty] || BOT_CONFIGS.medium;
  
  // Filter words containing the combo
  const validWords = dictionary.filter(word => 
    word.includes(combo.toLowerCase())
  );
  
  // Filter by word length based on difficulty
  const sizedWords = validWords.filter(word => 
    word.length >= config.minWordLength && 
    word.length <= config.maxWordLength
  );
  
  // Exclude already used words
  const availableWords = sizedWords.filter(word => 
    !usedWords.map(w => w.toLowerCase()).includes(word)
  );
  
  if (availableWords.length === 0) {
    // Fallback: try any valid word if no words in preferred range
    const fallbackWords = validWords.filter(word => 
      !usedWords.map(w => w.toLowerCase()).includes(word) &&
      word.length >= 4
    );
    
    if (fallbackWords.length === 0) {
      return null;
    }
    
    return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
  }
  
  // Pick a random word from available options
  return availableWords[Math.floor(Math.random() * availableWords.length)];
};

/**
 * Create a bot player in the database
 * @param {string} roomCode - The room code
 * @param {string} difficulty - Bot difficulty level
 * @param {Array<string>} existingPlayerNames - Names already in use
 * @returns {Promise<{botId: string, botName: string}>}
 */
export const createBotPlayer = async (roomCode, difficulty, existingPlayerNames = []) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  // Generate unique bot name
  const botName = generateBotName(existingPlayerNames);
  const botId = crypto.randomUUID();
  
  // Get room settings for initial lives
  const { data: room } = await supabase
    .from('game_rooms')
    .select('lives_per_player')
    .eq('room_code', roomCode.toUpperCase())
    .single();
  
  const initialLives = room?.lives_per_player || 3;
  
  // Create bot player
  const { error } = await supabase
    .from('players')
    .insert({
      id: botId,
      room_code: roomCode.toUpperCase(),
      player_name: botName,
      is_host: false,
      is_bot: true,
      bot_difficulty: difficulty,
      score: 0,
      lives: initialLives,
      is_spectator: false
    });
  
  if (error) throw error;
  
  return { botId, botName };
};

/**
 * Simulate a bot answering during a round
 * @param {string} roomCode - The room code
 * @param {string} botId - The bot's player ID
 * @param {Object} gameState - Current game state
 * @param {string} difficulty - Bot difficulty level
 * @param {Array<string>} usedWords - Words already used this round
 * @param {number} timeLimit - Time limit for the round
 */
export const simulateBotAnswer = async (
  roomCode,
  botId,
  gameState,
  difficulty,
  usedWords = [],
  timeLimit = 10
) => {
  const config = BOT_CONFIGS[difficulty] || BOT_CONFIGS.medium;
  
  // Random delay based on difficulty
  const delay = Math.random() * (config.maxDelay - config.minDelay) + config.minDelay;
  
  // Check if bot should fail (timeout)
  const shouldFail = Math.random() < config.failureRate;
  
  if (shouldFail) {
    console.log(`Bot ${botId} will timeout this round`);
    return; // Bot doesn't answer
  }
  
  // Wait for the delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Check if round is still active (hasn't ended while bot was "thinking")
  const { data: currentState } = await supabase
    .from('game_state')
    .select('round_number')
    .eq('room_code', roomCode.toUpperCase())
    .single();
  
  if (!currentState || currentState.round_number !== gameState.round_number) {
    console.log(`Bot ${botId} took too long, round already ended`);
    return;
  }
  
  // Get a valid word
  const word = await getBotWord(gameState.current_combo, difficulty, usedWords);
  
  if (!word) {
    console.log(`Bot ${botId} couldn't find a valid word`);
    return;
  }
  
  // Validate the word (double-check)
  const validation = await validateWordComplete(word, gameState.current_combo, usedWords);
  
  if (!validation.valid) {
    console.log(`Bot ${botId} word validation failed:`, validation.message);
    return;
  }
  
  // Fetch room settings so bot uses same scoring as human players
  let pointsPerWord = 50; // default
  try {
    const { data: roomData } = await supabase
      .from('game_rooms')
      .select('points_per_word')
      .eq('room_code', roomCode.toUpperCase())
      .single();
    if (roomData?.points_per_word) {
      pointsPerWord = roomData.points_per_word;
    }
  } catch (_) { /* use default */ }

  // Same formula as human players: base + length bonus (per char beyond 4)
  const basePoints = pointsPerWord;
  const lengthBonus = Math.max(0, (word.length - 4) * 5);
  const points = basePoints + lengthBonus;
  const timeTaken = delay / 1000; // Convert to seconds
  
  // Submit the answer
  try {
    await submitAnswer(
      roomCode,
      botId,
      gameState.round_number,
      word,
      points,
      timeTaken
    );
    console.log(`Bot ${botId} submitted: ${word} (+${points} points)`);
  } catch (error) {
    console.error(`Bot ${botId} failed to submit answer:`, error);
  }
};

/**
 * Get all bot players in a room
 * @param {string} roomCode - The room code
 * @returns {Promise<Array>} Array of bot players
 */
export const getBotsInRoom = async (roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .eq('is_bot', true)
    .eq('is_active', true);
  
  if (error) throw error;
  return data || [];
};

/**
 * Remove all bots from a room
 * @param {string} roomCode - The room code
 */
export const removeAllBots = async (roomCode) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('players')
    .update({ is_active: false })
    .eq('room_code', roomCode.toUpperCase())
    .eq('is_bot', true);
  
  if (error) throw error;
};
