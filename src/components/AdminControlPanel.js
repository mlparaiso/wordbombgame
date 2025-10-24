import React, { useState } from 'react';
import './AdminControlPanel.css';
import { pauseGame, resumeGame, kickPlayer, endGame, sendChatMessage } from '../lib/gameService';

function AdminControlPanel({ 
  roomCode, 
  players, 
  isPaused, 
  currentRound,
  onSkipRound,
  onEndGame 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const handlePauseResume = async () => {
    if (actionInProgress) return;
    
    setActionInProgress(true);
    try {
      if (isPaused) {
        await resumeGame(roomCode);
        await sendChatMessage(roomCode, null, 'System', '▶️ Game resumed by host', true);
      } else {
        await pauseGame(roomCode, 0);
        await sendChatMessage(roomCode, null, 'System', '⏸️ Game paused by host', true);
      }
    } catch (error) {
      console.error('Failed to pause/resume:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSkipRound = async () => {
    if (actionInProgress) return;
    
    const confirmed = window.confirm('Skip to next round?');
    if (!confirmed) return;

    setActionInProgress(true);
    try {
      if (onSkipRound) {
        await onSkipRound();
      }
      await sendChatMessage(roomCode, null, 'System', `⏭️ Round ${currentRound} skipped by host`, true);
    } catch (error) {
      console.error('Failed to skip round:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleKickPlayer = async (playerId, playerName) => {
    if (actionInProgress) return;
    
    const confirmed = window.confirm(`Kick ${playerName} from the game?`);
    if (!confirmed) return;

    setActionInProgress(true);
    try {
      await kickPlayer(playerId);
      await sendChatMessage(roomCode, null, 'System', `🚫 ${playerName} was removed from the game`, true);
    } catch (error) {
      console.error('Failed to kick player:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleEndGame = async () => {
    if (actionInProgress) return;
    
    const confirmed = window.confirm('End the game now? This cannot be undone.');
    if (!confirmed) return;

    setActionInProgress(true);
    try {
      await endGame(roomCode);
      await sendChatMessage(roomCode, null, 'System', '🏁 Game ended by host', true);
      if (onEndGame) {
        onEndGame();
      }
    } catch (error) {
      console.error('Failed to end game:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="admin-panel">
      <button 
        className="admin-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="admin-icon">⚙️</span>
        <span>Admin Controls</span>
        <span className="toggle-arrow">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="admin-content">
          <div className="admin-section">
            <h4>Game Controls</h4>
            <div className="admin-buttons">
              <button 
                className="admin-btn pause"
                onClick={handlePauseResume}
                disabled={actionInProgress}
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>

              <button 
                className="admin-btn skip"
                onClick={handleSkipRound}
                disabled={actionInProgress}
              >
                ⏭️ Skip Round
              </button>

              <button 
                className="admin-btn end"
                onClick={handleEndGame}
                disabled={actionInProgress}
              >
                🏁 End Game
              </button>
            </div>
          </div>

          <div className="admin-section">
            <h4>Player Management</h4>
            <div className="player-list">
              {players && players.length > 0 ? (
                players
                  .filter(p => !p.is_host && !p.is_spectator)
                  .map(player => (
                    <div key={player.id} className="player-item">
                      <span className="player-name">{player.player_name}</span>
                      <button
                        className="kick-btn"
                        onClick={() => handleKickPlayer(player.id, player.player_name)}
                        disabled={actionInProgress}
                      >
                        🚫 Kick
                      </button>
                    </div>
                  ))
              ) : (
                <p className="no-players">No players to manage</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminControlPanel;
