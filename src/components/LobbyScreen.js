import React, { useState, useEffect, useCallback } from 'react';
import './LobbyScreen.css';
import { getPlayers, checkRoomStatus, selectTeam, leaveTeam, startGame, sendChatMessage } from '../lib/gameService';
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

const TEAM_COLORS = ['🔵', '🔴', '🟢', '🟡', '🟣', '🟠'];
const TEAM_NAMES = ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange'];

function LobbyScreen({ roomCode, playerId, isHost, gameMode, onGameStart, onLeave }) {
  console.log('LobbyScreen rendered with roomCode:', roomCode);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPlayerName, setCurrentPlayerName] = useState('');

  const loadPlayers = useCallback(async () => {
    try {
      const playerList = await getPlayers(roomCode);
      setPlayers(playerList);
    } catch (err) {
      console.error('Failed to load players:', err);
    }
  }, [roomCode]);

  // Poll for player updates instead of using broken realtime subscription
  useEffect(() => {
    if (!roomCode) return;

    // Load players immediately
    loadPlayers();

    // Then poll every 2 seconds
    const intervalId = setInterval(loadPlayers, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [roomCode, loadPlayers]);

  // Poll room status so joiners transition when host starts
  useEffect(() => {
    if (!roomCode) return;

    console.log('LobbyScreen: Starting polling for room status:', roomCode);
    let isActive = true;

    const pollRoomStatus = async () => {
      if (!isActive) return;
      
      try {
        const roomData = await checkRoomStatus(roomCode);
        console.log('LobbyScreen: Polled room status:', roomData);
        
        if (roomData && roomData.status === 'playing') {
          console.log('LobbyScreen: Room status is playing, calling onGameStart()');
          isActive = false; // Stop polling
          onGameStart();
        }
      } catch (error) {
        console.error('Error polling room status:', error);
      }
    };

    // Poll immediately
    pollRoomStatus();

    // Then poll every 2 seconds
    const intervalId = setInterval(pollRoomStatus, 2000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
      console.log('LobbyScreen: Stopped polling for room status');
    };
  }, [roomCode, onGameStart]);

  // Get current player's name
  useEffect(() => {
    const currentPlayer = players.find(p => p.id === playerId);
    if (currentPlayer) {
      setCurrentPlayerName(currentPlayer.player_name);
    }
  }, [players, playerId]);

  const handleJoinTeam = async (teamNumber) => {
    setLoading(true);
    setError('');
    try {
      await selectTeam(playerId, teamNumber, roomCode);
      await loadPlayers();
      // Send system message
      await sendChatMessage(
        roomCode, 
        null, 
        'System', 
        `${currentPlayerName} joined Team ${TEAM_NAMES[teamNumber - 1]}`, 
        true
      );
    } catch (err) {
      setError(err.message || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    setLoading(true);
    setError('');
    try {
      await leaveTeam(playerId, roomCode);
      await loadPlayers();
    } catch (err) {
      setError(err.message || 'Failed to leave team');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    // Check if all players are assigned to teams
    const unassignedPlayers = players.filter(p => !p.team_number);
    if (unassignedPlayers.length > 0 && isTeamMode) {
      setError(`${unassignedPlayers.length} player(s) still in waiting area`);
      return;
    }

    if (players.length < 2) {
      setError('Need at least 2 players to start');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const firstCombo = LETTER_COMBOS[Math.floor(Math.random() * LETTER_COMBOS.length)];
      await startGame(roomCode, firstCombo);
      onGameStart();
    } catch (err) {
      setError('Failed to start game');
      setLoading(false);
    }
  };

  const handleLeave = () => {
    if (isHost) {
      const confirmed = window.confirm(
        'You are the host. Leaving will end the game for all players. Are you sure?'
      );
      if (confirmed) {
        onLeave();
      }
    } else {
      const confirmed = window.confirm('Are you sure you want to leave the lobby?');
      if (confirmed) {
        onLeave();
      }
    }
  };

  const isTeamMode = gameMode.startsWith('team_');
  const teamSize = isTeamMode ? parseInt(gameMode.split('_')[1]) : 0;

  // Calculate number of teams dynamically
  const totalPlayers = players.length;
  const maxPossibleTeams = Math.floor(totalPlayers / teamSize);
  const numberOfTeams = isTeamMode ? Math.max(2, maxPossibleTeams) : 0;

  // Group players by team
  const teams = {};
  const waitingPlayers = [];
  
  if (isTeamMode) {
    // Initialize teams
    for (let i = 1; i <= numberOfTeams; i++) {
      teams[i] = [];
    }
    
    // Assign players to teams or waiting area
    players.forEach(player => {
      if (player.team_number && player.team_number <= numberOfTeams) {
        teams[player.team_number].push(player);
      } else {
        waitingPlayers.push(player);
      }
    });
  }

  // Find current player's team
  const currentPlayer = players.find(p => p.id === playerId);
  const currentTeam = currentPlayer?.team_number;

  return (
    <div className="lobby-screen">
      <div className="lobby-main">
        <button className="home-btn" onClick={handleLeave} title="Go Home">
          🏠
        </button>

        <div className="lobby-header">
        <h2>🎮 Game Lobby</h2>
        <div className="room-code-display">
          <span className="code-label">Room Code:</span>
          <span className="code-value">{roomCode}</span>
        </div>
        <p className="player-count">{players.length} player{players.length !== 1 ? 's' : ''} joined</p>
      </div>

      <div className="lobby-content">
        {!isTeamMode ? (
          <div className="players-list">
            {players.map((player, index) => (
              <div key={player.id} className={`player-card ${player.is_host ? 'host' : ''}`}>
                <span className="player-rank">#{index + 1}</span>
                <span className="player-name">{player.player_name}</span>
                {player.is_host && <span className="host-badge">👑 Host</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="team-selection-container">
            <h3 className="team-selection-title">Choose Your Team</h3>
            
            <div className="teams-grid">
              {Object.entries(teams).map(([teamNum, teamPlayers]) => {
                const teamNumber = parseInt(teamNum);
                const isFull = teamPlayers.length >= teamSize;
                const isCurrentTeam = currentTeam === teamNumber;
                
                return (
                  <div 
                    key={teamNum} 
                    className={`team-card ${isCurrentTeam ? 'current-team' : ''} ${isFull ? 'team-full' : ''}`}
                  >
                    <div className="team-header">
                      <span className="team-icon">{TEAM_COLORS[teamNumber - 1]}</span>
                      <h4>Team {TEAM_NAMES[teamNumber - 1]}</h4>
                      <span className="team-count">{teamPlayers.length}/{teamSize}</span>
                    </div>
                    
                    <div className="team-players-list">
                      {teamPlayers.map(player => (
                        <div key={player.id} className="team-player-item">
                          <span>{player.player_name}</span>
                          {player.is_host && <span className="mini-crown">👑</span>}
                        </div>
                      ))}
                      {[...Array(teamSize - teamPlayers.length)].map((_, i) => (
                        <div key={`empty-${i}`} className="team-player-item empty-slot">
                          <span>Empty Slot</span>
                        </div>
                      ))}
                    </div>
                    
                    {isCurrentTeam ? (
                      <button 
                        className="leave-team-btn"
                        onClick={handleLeaveTeam}
                        disabled={loading}
                      >
                        Leave Team
                      </button>
                    ) : (
                      <button 
                        className="join-team-btn"
                        onClick={() => handleJoinTeam(teamNumber)}
                        disabled={loading || isFull}
                      >
                        {isFull ? 'FULL' : 'Join Team'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {waitingPlayers.length > 0 && (
              <div className="waiting-area">
                <div className="waiting-header">
                  <span className="waiting-icon">⏳</span>
                  <h4>Waiting Area</h4>
                  <span className="waiting-count">{waitingPlayers.length} player{waitingPlayers.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="waiting-players-list">
                  {waitingPlayers.map(player => (
                    <div key={player.id} className="waiting-player-item">
                      <span>{player.player_name}</span>
                      {player.is_host && <span className="mini-crown">👑</span>}
                    </div>
                  ))}
                </div>
                <p className="waiting-hint">💡 Click a team above to join!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

        <div className="lobby-footer">
          {isHost ? (
            <button 
              className="start-game-btn" 
              onClick={handleStartGame}
              disabled={loading || players.length < 2}
            >
              {loading ? 'Starting...' : 'Start Game'}
            </button>
          ) : (
            <div className="waiting-message">
              <div className="waiting-spinner"></div>
              <p>Waiting for host to start the game...</p>
            </div>
          )}
        </div>
      </div>

      <div className="lobby-sidebar">
        {isHost && (
          <AdminControlPanel
            roomCode={roomCode}
            players={players}
            isPaused={false}
            currentRound={0}
            onEndGame={onLeave}
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

export default LobbyScreen;
