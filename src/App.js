import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import HomeScreen from './components/HomeScreen';
import MenuScreen from './components/MenuScreen';
import GameScreen from './components/GameScreen';
import MultiplayerGameScreen from './components/MultiplayerGameScreen';
import GameOverScreen from './components/GameOverScreen';
import CreateGameScreen from './components/CreateGameScreen';
import JoinGameScreen from './components/JoinGameScreen';
import LobbyScreen from './components/LobbyScreen';
import { createGameRoom, joinGameRoom, checkAndCleanupRoom } from './lib/gameService';
import { validateWordComplete } from './lib/wordValidation';
import { preloadDictionary } from './lib/dictionaryService';
import { sounds } from './lib/soundService';

const letterCombos = [
  'AB', 'AC', 'AD', 'AG', 'AI', 'AL', 'AM', 'AN', 'AP', 'AR', 'AS', 'AT', 'AY',
  'BA', 'BE', 'BI', 'BO', 'BR', 'BU', 'BY',
  'CA', 'CE', 'CH', 'CI', 'CK', 'CL', 'CO', 'CR', 'CT', 'CU',
  'DA', 'DE', 'DI', 'DO', 'DR', 'DU', 'DY',
  'EA', 'ED', 'EE', 'EL', 'EM', 'EN', 'ER', 'ES', 'ET', 'EW', 'EX', 'EY',
  'FA', 'FE', 'FI', 'FL', 'FO', 'FR', 'FU',
  'GA', 'GE', 'GH', 'GI', 'GL', 'GO', 'GR', 'GU',
  'HA', 'HE', 'HI', 'HO', 'HU',
  'IC', 'ID', 'IE', 'IF', 'IG', 'IL', 'IM', 'IN', 'IO', 'IR', 'IS', 'IT', 'IV',
  'JA', 'JE', 'JO', 'JU',
  'KE', 'KI', 'KN',
  'LA', 'LE', 'LI', 'LL', 'LO', 'LU', 'LY',
  'MA', 'ME', 'MI', 'MO', 'MP', 'MU', 'MY',
  'NA', 'NE', 'NG', 'NI', 'NO', 'NT', 'NU',
  'OA', 'OB', 'OC', 'OD', 'OF', 'OG', 'OI', 'OK', 'OL', 'OM', 'ON', 'OO', 'OP', 'OR', 'OS', 'OT', 'OU', 'OV', 'OW', 'OX', 'OY',
  'PA', 'PE', 'PH', 'PI', 'PL', 'PO', 'PR', 'PU',
  'QU',
  'RA', 'RE', 'RG', 'RI', 'RK', 'RM', 'RN', 'RO', 'RP', 'RR', 'RS', 'RT', 'RU', 'RY',
  'SA', 'SC', 'SE', 'SH', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'ST', 'SU', 'SW', 'SY',
  'TA', 'TE', 'TH', 'TI', 'TO', 'TR', 'TT', 'TU', 'TW', 'TY',
  'UB', 'UC', 'UD', 'UE', 'UG', 'UI', 'UL', 'UM', 'UN', 'UP', 'UR', 'US', 'UT',
  'VA', 'VE', 'VI', 'VO',
  'WA', 'WE', 'WH', 'WI', 'WO', 'WR',
  'YE', 'YO', 'YS',
  'ZE', 'ZO'
];

function App() {
  // Screen navigation
  const [screen, setScreen] = useState('home');
  
  // Single-player game state
  const [difficulty, setDifficulty] = useState('medium');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [currentCombo, setCurrentCombo] = useState('');
  const [usedWords, setUsedWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [maxTime, setMaxTime] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  // Incrementing key that restarts the timer interval after each round/life-loss
  const [timerKey, setTimerKey] = useState(0);

  // Multiplayer state
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [isHost, setIsHost] = useState(false);

  const MAX_SOLO_ROUNDS = 20;
  // Track recently used combos to avoid repeats within the last N rounds
  const recentCombosRef = React.useRef([]);
  const RECENT_COMBO_WINDOW = 10; // don't repeat a combo within the last 10 picks

  // Refs to hold latest values so timer callback never captures stale closures
  const livesRef = React.useRef(lives);
  const maxTimeRef = React.useRef(maxTime);
  const isHandlingTimeoutRef = React.useRef(false); // prevent double-fire

  // Keep refs in sync
  React.useEffect(() => { livesRef.current = lives; }, [lives]);
  React.useEffect(() => { maxTimeRef.current = maxTime; }, [maxTime]);

  const getRandomCombo = useCallback(() => {
    const recent = recentCombosRef.current;
    // Filter out recently used combos so we don't repeat within the window
    const available = letterCombos.filter(c => !recent.includes(c));
    // If somehow all combos are "recent" (very small combo list), fall back to full list
    const pool = available.length > 0 ? available : letterCombos;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    // Update the recency window
    recentCombosRef.current = [...recent, chosen].slice(-RECENT_COMBO_WINDOW);
    return chosen;
  }, []);

  // Single-player: Start game
  const startGame = useCallback((selectedDifficulty) => {
    let time;
    switch(selectedDifficulty) {
      case 'easy':
        time = 15;
        break;
      case 'medium':
        time = 10;
        break;
      case 'hard':
        time = 7;
        break;
      default:
        time = 10;
    }

    // Reset recency window and timeout guard at the start of each game
    recentCombosRef.current = [];
    isHandlingTimeoutRef.current = false;

    setDifficulty(selectedDifficulty);
    setScore(0);
    setRound(1);
    setLives(3);
    setUsedWords([]);
    setMaxTime(time);
    setTimeLeft(time);
    setTimerKey(0); // reset timer key for fresh game
    setCurrentCombo(getRandomCombo());
    setIsPlaying(true);
    setScreen('game');
  }, [getRandomCombo]);

  const startNewRound = useCallback((currentRound) => {
    // End game after MAX_SOLO_ROUNDS successful answers
    if (currentRound >= MAX_SOLO_ROUNDS) {
      setIsPlaying(false);
      sounds.gameOver();
      setScreen('gameOver');
      return;
    }
    setCurrentCombo(getRandomCombo());
    setTimeLeft(maxTimeRef.current);
    setTimerKey(k => k + 1); // restart timer interval for new round
  }, [getRandomCombo]);

  // handleTimeout reads lives and maxTime from refs to avoid stale closures.
  // It is stable (no dep changes) so the timer useEffect only runs once per game start.
  const handleTimeout = useCallback(() => {
    // Guard: ignore if already handling a timeout (timer can fire multiple times at 0)
    if (isHandlingTimeoutRef.current) return;
    isHandlingTimeoutRef.current = true;

    sounds.timeout();

    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setIsPlaying(false);
        sounds.gameOver();
        setScreen('gameOver');
      } else {
        // Timeout doesn't advance the round — same round count, new combo
        setTimeout(() => {
          isHandlingTimeoutRef.current = false;
          setCurrentCombo(getRandomCombo());
          setTimeLeft(maxTimeRef.current);
          setTimerKey(k => k + 1); // restart timer interval
        }, 1500);
      }
      return newLives;
    });
  }, [getRandomCombo]); // stable — no lives/maxTime in deps

  const submitWord = useCallback(async (word) => {
    if (!isPlaying) return { success: false, message: '' };

    // Validate word using the complete validation with API check
    const result = await validateWordComplete(word, currentCombo, usedWords);
    
    if (!result.valid) {
      sounds.error();
      return { success: false, message: result.message };
    }

    // Word is valid - award points
    const trimmedWord = word.trim().toLowerCase();
    const points = Math.max(10, trimmedWord.length * 5);
    sounds.success();
    setScore(prev => prev + points);
    setUsedWords(prev => [...prev, trimmedWord]);
    setRound(prev => {
      const nextRound = prev + 1;
      // Schedule next round start with the new round value
      setTimeout(() => {
        startNewRound(nextRound);
      }, 1000);
      return nextRound;
    });

    return { success: true, message: `+${points} points! Great word!` };
  }, [isPlaying, currentCombo, usedWords, startNewRound]);

  const goToHome = useCallback(async () => {
    setIsPlaying(false);
    
    // Mark player as inactive and cleanup room if empty
    if (roomCode && playerId) {
      try {
        const { supabase } = await import('./lib/supabase');
        await supabase
          .from('players')
          .update({ is_active: false })
          .eq('id', playerId);
        
        // Check if room should be marked as abandoned
        await checkAndCleanupRoom(roomCode);
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
    
    setRoomCode('');
    setPlayerId('');
    setGameMode('');
    setIsHost(false);
    setScreen('home');
  }, [roomCode, playerId]);

  const goToMenu = useCallback(() => {
    setIsPlaying(false);
    setScreen('home');
  }, []);

  const playAgain = useCallback(() => {
    startGame(difficulty);
  }, [difficulty, startGame]);

  // Multiplayer: Create game
  const handleCreateGame = async (
    playerName,
    selectedGameMode,
    selectedDifficulty,
    maxRounds = 10,
    livesPerPlayer = 3,
    pointsPerWord = 50,
    isSpectator = false,
    enableBots = false,
    botCount = 2,
    botDifficulty = 'medium'
  ) => {
    try {
      const { roomCode: newRoomCode, playerId: newPlayerId } = await createGameRoom(
        playerName,
        selectedGameMode,
        selectedDifficulty,
        maxRounds,
        livesPerPlayer,
        pointsPerWord,
        isSpectator,
        enableBots,
        botCount,
        botDifficulty
      );
      
      setRoomCode(newRoomCode);
      setPlayerId(newPlayerId);
      setGameMode(selectedGameMode);
      setIsHost(true);
      setScreen('lobby');
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  };

  // Multiplayer: Join game
  const handleJoinGame = async (code, playerName) => {
    try {
      const { playerId: newPlayerId, gameMode: joinedGameMode } = await joinGameRoom(
        code,
        playerName
      );
      
      setRoomCode(code);
      setPlayerId(newPlayerId);
      setGameMode(joinedGameMode);
      setIsHost(false);
      setScreen('lobby');
    } catch (error) {
      console.error('Failed to join game:', error);
      throw error;
    }
  };

  // Multiplayer: Game started
  const handleGameStart = useCallback(() => {
    sounds.gameStart();
    setScreen('multiplayer-game');
    setIsPlaying(true);
  }, []);

  // Multiplayer: Game ended - go to multiplayer game over screen
  const handleMultiplayerGameEnd = useCallback(async () => {
    setIsPlaying(false);
    setScreen('multiplayerGameOver');
  }, []);



  // Preload dictionary on app initialization
  useEffect(() => {
    preloadDictionary();
  }, []);

  // Note: Room status polling is now handled in LobbyScreen component

  // Timer effect
  useEffect(() => {
    if (!isPlaying || screen !== 'game') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, screen, handleTimeout, timerKey]);

  return (
    <div className="App">
      <div className={`container ${screen === 'lobby' || screen === 'multiplayer-game' ? 'full-width' : ''}`}>
        <main>
          {screen === 'home' && (
            <HomeScreen
              onPlaySolo={() => setScreen('menu')}
              onCreateGame={() => setScreen('create')}
              onJoinGame={() => setScreen('join')}
            />
          )}

          {screen === 'menu' && (
            <MenuScreen onStartGame={startGame} onBack={() => setScreen('home')} />
          )}

          {screen === 'create' && (
            <CreateGameScreen
              onCreateGame={handleCreateGame}
              onBack={() => setScreen('home')}
            />
          )}

          {screen === 'join' && (
            <JoinGameScreen
              onJoinGame={handleJoinGame}
              onBack={() => setScreen('home')}
            />
          )}

          {screen === 'lobby' && (
            <LobbyScreen
              roomCode={roomCode}
              playerId={playerId}
              isHost={isHost}
              gameMode={gameMode}
              onGameStart={handleGameStart}
              onLeave={goToHome}
            />
          )}

          {screen === 'game' && (
            <GameScreen
              score={score}
              round={round}
              lives={lives}
              timeLeft={timeLeft}
              maxTime={maxTime}
              currentCombo={currentCombo}
              usedWords={usedWords}
              onSubmitWord={submitWord}
              isPlaying={isPlaying}
              onExit={goToHome}
            />
          )}

          {screen === 'multiplayer-game' && (
            <MultiplayerGameScreen
              roomCode={roomCode}
              playerId={playerId}
              isHost={isHost}
              onGameEnd={handleMultiplayerGameEnd}
            />
          )}

          {screen === 'gameOver' && (
            <GameOverScreen
              score={score}
              round={round - 1}
              totalWords={usedWords.length}
              onPlayAgain={playAgain}
              onGoToMenu={goToMenu}
            />
          )}

          {screen === 'multiplayerGameOver' && (
            <GameOverScreen
              score={0}
              round={0}
              totalWords={0}
              isMultiplayer={true}
              roomCode={roomCode}
              gameMode={gameMode}
              isHost={isHost}
              onGoToMenu={goToHome}
            />
          )}
        </main>

      </div>
    </div>
  );
}

export default App;
