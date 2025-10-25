import React, { useState, useEffect, useCallback, useRef } from 'react';
import './GameScreen.css';
import { 
  getPlayers, 
  subscribeToPlayers, 
  subscribeToGameState,
  subscribeToAnswers,
  submitAnswer,
  startNextRound,
  endGame,
  getRoundAnswers
} from '../lib/gameService';
import { validateWordComplete } from '../lib/wordValidation';
import { supabase } from '../lib/supabase';
import { simulateBotAnswer, getBotsInRoom } from '../lib/botService';
import Chat from './Chat';
import AdminControlPanel from './AdminControlPanel';

const LETTER_COMBOS = [
  'AB', 'AC', 'AD', 'AG', 'AI', 'AL', 'AM', 'AN', 'AP', 'AR', 'AS', 'AT',
  'BA', 'BE', 'BI', 'BO', 'BR', 'CA', 'CH', 'CL', 'CO', 'CR', 'DE', 'DI',
  'DO', 'DR', 'EA', 'ED', 'EL', 'EN', 'ER', 'ES', 'ET', 'EX', 'FA', 'FI',
  'FL', 'FO', 'FR', 'GE', 'GH', 'GI', 'GO', 'GR', 'HA', 'HE', 'HI', 'HO',
  'IC', 'ID', 'IG', 'IL', 'IN', 'IO', 'IR', 'IS', 'IT', 'LA', 'LE', 'LI',
  'LO', 'LY', 'MA', 'ME', 'MI', 'MO', 'NA', 'NE', 'NG', 'NI', 'NO', 'NT',
  'OA', 'OB', 'OC', 'OD', 'OF', 'OI', 'OK', 'OL', 'OM', 'ON', 'OP', 'OR',
  'OS', 'OT', 'OU', 'OV', 'OW', 'OX', 'OY', 'PA', 'PE', 'PH', 'PI', 'PL',
  'PO', 'PR', 'QU', 'RA', 'RE', 'RI', 'RO', 'RU', 'SA', 'SC', 'SE', 'SH',
  'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'ST', 'SU', 'SW', 'TA', 'TE',
  'TH', 'TI', 'TO', 'TR', 'TU', 'TW', 'UN', 'UP', 'UR', 'US', 'UT', 'VE',
  'VI', 'WA', 'WE', 'WH', 'WI', 'WO', 'WR', 'YE', 'YO'
];

function MultiplayerGameScreen({ roomCode, playerId, isHost, onGameEnd }) {
  const [word, setWord] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [roomSettings, setRoomSettings] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [roundAnswers, setRoundAnswers] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showingResults, setShowingResults] = useState(false);
  const [initialCountdown, setInitialCountdown] = useState(10); // 10 second countdown before Round 1
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef(null);
  const currentRoundRef = useRef(null);

  const handleRoundEnd = useCallback(async () => {
    if (!isHost) return;

    setShowingResults(true);
    setCountdown(5); // 5 second countdown
  }, [isHost]);

  const handleNextRound = useCallback(async () => {
    if (!isHost || !roomSettings || !gameState) return;

    setShowingResults(false);

    // Check if game should end
    if (gameState.round_number >= roomSettings.max_rounds) {
      await endGame(roomCode);
      onGameEnd();
      return;
    }

    // Start next round
    const nextCombo = LETTER_COMBOS[Math.floor(Math.random() * LETTER_COMBOS.length)];
    await startNextRound(roomCode, nextCombo, gameState.round_number + 1);
  }, [isHost, roomSettings, gameState, roomCode, onGameEnd]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get room settings
        const { data: room } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('room_code', roomCode)
          .single();
        
        setRoomSettings(room);

        // Get game state
        const { data: state } = await supabase
          .from('game_state')
          .select('*')
          .eq('room_code', roomCode)
          .single();
        
        setGameState(state);
        setTimeLeft(state?.time_limit || 10);

        // Get players
        const playerList = await getPlayers(roomCode);
        setPlayers(playerList);
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    };

    loadData();
  }, [roomCode]);

  // Subscribe to game state changes
  useEffect(() => {
    if (!roomCode) return;

    const subscription = subscribeToGameState(roomCode, async (payload) => {
      if (payload.new) {
        setGameState(payload.new);
        setTimeLeft(payload.new.time_limit || 10);
        setHasAnswered(false);
        setRoundAnswers([]);
        
        // Trigger bots to answer when new round starts
        if (isHost && payload.new.round_number) {
          triggerBotAnswers(payload.new);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [roomCode, isHost]);

  // Subscribe to player changes
  useEffect(() => {
    if (!roomCode) return;

    const subscription = subscribeToPlayers(roomCode, async () => {
      const playerList = await getPlayers(roomCode);
      setPlayers(playerList);
    });

    return () => subscription.unsubscribe();
  }, [roomCode]);

  // Subscribe to answers
  useEffect(() => {
    if (!roomCode || !gameState) return;

    const subscription = subscribeToAnswers(roomCode, (payload) => {
      if (payload.new && payload.new.round_number === gameState.round_number) {
        setRoundAnswers(prev => [...prev, payload.new]);
      }
    });

    return () => subscription.unsubscribe();
  }, [roomCode, gameState]);

  // Initial countdown before Round 1
  useEffect(() => {
    if (!gameState) return;
    
    // Only show countdown for Round 1
    if (gameState.round_number === 1 && !gameStarted) {
      if (initialCountdown > 0) {
        const timer = setTimeout(() => {
          setInitialCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Countdown finished, start the game
        setGameStarted(true);
      }
    } else if (gameState.round_number > 1) {
      // For rounds after 1, game is already started
      setGameStarted(true);
    }
  }, [gameState, initialCountdown, gameStarted]);

  // Timer countdown - only restart when round actually changes
  useEffect(() => {
    if (!gameState || showingResults || countdown > 0 || !gameStarted) {
      console.log('Timer blocked:', { 
        hasGameState: !!gameState, 
        showingResults, 
        countdown, 
        gameStarted,
        roundNumber: gameState?.round_number 
      });
      return;
    }

    // Check if this is a new round
    const isNewRound = currentRoundRef.current !== gameState.round_number;
    
    if (isNewRound) {
      // Clear any existing timer
      if (timerRef.current) {
        console.log('🧹 Clearing old timer for round', currentRoundRef.current);
        clearInterval(timerRef.current);
      }

      // Update current round
      currentRoundRef.current = gameState.round_number;
      
      console.log('🎮 Timer STARTED for round', gameState.round_number);

      // Start new timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            console.log('⏰ Timer EXPIRED for round', currentRoundRef.current);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleRoundEnd();
            return 0;
          }
          return newTime;
        });
      }, 100);
    }

    return () => {
      // Only cleanup on unmount, not on every re-render
      if (timerRef.current) {
        console.log('🧹 Component unmounting, cleaning up timer');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.round_number, showingResults, countdown, gameStarted, handleRoundEnd]);

  // Countdown between rounds
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0 && showingResults) {
      // Countdown finished, start next round or end game
      handleNextRound();
    }
  }, [countdown, showingResults, handleNextRound]);

  // Trigger bot answers for the current round
  const triggerBotAnswers = useCallback(async (currentGameState) => {
    try {
      // Get all bots in the room
      const bots = await getBotsInRoom(roomCode);
      
      if (bots.length === 0) return;
      
      console.log(`Triggering ${bots.length} bots for round ${currentGameState.round_number}`);
      
      // Get words already used this round
      const existingAnswers = await getRoundAnswers(roomCode, currentGameState.round_number);
      const usedWords = existingAnswers.map(a => a.word);
      
      // Trigger each bot to answer (they will answer with delays)
      bots.forEach(bot => {
        simulateBotAnswer(
          roomCode,
          bot.id,
          currentGameState,
          bot.bot_difficulty || 'medium',
          usedWords,
          currentGameState.time_limit || 10
        );
      });
    } catch (error) {
      console.error('Error triggering bot answers:', error);
    }
  }, [roomCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!word.trim() || hasAnswered || !gameState) return;

    const trimmedWord = word.trim().toLowerCase();
    
    // Check minimum length (4 letters for multiplayer)
    if (trimmedWord.length < 4) {
      setMessage('Word must be at least 4 letters');
      setMessageType('error');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    
    // Validate word
    const result = await validateWordComplete(trimmedWord, gameState.current_combo, []);
    
    if (!result.valid) {
      setMessage(result.message);
      setMessageType('error');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Calculate points and time taken
    const points = roomSettings?.points_per_word || Math.max(10, trimmedWord.length * 5);
    const timeTaken = (gameState.time_limit || 10) - timeLeft;

    try {
      await submitAnswer(
        roomCode,
        playerId,
        gameState.round_number,
        trimmedWord,
        points,
        timeTaken
      );

      setHasAnswered(true);
      setMessage(`+${points} points! Great word!`);
      setMessageType('success');
      setWord('');
      
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to submit answer');
      setMessageType('error');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  if (!gameState || !roomSettings) {
    return <div className="game-screen">Loading...</div>;
  }

  // Show initial countdown before Round 1
  if (!gameStarted && initialCountdown > 0) {
    return (
      <div className="game-screen">
        <div className="round-results">
          <h2>🎮 Get Ready!</h2>
          <div className="countdown-display">
            <p>Game starts in</p>
            <div className="countdown-number">{initialCountdown}</div>
          </div>
          <div className="current-standings">
            <h3>Players:</h3>
            {players.map((player, idx) => (
              <div key={player.id} className="standing-item">
                <span className="rank">#{idx + 1}</span>
                <span className="player-name">{player.player_name}</span>
                <span className="player-score">Ready!</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show countdown between rounds
  if (showingResults && countdown > 0) {
    return (
      <div className="game-screen">
        <div className="round-results">
          <h2>Round {gameState.round_number} Complete!</h2>
          <div className="countdown-display">
            <p>Next round in</p>
            <div className="countdown-number">{countdown}</div>
          </div>
          <div className="round-answers">
            <h3>Answers this round:</h3>
            {roundAnswers.map((answer, idx) => (
              <div key={idx} className="answer-item">
                <span className="answer-word">{answer.word}</span>
                <span className="answer-points">+{answer.points}</span>
              </div>
            ))}
          </div>
          <div className="current-standings">
            <h3>Current Standings:</h3>
            {players
              .sort((a, b) => b.score - a.score)
              .map((player, idx) => (
                <div key={player.id} className="standing-item">
                  <span className="rank">#{idx + 1}</span>
                  <span className="player-name">{player.player_name}</span>
                  <span className="player-score">{player.score}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = (timeLeft / (gameState.time_limit || 10)) * 100;
  const currentPlayer = players.find(p => p.id === playerId);
  const currentPlayerName = currentPlayer?.player_name || '';

  return (
    <div className="game-screen-container">
      <div className="game-screen-main">
        <button className="exit-btn" onClick={onGameEnd}>
          ← Exit
        </button>

        <div className="game-header">
          <div className="round-info">
            Round {gameState.round_number} / {roomSettings.max_rounds}
          </div>
          <div className="timer-container">
            <div className="timer-bar" style={{ width: `${progressPercent}%` }}></div>
            <span className="timer-text">{timeLeft.toFixed(1)}s</span>
          </div>
        </div>

        <div className="combo-display">
          <div className="combo-label">Find a word containing:</div>
          <div className="combo-letters">{gameState.current_combo}</div>
        </div>

        <form onSubmit={handleSubmit} className="word-input-form">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Type your word..."
            className="word-input"
            autoFocus
            disabled={hasAnswered}
          />
          <button 
            type="submit" 
            className="submit-btn"
            disabled={hasAnswered || !word.trim()}
          >
            {hasAnswered ? '✓ Answered' : 'Submit'}
          </button>
        </form>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="players-scoreboard">
          <h3>Players</h3>
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, idx) => {
              const playerAnswered = roundAnswers.some(a => a.player_id === player.id);
              return (
                <div key={player.id} className={`player-score-item ${player.id === playerId ? 'current-player' : ''}`}>
                  <span className="player-rank">#{idx + 1}</span>
                  <span className="player-name">
                    {player.player_name}
                    {playerAnswered && <span className="answered-badge">✓</span>}
                  </span>
                  <span className="player-score">{player.score}</span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="game-screen-sidebar">
        {isHost && (
          <AdminControlPanel
            roomCode={roomCode}
            players={players}
            isPaused={false}
            currentRound={gameState.round_number}
            onEndGame={onGameEnd}
          />
        )}
        
        <div className="sidebar-chat">
          <Chat
            roomCode={roomCode}
            playerId={playerId}
            playerName={currentPlayerName}
          />
        </div>
      </div>
    </div>
  );
}

export default MultiplayerGameScreen;
