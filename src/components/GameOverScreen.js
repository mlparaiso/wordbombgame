import React, { useState, useEffect, useCallback } from 'react';
import './GameOverScreen.css';
import { getTeamScores, getLeaderboard } from '../lib/gameService';
import { sounds } from '../lib/soundService';
import { FaTrophy, FaHome, FaRedo, FaStar, FaMedal } from 'react-icons/fa';
import { GiTimeBomb } from 'react-icons/gi';

const TEAM_COLORS = ['🔵', '🔴', '🟢', '🟡', '🟣', '🟠'];
const TEAM_NAMES = ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange'];

// Trophy icons and colors for ranks
const RANK_CONFIG = [
  { icon: '🥇', label: '1st', color: '#FFD700', bg: 'linear-gradient(135deg, #FFF9E6 0%, #FFF0B3 100%)', border: '#FFD700', shadow: 'rgba(255,215,0,0.3)' },
  { icon: '🥈', label: '2nd', color: '#C0C0C0', bg: 'linear-gradient(135deg, #F8F8F8 0%, #E8E8E8 100%)', border: '#C0C0C0', shadow: 'rgba(192,192,192,0.3)' },
  { icon: '🥉', label: '3rd', color: '#CD7F32', bg: 'linear-gradient(135deg, #FFF4EE 0%, #FFE0C8 100%)', border: '#CD7F32', shadow: 'rgba(205,127,50,0.3)' },
];

function getRankConfig(index) {
  return RANK_CONFIG[index] || { icon: `#${index + 1}`, label: `#${index + 1}`, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', shadow: 'rgba(0,0,0,0.05)' };
}

function GameOverScreen({ 
  score, 
  round, 
  totalWords, 
  onPlayAgain, 
  onGoToMenu,
  // Multiplayer props
  isMultiplayer = false,
  roomCode = null,
  gameMode = null,
  isHost = false
}) {
  const [teamScores, setTeamScores] = useState([]);
  const [playerScores, setPlayerScores] = useState([]);
  const [loading, setLoading] = useState(false);

  const isTeamMode = gameMode && gameMode.startsWith('team_');

  const loadScores = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeamMode) {
        const teams = await getTeamScores(roomCode);
        setTeamScores(teams);
      } else {
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

  // Non-host: poll for room reset (host clicked "Play Again")
  useEffect(() => {
    if (!isMultiplayer || !roomCode || isHost || !onPlayAgain) return;
    let active = true;
    const check = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: room } = await supabase
          .from('game_rooms')
          .select('status')
          .eq('room_code', roomCode)
          .single();
        if (room && room.status === 'waiting' && active) {
          active = false;
          onPlayAgain(); // navigate non-host back to lobby
        }
      } catch (e) { /* ignore */ }
    };
    const interval = setInterval(check, 1500);
    return () => { active = false; clearInterval(interval); };
  }, [isMultiplayer, roomCode, isHost, onPlayAgain]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMultiplayer) {
        sounds.win?.();
      } else {
        sounds.gameOver();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line

  // ── Single-player ──────────────────────────────────────────
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

  // ── Multiplayer ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mp-gameover-screen">
        <div className="mp-gameover-card">
          <div className="mp-loading">
            <div className="mp-loading-spinner"></div>
            <p>Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  // Team mode
  if (isTeamMode) {
    const winningTeam = teamScores[0];
    return (
      <div className="mp-gameover-screen">
        <div className="mp-gameover-card">
          <div className="mp-trophy-banner">🏆</div>
          <h2 className="mp-gameover-title">Game Over!</h2>
          {winningTeam && (
            <div className="mp-winner-box">
              <div className="mp-winner-medal">🥇</div>
              <div className="mp-winner-name">
                {TEAM_COLORS[winningTeam.teamNumber - 1]} Team {TEAM_NAMES[winningTeam.teamNumber - 1]} Wins!
              </div>
              <div className="mp-winner-score">{winningTeam.totalScore} points</div>
            </div>
          )}
          <div className="mp-rankings-section">
            <h3 className="mp-rankings-title"><FaTrophy style={{marginRight:6,color:'#f59e0b'}} /> Final Rankings</h3>
            {teamScores.map((team, index) => {
              const rank = getRankConfig(index);
              return (
                <div key={team.teamNumber} className="mp-rank-row" style={{borderColor: rank.border, background: rank.bg, boxShadow: `0 4px 12px ${rank.shadow}`}}>
                  <div className="mp-rank-medal">{rank.icon}</div>
                  <div className="mp-rank-info">
                    <div className="mp-rank-name" style={{color: rank.color}}>
                      {TEAM_COLORS[team.teamNumber - 1]} Team {TEAM_NAMES[team.teamNumber - 1]}
                    </div>
                    <div className="mp-rank-members">{team.members.join(', ')}</div>
                  </div>
                  <div className="mp-rank-score" style={{color: rank.color}}>{team.totalScore} pts</div>
                </div>
              );
            })}
          </div>
          {roomCode && (
            <div className="mp-room-code-badge">Room: {roomCode}</div>
          )}
          <div className="mp-action-buttons">
            {onPlayAgain && (
              <button className="mp-btn mp-btn-primary" onClick={onPlayAgain}>
                <FaRedo style={{marginRight:8}} /> Play Again (Same Room)
              </button>
            )}
            <button className="mp-btn mp-btn-secondary" onClick={onGoToMenu}>
              <FaHome style={{marginRight:8}} /> Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VS All mode
  const winner = playerScores[0];
  return (
    <div className="mp-gameover-screen">
      <div className="mp-gameover-card">
        <div className="mp-trophy-banner">🏆</div>
        <h2 className="mp-gameover-title">Game Over!</h2>

        {winner && (
          <div className="mp-winner-box">
            <div className="mp-winner-medal">🥇</div>
            <div className="mp-winner-name">{winner.player_name} Wins!</div>
            <div className="mp-winner-score">{winner.score} points</div>
          </div>
        )}

        <div className="mp-rankings-section">
          <h3 className="mp-rankings-title"><FaTrophy style={{marginRight:6,color:'#f59e0b'}} /> Final Rankings</h3>
          {playerScores.map((player, index) => {
            const rank = getRankConfig(index);
            return (
              <div key={player.id} className="mp-rank-row" style={{borderColor: rank.border, background: rank.bg, boxShadow: `0 4px 12px ${rank.shadow}`}}>
                <div className="mp-rank-medal">{rank.icon}</div>
                <div className="mp-rank-info">
                  <div className="mp-rank-name" style={{color: index < 3 ? rank.color : '#374151'}}>
                    {player.player_name}
                  </div>
                </div>
                <div className="mp-rank-score" style={{color: index < 3 ? rank.color : '#374151'}}>{player.score} pts</div>
              </div>
            );
          })}
        </div>

        {roomCode && (
          <div className="mp-room-code-badge">Room: {roomCode}</div>
        )}

        <div className="mp-action-buttons">
          {onPlayAgain && (
            <button className="mp-btn mp-btn-primary" onClick={onPlayAgain}>
              <FaRedo style={{marginRight:8}} /> Play Again (Same Room)
            </button>
          )}
          <button className="mp-btn mp-btn-secondary" onClick={onGoToMenu}>
            <FaHome style={{marginRight:8}} /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverScreen;
