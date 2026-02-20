import React, { useState, useEffect, useCallback, useRef } from 'react';
import './GameScreen.css';
import { FaRobot, FaCrown, FaHome } from 'react-icons/fa';
import { GiTimeBomb } from 'react-icons/gi';
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
import { sounds } from '../lib/soundService';

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
  const [initialCountdown, setInitialCountdown] = useState(5); // 5 second countdown before Round 1
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef(null);
  const currentRoundRef = useRef(null);
  const wordInputRef = useRef(null);

  const handleRoundEnd = useCallback(async () => {
    sounds.timeout();
    // On the final round, don't show countdown - just end
    if (gameState && roomSettings && gameState.round_number >= roomSettings.max_rounds) {
      if (isHost) {
        await endGame(roomCode);
      }
      return;
    }
    setShowingResults(true);
    setCountdown(5); // 5 second countdown for everyone
  }, [gameState, roomSettings, isHost, roomCode]);

  const handleNextRound = useCallback(async () => {
    setShowingResults(false);

    // Only the host actually advances the round in the database
    if (!isHost || !roomSettings || !gameState) return;

    // Check if game should end
    if (gameState.round_number >= roomSettings.max_rounds) {
      await endGame(roomCode);
      // Let the room status poll handle navigation for all players
      return;
    }

    // Start next round
    const nextCombo = LETTER_COMBOS[Math.floor(Math.random() * LETTER_COMBOS.length)];
    sounds.newRound();
    await startNextRound(roomCode, nextCombo, gameState.round_number + 1);
  }, [isHost, roomSettings, gameState, roomCode]);

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

  // Poll for game/room status changes (game end detection for ALL players)
  useEffect(() => {
    if (!roomCode) return;
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const { data: room } = await supabase
          .from('game_rooms')
          .select('status')
          .eq('room_code', roomCode)
          .single();
        if (room && room.status === 'finished' && active) {
          active = false;
          sounds.gameOver();
          onGameEnd();
        }
      } catch (e) { /* ignore */ }
    };

    const interval = setInterval(poll, 1000);
    return () => { active = false; clearInterval(interval); };
  }, [roomCode, onGameEnd]);

  // Ref to track last applied round (for polling deduplication)
  const lastAppliedRoundRef = useRef(null);

  // Helper to apply a new game state (used by both realtime and polling)
  // Only resets state when the round actually changes — never interrupts an active timer
  const applyGameState = useCallback((newState, { triggerBots = false } = {}) => {
    if (!newState) return;
    const isNewRound = lastAppliedRoundRef.current !== null &&
                       lastAppliedRoundRef.current !== newState.round_number;
    const isFirstLoad = lastAppliedRoundRef.current === null;

    if (isNewRound) {
      lastAppliedRoundRef.current = newState.round_number;
      // Sync timer from server timestamp
      let syncedTime = newState.time_limit || 10;
      if (newState.round_start_time) {
        const elapsed = (Date.now() - new Date(newState.round_start_time).getTime()) / 1000;
        syncedTime = Math.max(0, (newState.time_limit || 10) - elapsed);
      }
      setTimeLeft(syncedTime);
      setHasAnswered(false);
      setRoundAnswers([]);
      setShowingResults(false);
      setCountdown(0);
      if (triggerBots) {
        triggerBotAnswers(newState);
      }
      // Update gameState to trigger timer useEffect with new round number
      setGameState(newState);
    } else if (isFirstLoad) {
      lastAppliedRoundRef.current = newState.round_number;
      // Only set game state on first load — don't touch timer/results state
      setGameState(newState);
    }
    // If same round (poll during active round) — do nothing, don't interrupt timer
  }, [triggerBotAnswers]);

  // Subscribe to game state changes (realtime)
  useEffect(() => {
    if (!roomCode) return;

    const subscription = subscribeToGameState(roomCode, (payload) => {
      if (payload.new) {
        applyGameState(payload.new, { triggerBots: isHost });
      }
    });

    return () => subscription.unsubscribe();
  }, [roomCode, isHost, applyGameState]);

  // Poll game state as fallback (catches missed realtime events for non-host players)
  useEffect(() => {
    if (!roomCode) return;
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const { data: state } = await supabase
          .from('game_state')
          .select('*')
          .eq('room_code', roomCode)
          .single();
        if (state && active) {
          applyGameState(state, { triggerBots: isHost });
        }
      } catch (e) { /* ignore */ }
    };

    const interval = setInterval(poll, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [roomCode, isHost, applyGameState]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!word.trim() || hasAnswered || !gameState) return;

    const trimmedWord = word.trim().toLowerCase();
    
    // Check minimum length (4 letters for multiplayer)
    if (trimmedWord.length < 4) {
      sounds.error();
      setMessage('Word must be at least 4 letters');
      setMessageType('error');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Check if word already used this round
    const usedThisRound = roundAnswers.map(a => a.word.toLowerCase());
    if (usedThisRound.includes(trimmedWord)) {
      sounds.error();
      setMessage('That word was already used this round!');
      setMessageType('error');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    
    // Validate word
    const result = await validateWordComplete(trimmedWord, gameState.current_combo, usedThisRound, true);
    
    if (!result.valid) {
      sounds.error();
      setMessage(result.message);
      setMessageType('error');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    // Calculate points: base points from room settings + length bonus
    const basePoints = roomSettings?.points_per_word || 50;
    const lengthBonus = Math.max(0, (trimmedWord.length - 4) * 5);
    const points = basePoints + lengthBonus;
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

      sounds.success();
      setHasAnswered(true);
      setMessage(`+${points} points! Great word!`);
      setMessageType('success');
      setWord('');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      sounds.error();
      setMessage('Failed to submit answer');
      setMessageType('error');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  // Sound: tick on initial countdown
  useEffect(() => {
    if (!gameStarted && initialCountdown > 0 && initialCountdown <= 3) {
      sounds.countdown();
    }
    if (!gameStarted && initialCountdown === 0) {
      sounds.gameStart();
    }
  }, [initialCountdown, gameStarted]);

  // Sound: urgent tick when time is low
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && timeLeft <= 3 && !showingResults) {
      sounds.tick();
    }
  }, [Math.floor(timeLeft), gameStarted, showingResults]); // eslint-disable-line

  // Sound: countdown between rounds
  useEffect(() => {
    if (showingResults && countdown > 0 && countdown <= 3) {
      sounds.countdown();
    }
  }, [countdown, showingResults]);

  // Auto-focus input when game resumes after results screen
  useEffect(() => {
    if (gameStarted && !showingResults && countdown === 0 && !hasAnswered) {
      const t = setTimeout(() => wordInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [gameStarted, showingResults, countdown, hasAnswered]);

  if (!gameState || !roomSettings || !gameState.round_number) {
    return <div className="game-screen"><div className="loading-screen"><div className="loading-spinner"></div><p>Loading game...</p></div></div>;
  }

  // Show initial countdown before Round 1
  if (!gameStarted && initialCountdown > 0) {
    return (
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'center',minHeight:'60vh',paddingTop:'20px'}}>
        <div className="round-results" style={{minWidth:340,maxWidth:480}}>
          <h2 style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <GiTimeBomb /> Get Ready!
          </h2>
          <div className="countdown-display">
            <p>Game starts in</p>
            <div className={`countdown-number ${initialCountdown <= 3 ? 'urgent' : ''}`}>{initialCountdown}</div>
          </div>
          <div className="current-standings">
            <h3>Players in this room:</h3>
            {players.length === 0 && (
              <div className="standing-item" style={{justifyContent:'center',color:'#6b7280',fontStyle:'italic'}}>
                Loading players...
              </div>
            )}
            {players.map((player, idx) => (
              <div key={player.id} className="standing-item">
                <span className="rank">#{idx + 1}</span>
                <span className="player-name">
                  {player.is_bot && <FaRobot style={{marginRight: 4}} />}{player.player_name}
                  {player.is_host && <FaCrown style={{marginLeft: 4, color: '#f59e0b'}} />}
                </span>
                <span className="ready-badge">Ready!</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // (between-round countdown is now rendered inside the main 3-col layout below)

  const progressPercent = (timeLeft / (gameState.time_limit || 10)) * 100;
  const isUrgent = timeLeft <= 3;
  const currentPlayer = players.find(p => p.id === playerId);
  const currentPlayerName = currentPlayer?.player_name || '';

  // Build scoreboard content (left panel)
  const renderScoreboard = () => {
    if (roomSettings.game_mode.startsWith('team_')) {
      const teams = {};
      players.forEach(player => {
        if (player.team_number) {
          if (!teams[player.team_number]) {
            teams[player.team_number] = { teamNumber: player.team_number, totalScore: 0, members: [] };
          }
          teams[player.team_number].totalScore += player.score || 0;
          teams[player.team_number].members.push(player);
        }
      });
      const teamArray = Object.values(teams).sort((a, b) => b.totalScore - a.totalScore);
      const TEAM_COLORS = ['🔵', '🔴', '🟢', '🟡', '🟣', '🟠'];
      const TEAM_NAMES = ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange'];
      return teamArray.map((team, idx) => (
        <div key={team.teamNumber} className="team-score-section">
          <div className="team-score-header">
            <span className="team-rank">#{idx + 1}</span>
            <span className="team-name">{TEAM_COLORS[team.teamNumber - 1]} Team {TEAM_NAMES[team.teamNumber - 1]}</span>
            <span className="team-total-score">{team.totalScore}</span>
          </div>
          <div className="team-members">
            {team.members.sort((a, b) => b.score - a.score).map(player => {
              const playerAnswered = roundAnswers.some(a => a.player_id === player.id);
              return (
                <div key={player.id} className={`team-member-item ${player.id === playerId ? 'current-player' : ''}`}>
                  <span className="member-name">
                    {player.is_bot && '🤖 '}{player.player_name}
                    {playerAnswered && <span className="answered-badge">✓</span>}
                  </span>
                  <span className="member-score">{player.score}</span>
                </div>
              );
            })}
          </div>
        </div>
      ));
    }
    return players.sort((a, b) => b.score - a.score).map((player, idx) => {
      const playerAnswered = roundAnswers.some(a => a.player_id === player.id);
      return (
        <div key={player.id} className={`player-score-item ${player.id === playerId ? 'current-player' : ''}`}>
          <span className="player-rank">#{idx + 1}</span>
          <span className="player-name">
            {player.is_bot && '🤖 '}{player.player_name}
            {playerAnswered && <span className="answered-badge">✓</span>}
          </span>
          <span className="player-score">{player.score}</span>
        </div>
      );
    });
  };

  return (
    <div className="game-screen-container" style={{flexDirection:'column'}}>
      {/* ── Header Bar ── */}
      <div className="game-header-bar">
        <button className="exit-btn" onClick={onGameEnd}>
          <FaHome /> Exit
        </button>
        <div className="game-header-logo">
          <GiTimeBomb style={{ fontSize: '1.3rem', color: '#a5b4fc' }} />
          <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem', letterSpacing: '0.02em' }}>Word Bomb</span>
        </div>
        <div className="game-header-center">
          <span className="header-round-info">Round {gameState.round_number} / {roomSettings.max_rounds}</span>
          <span className={`header-timer ${isUrgent ? 'urgent' : ''}`}>⏱ {timeLeft.toFixed(1)}s</span>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Room: {roomCode}
        </span>
      </div>

      {/* ── 3-Column Layout ── */}
      <div className="game-3col-layout">

        {/* LEFT: Live Scoreboard */}
        <div className="game-left-panel">
          <p className="panel-title">
            {roomSettings.game_mode.startsWith('team_') ? '🏆 Team Standings' : '🏆 Leaderboard'}
          </p>
          {renderScoreboard()}
        </div>

        {/* CENTER: Game Zone OR Between-Round Countdown */}
        <div className="game-center">
          {showingResults && countdown > 0 ? (
            /* Between-round countdown — stays inside the 3-col layout */
            <div className="game-focus-card" style={{textAlign:'center'}}>
              <h2 style={{margin:'0 0 10px 0',fontSize:'1.2rem',fontWeight:700,color:'#1f2937'}}>
                Round {gameState.round_number} Complete!
              </h2>
              <div className="countdown-display">
                <p>Next round in</p>
                <div className="countdown-number">{countdown}</div>
              </div>
              {roundAnswers.length > 0 && (
                <div className="round-answers" style={{textAlign:'left',marginTop:12}}>
                  <h3>Answers this round:</h3>
                  {roundAnswers.map((answer, idx) => (
                    <div key={idx} className="answer-item">
                      <span className="answer-word">{answer.word}</span>
                      <span className="answer-points">+{answer.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Focus Card: Timer bar + Combo */}
              <div className="game-focus-card">
                <div className={`timer-container ${isUrgent ? 'urgent' : ''}`}>
                  <div className="timer-bar" style={{ width: `${progressPercent}%` }}></div>
                  <span className="timer-text">{timeLeft.toFixed(1)}s</span>
                </div>
                <div className="combo-display">
                  <div className="combo-label">Find a word containing:</div>
                  <div className="combo-letters">{gameState.current_combo}</div>
                </div>
              </div>

              {/* Word Input */}
              <div className="game-input-zone">
                <form onSubmit={handleSubmit} className="word-input-form">
                  <input
                    ref={wordInputRef}
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Type your word..."
                    className="word-input"
                    autoFocus
                    disabled={hasAnswered}
                  />
                  <button type="submit" className="submit-btn" disabled={hasAnswered || !word.trim()}>
                    {hasAnswered ? '✓ Answered' : 'Submit'}
                  </button>
                </form>
              </div>

              {/* Feedback */}
              {message && (
                <div className="game-feedback-zone">
                  <div className={`message ${messageType}`}>{message}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Chat + Admin */}
        <div className="game-right-panel">
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
            <Chat roomCode={roomCode} playerId={playerId} playerName={currentPlayerName} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default MultiplayerGameScreen;
