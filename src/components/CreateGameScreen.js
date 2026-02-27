import React, { useState } from 'react';
import './CreateGameScreen.css';
import { FaHome, FaFistRaised, FaUsers, FaRobot, FaHeart, FaStar, FaChevronDown, FaChevronRight, FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import { GiTimeBomb } from 'react-icons/gi';

const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Gold', 'Silver', 'White', 'Black', 'Crimson', 'Violet', 'Teal', 'Coral', 'Amber', 'Jade', 'Ivory', 'Scarlet', 'Indigo'];
const FRUITS = ['Lemon', 'Mango', 'Kiwi', 'Peach', 'Cherry', 'Melon', 'Grape', 'Papaya', 'Guava', 'Lychee', 'Banana', 'Coconut', 'Pineapple', 'Strawberry', 'Blueberry', 'Watermelon', 'Avocado', 'Dragonfruit', 'Passion', 'Jackfruit'];
const randomFunnyName = () => {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  return `${color}${fruit}`;
};

function CreateGameScreen({ onCreateGame, onBack }) {
  const [playerName, setPlayerName] = useState(() => randomFunnyName());
  const [gameMode, setGameMode] = useState('vs_all');
  const [difficulty, setDifficulty] = useState('medium');
  const [maxRounds, setMaxRounds] = useState(10);
  const [livesPerPlayer, setLivesPerPlayer] = useState(3);
  const [pointsPerWord, setPointsPerWord] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [enableBots, setEnableBots] = useState(false);
  const [botCount, setBotCount] = useState(2);
  const [botDifficulty, setBotDifficulty] = useState('medium');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreateGame(
        playerName.trim(),
        gameMode,
        difficulty,
        maxRounds,
        livesPerPlayer,
        pointsPerWord,
        isSpectator,
        enableBots,
        botCount,
        botDifficulty
      );
    } catch (err) {
      setError(err.message || 'Failed to create game');
      setLoading(false);
    }
  };

  const gameModes = [
    { id: 'vs_all', icon: <FaFistRaised />, name: 'VS All', desc: 'Free-for-all' },
    { id: 'team_2', icon: <FaUsers />, name: 'Team 2v2', desc: '2 players/team' },
    { id: 'team_3', icon: <FaUsers />, name: 'Team 3v3', desc: '3 players/team' },
    { id: 'team_4', icon: <FaUsers />, name: 'Team 4v4', desc: '4 players/team' },
  ];

  const difficulties = [
    { id: 'easy', label: 'Easy', time: '15s', color: 'easy' },
    { id: 'medium', label: 'Medium', time: '10s', color: 'medium' },
    { id: 'hard', label: 'Hard', time: '7s', color: 'hard' },
  ];

  const roundOptions = [
    { value: 5, label: 'Quick', sub: '5 rounds' },
    { value: 10, label: 'Standard', sub: '10 rounds' },
    { value: 15, label: 'Long', sub: '15 rounds' },
    { value: 20, label: 'Marathon', sub: '20 rounds' },
  ];

  return (
    <div className="create-game-screen">
      <button className="back-home-btn" onClick={onBack}>
        <FaHome /> Home
      </button>

      <div className="create-game-content">
        <div className="create-game-header">
          <div className="create-game-icon"><GiTimeBomb /></div>
          <h2>Create Game</h2>
          <p className="subtitle">Set up your multiplayer room</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Player Name */}
          <div className="form-section">
            <label className="form-label">Your Name</label>
            <input
              type="text"
              className="form-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              autoFocus
            />
          </div>


          {/* Game Mode */}
          <div className="form-section">
            <label className="form-label">Game Mode</label>
            <div className="mode-grid">
              {gameModes.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={`mode-card ${gameMode === m.id ? 'active' : ''}`}
                  onClick={() => setGameMode(m.id)}
                >
                  <span className="mode-card-icon">{m.icon}</span>
                  <span className="mode-card-name">{m.name}</span>
                  <span className="mode-card-desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="form-section">
            <label className="form-label">Difficulty</label>
            <div className="diff-row">
              {difficulties.map(d => (
                <button
                  key={d.id}
                  type="button"
                  className={`diff-pill ${d.color} ${difficulty === d.id ? 'active' : ''}`}
                  onClick={() => setDifficulty(d.id)}
                >
                  {d.label} <span className="diff-time">({d.time})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rounds */}
          <div className="form-section">
            <label className="form-label">Number of Rounds</label>
            <div className="rounds-grid">
              {roundOptions.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`round-card ${maxRounds === r.value ? 'active' : ''}`}
                  onClick={() => setMaxRounds(r.value)}
                >
                  <span className="round-label">{r.label}</span>
                  <span className="round-sub">{r.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bots + Spectator Toggles side by side */}
          <div className="toggles-row">
            <label className="toggle-label" onClick={() => setEnableBots(!enableBots)}>
              <span className="toggle-icon">
                {enableBots ? <FaCheckCircle className="check-on" /> : <FaRegCircle className="check-off" />}
              </span>
              <span className="toggle-text">
                <span className="toggle-title"><FaRobot style={{marginRight: 4}} />Fill with Bots</span>
                <span className="toggle-desc">AI players join room</span>
              </span>
            </label>
            <label className="toggle-label" onClick={() => setIsSpectator(!isSpectator)}>
              <span className="toggle-icon">
                {isSpectator ? <FaCheckCircle className="check-on" /> : <FaRegCircle className="check-off" />}
              </span>
              <span className="toggle-text">
                <span className="toggle-title">Join as Spectator</span>
                <span className="toggle-desc">Watch only, don't play</span>
              </span>
            </label>
          </div>

          {enableBots && (
            <div className="bot-settings-panel">
              <div className="form-section">
                <label className="form-label">Number of Bots: <span className="value-badge">{botCount}</span></label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={botCount}
                  onChange={(e) => setBotCount(parseInt(e.target.value))}
                  className="styled-slider"
                />
                <div className="slider-labels">
                  {[1,2,3,4,5,6,7].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Bot Difficulty</label>
                <div className="diff-row">
                  {difficulties.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      className={`diff-pill ${d.color} ${botDifficulty === d.id ? 'active' : ''}`}
                      onClick={() => setBotDifficulty(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            className="advanced-toggle-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <FaChevronDown /> : <FaChevronRight />}
            Advanced Settings
          </button>

          {showAdvanced && (
            <div className="advanced-panel">
              <div className="form-section">
                <label className="form-label">
                  <FaHeart style={{color:'#ef4444', marginRight: 6}} />
                  Lives per Player: <span className="value-badge">{livesPerPlayer}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={livesPerPlayer}
                  onChange={(e) => setLivesPerPlayer(parseInt(e.target.value))}
                  className="styled-slider"
                />
                <div className="slider-labels">
                  {[1,2,3,4,5].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">
                  <FaStar style={{color:'#f59e0b', marginRight: 6}} />
                  Points per Word: <span className="value-badge">{pointsPerWord}</span>
                </label>
                <input
                  type="range"
                  min="25"
                  max="100"
                  step="25"
                  value={pointsPerWord}
                  onChange={(e) => setPointsPerWord(parseInt(e.target.value))}
                  className="styled-slider"
                />
                <div className="slider-labels">
                  {[25,50,75,100].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="create-submit-btn" disabled={loading}>
            {loading ? (
              <span className="loading-dots">Creating<span>...</span></span>
            ) : (
              <>Create Room</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateGameScreen;
