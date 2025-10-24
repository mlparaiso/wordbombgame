import React, { useState, useEffect, useCallback } from 'react';
import './LobbyScreen.css';
import { getPlayers, subscribeToPlayers, assignTeams, startGame } from '../lib/gameService';

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

function LobbyScreen({ roomCode, playerId, isHost, gameMode, onGameStart, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPlayers = useCallback(async () => {
    try {
      const playerList = await getPlayers(roomCode);
      setPlayers(playerList);
    } catch (err) {
      console.error('Failed to load players:', err);
    }
  }, [roomCode]);

  useEffect(() => {
    loadPlayers();

    const subscription = subscribeToPlayers(roomCode, () => {
      loadPlayers();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [roomCode, loadPlayers]);

  const handleAssignTeams = async () => {
    setLoading(true);
    setError('');
    try {
      const teamSize = parseInt(gameMode.split('_')[1]);
      await assignTeams(roomCode, teamSize, true);
      await loadPlayers();
    } catch (err) {
      setError('Failed to assign teams');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
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

  // Group players by team
  const teams = {};
  if (isTeamMode) {
    players.forEach(player => {
      const teamNum = player.team_number || 0;
      if (!teams[teamNum]) teams[teamNum] = [];
      teams[teamNum].push(player);
    });
  }

  return (
    <div className="lobby-screen">
      <button className="leave-btn" onClick={handleLeave}>
        ← Leave
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
          <div className="teams-container">
            {Object.keys(teams).length === 0 ? (
              <div className="no-teams">
                <p>Teams not assigned yet</p>
                {isHost && (
                  <button 
                    className="assign-teams-btn" 
                    onClick={handleAssignTeams}
                    disabled={loading || players.length < teamSize * 2}
                  >
                    {loading ? 'Assigning...' : 'Assign Teams Randomly'}
                  </button>
                )}
                {players.length < teamSize * 2 && (
                  <p className="team-warning">
                    Need at least {teamSize * 2} players for {teamSize}v{teamSize}
                  </p>
                )}
              </div>
            ) : (
              Object.entries(teams).map(([teamNum, teamPlayers]) => (
                <div key={teamNum} className={`team-card team-${teamNum}`}>
                  <h3>Team {teamNum}</h3>
                  <div className="team-players">
                    {teamPlayers.map(player => (
                      <div key={player.id} className="team-player">
                        {player.player_name}
                        {player.is_host && ' 👑'}
                      </div>
                    ))}
                  </div>
                </div>
              ))
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
  );
}

export default LobbyScreen;
