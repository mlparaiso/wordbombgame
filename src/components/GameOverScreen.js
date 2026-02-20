import React, { useState, useEffect, useCallback } from 'react';
import './GameOverScreen.css';
import { getTeamScores, getLeaderboard } from '../lib/gameService';
import { sounds } from '../lib/soundService';
import { FaTrophy, FaHome, FaRedo, FaStar, FaMedal } from 'react-icons/fa';
import { GiTimeBomb } from 'react-icons/gi';

const TEAM_COLORS = ['🔵', '🔴', '🟢', '🟡', '🟣', '🟠'];
const TEAM_NAMES = ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange'];

function GameOverScreen({ 
  score, 
  round, 
  totalWords, 
  onPlayAgain, 
  onGoToMenu,
  // Multiplayer props
  isMultiplayer = false,
  roomCode = null,
  gameMode = null
}) {
  const [teamScores, setTeamScores] = useState([]);
  const [playerScores, setPlayerScores] = useState([]);
  const [loading, setLoading] = useState(false);

  const isTeamMode = gameMode && gameMode.startsWith('team_');

  const loadScores = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeamMode) {
        // Load team scores
        const teams = await getTeamScores(roomCode);
        setTeamScores(teams);
      } else {
        // Load individual player scores for VS All mode
        const players = await getLeaderboard(roomCode);
        setPlayerScores(players);
      }
    } catch (error) {
      console.error('Failed to load scores:', error);
    } finally {
      setLoading(false);
    }
  }, [isTeamMode, roomCode]);

  useEffect(() => {
    if (isMultiplayer && roomCode) {
      loadScores();
    }
  }, [isMultiplayer, roomCode, loadScores]);

  // Play appropriate sound on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMultiplayer) {
        sounds.win();
      } else {
        sounds.gameOver();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line

  // Single-player mode
  if (!isMultiplayer) {
    return (
      <div className="game-over-screen">
        <div className="game-over-content">
          <div className="game-over-icon solo"><GiTimeBomb /></div>
          <h2>Game Over!</h2>
          <div className="final-stats">
            <div className="stat-row">
              <span className="stat-row-label"><FaStar className="stat-row-icon gold" /> Final Score</span>
              <span className="stat-row-value">{score}</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label"><GiTimeBomb className="stat-row-icon purple" /> Rounds</span>
              <span className="stat-row-value">{round}</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label"><FaMedal className="stat-row-icon bronze" /> Words Found</span>
              <span className="stat-row-value">{totalWords}</span>
            </div>
          </div>
          <button className="difficulty-btn" onClick={onPlayAgain}>
            <FaRedo style={{marginRight: 8}} /> Play Again
          </button>
          <button className="difficulty-btn secondary" onClick={onGoToMenu}>
            <FaHome style={{marginRight: 8}} /> Main Menu
          </button>
        </div>
      </div>
    );
  }

  // Multiplayer - Team Mode
  if (isTeamMode) {
    const winningTeam = teamScores[0];
    
    return (
      <div className="game-over-screen">
        <div className="game-over-content multiplayer">
          <div className="game-over-icon"><FaTrophy /></div>
          <h2>Game Over!</h2>
          
          {loading ? (
            <div className="loading">Loading results...</div>
          ) : (
            <>
              {winningTeam && (
                <div className="winner-announcement">
                  <div className="winner-icon">{TEAM_COLORS[winningTeam.teamNumber - 1]}</div>
                  <h3>Team {TEAM_NAMES[winningTeam.teamNumber - 1]} Wins!</h3>
                  <p className="winner-score">{winningTeam.totalScore} points</p>
                </div>
              )}

              <div className="team-rankings">
                <h4><FaMedal style={{marginRight: 6, color: '#f59e0b'}} /> Final Team Rankings</h4>
                {teamScores.map((team, index) => (
                  <div 
                    key={team.teamNumber} 
                    className={`team-rank-item ${index === 0 ? 'winner' : ''}`}
                  >
                    <div className="rank-position">
                      {index === 0 ? <FaTrophy style={{color: '#f59e0b'}} /> : `#${index + 1}`}
                    </div>
                    <div className="team-info">
                      <div className="team-header-rank">
                        <span className="team-icon-rank">{TEAM_COLORS[team.teamNumber - 1]}</span>
                        <span className="team-name-rank">Team {TEAM_NAMES[team.teamNumber - 1]}</span>
                      </div>
                      <div className="team-members-rank">
                        {team.members.join(', ')}
                      </div>
                    </div>
                    <div className="team-score-rank">{team.totalScore} pts</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <button className="difficulty-btn" onClick={onGoToMenu}>
            <FaHome style={{marginRight: 8}} /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Multiplayer - VS All Mode
  const winner = playerScores[0];
  
  return (
    <div className="game-over-screen">
      <div className="game-over-content multiplayer">
        <div className="game-over-icon"><FaTrophy /></div>
        <h2>Game Over!</h2>
        
        {loading ? (
          <div className="loading">Loading results...</div>
        ) : (
          <>
            {winner && (
              <div className="winner-announcement">
                <h3>{winner.player_name} Wins!</h3>
                <p className="winner-score">{winner.score} points</p>
              </div>
            )}

            <div className="player-rankings">
              <h4><FaMedal style={{marginRight: 6, color: '#f59e0b'}} /> Final Rankings</h4>
              {playerScores.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`player-rank-item ${index === 0 ? 'winner' : ''}`}
                >
                  <div className="rank-position">
                    {index === 0 ? <FaTrophy style={{color: '#f59e0b'}} /> : `#${index + 1}`}
                  </div>
                  <div className="player-name-rank">{player.player_name}</div>
                  <div className="player-score-rank">{player.score} pts</div>
                </div>
              ))}
            </div>
          </>
        )}

        <button className="difficulty-btn" onClick={onGoToMenu}>
          <FaHome style={{marginRight: 8}} /> Back to Home
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;
