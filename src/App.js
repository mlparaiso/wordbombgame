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

  // Multiplayer state
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [isHost, setIsHost] = useState(false);

  const getRandomCombo = useCallback(() => {
    return letterCombos[Math.floor(Math.random() * letterCombos.length)];
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

    setDifficulty(selectedDifficulty);
    setScore(0);
    setRound(1);
    setLives(3);
    setUsedWords([]);
    setMaxTime(time);
    setTimeLeft(time);
    setCurrentCombo(getRandomCombo());
    setIsPlaying(true);
    setScreen('game');
  }, [getRandomCombo]);

  const startNewRound = useCallback(() => {
    setCurrentCombo(getRandomCombo());
    setTimeLeft(maxTime);
  }, [getRandomCombo, maxTime]);

  const handleTimeout = useCallback(() => {
    const newLives = lives - 1;
    setLives(newLives);
    sounds.timeout();
    
    if (newLives <= 0) {
      setIsPlaying(false);
      sounds.gameOver();
      setScreen('gameOver');
    } else {
      setTimeout(() => {
        startNewRound();
      }, 1500);
    }
  }, [lives, startNewRound]);

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
    setRound(prev => prev + 1);

    setTimeout(() => {
      startNewRound();
    }, 1000);

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
  const handleGameStart = () => {
    sounds.gameStart();
    setScreen('multiplayer-game');
    setIsPlaying(true);
  };

  // Multiplayer: Game ended - go to multiplayer game over screen
  const handleMultiplayerGameEnd = useCallback(async () => {
    setIsPlaying(false);
    setScreen('multiplayerGameOver');
  }, []);

  // Multiplayer: Play again in same room (reset room to waiting, go to lobby)
  const handlePlayAgainSameRoom = useCallback(async () => {
    try {
      const { supabase } = await import('./lib/supabase');
      // Reset room status to 'waiting' so all players can see the lobby again
      await supabase
        .from('game_rooms')
        .update({ status: 'waiting' })
        .eq('room_code', roomCode);
      // Reset player scores to 0
      await supabase
        .from('players')
        .update({ score: 0 })
        .eq('room_code', roomCode);
    } catch (error) {
      console.error('Error resetting room:', error);
    }
    setIsPlaying(false);
    setScreen('lobby');
  }, [roomCode]);

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
  }, [isPlaying, screen, handleTimeout]);

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
              onPlayAgain={handlePlayAgainSameRoom}
              onGoToMenu={goToHome}
            />
          )}
        </main>

      </div>
    </div>
  );
}

export default App;
