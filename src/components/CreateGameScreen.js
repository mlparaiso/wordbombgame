import React, { useState } from 'react';
import './CreateGameScreen.css';

function CreateGameScreen({ onCreateGame, onBack }) {
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState('vs_all');
  const [difficulty, setDifficulty] = useState('medium');
  const [maxRounds, setMaxRounds] = useState(10);
  const [livesPerPlayer, setLivesPerPlayer] = useState(3);
  const [pointsPerWord, setPointsPerWord] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);

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
        isSpectator
      );
    } catch (err) {
      setError(err.message || 'Failed to create game');
      setLoading(false);
    }
  };

  return (
    <div className="create-game-screen">
      <button className="home-btn" onClick={onBack}>
        🏠 Home
      </button>

      <div className="create-game-content">
        <h2>🎯 Create Game</h2>
        <p className="subtitle">Set up your multiplayer room</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isSpectator}
                onChange={(e) => setIsSpectator(e.target.checked)}
              />
              <span>Join as Spectator (watch only, don't play)</span>
            </label>
          </div>

          <div className="form-group">
            <label>Game Mode</label>
            <div className="mode-options">
              <button
                type="button"
                className={`mode-btn ${gameMode === 'vs_all' ? 'active' : ''}`}
                onClick={() => setGameMode('vs_all')}
              >
                <span className="mode-icon">⚔️</span>
                <span className="mode-name">VS All</span>
                <span className="mode-desc">Free-for-all</span>
              </button>

              <button
                type="button"
                className={`mode-btn ${gameMode === 'team_2' ? 'active' : ''}`}
                onClick={() => setGameMode('team_2')}
              >
                <span className="mode-icon">👥</span>
                <span className="mode-name">Team 2v2</span>
                <span className="mode-desc">2 players per team</span>
              </button>

              <button
                type="button"
                className={`mode-btn ${gameMode === 'team_3' ? 'active' : ''}`}
                onClick={() => setGameMode('team_3')}
              >
                <span className="mode-icon">👨‍👩‍👦</span>
                <span className="mode-name">Team 3v3</span>
                <span className="mode-desc">3 players per team</span>
              </button>

              <button
                type="button"
                className={`mode-btn ${gameMode === 'team_4' ? 'active' : ''}`}
                onClick={() => setGameMode('team_4')}
              >
                <span className="mode-icon">👨‍👩‍👧‍👦</span>
                <span className="mode-name">Team 4v4</span>
                <span className="mode-desc">4 players per team</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <div className="difficulty-options">
              <button
                type="button"
                className={`diff-btn easy ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                Easy (15s)
              </button>
              <button
                type="button"
                className={`diff-btn medium ${difficulty === 'medium' ? 'active' : ''}`}
                onClick={() => setDifficulty('medium')}
              >
                Medium (10s)
              </button>
              <button
                type="button"
                className={`diff-btn hard ${difficulty === 'hard' ? 'active' : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                Hard (7s)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Number of Rounds</label>
            <div className="rounds-options">
              <button
                type="button"
                className={`round-btn ${maxRounds === 5 ? 'active' : ''}`}
                onClick={() => setMaxRounds(5)}
              >
                Quick (5)
              </button>
              <button
                type="button"
                className={`round-btn ${maxRounds === 10 ? 'active' : ''}`}
                onClick={() => setMaxRounds(10)}
              >
                Standard (10)
              </button>
              <button
                type="button"
                className={`round-btn ${maxRounds === 15 ? 'active' : ''}`}
                onClick={() => setMaxRounds(15)}
              >
                Long (15)
              </button>
              <button
                type="button"
                className={`round-btn ${maxRounds === 20 ? 'active' : ''}`}
                onClick={() => setMaxRounds(20)}
              >
                Marathon (20)
              </button>
            </div>
          </div>

          <div className="advanced-toggle">
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▼' : '▶'} Advanced Settings
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-settings">
              <div className="form-group">
                <label>Lives per Player: {livesPerPlayer} ❤️</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={livesPerPlayer}
                  onChange={(e) => setLivesPerPlayer(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              <div className="form-group">
                <label>Points per Word: {pointsPerWord}</label>
                <input
                  type="range"
                  min="25"
                  max="100"
                  step="25"
                  value={pointsPerWord}
                  onChange={(e) => setPointsPerWord(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="create-btn-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateGameScreen;
