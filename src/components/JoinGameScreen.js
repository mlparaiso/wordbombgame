import React, { useState } from 'react';
import './JoinGameScreen.css';

function JoinGameScreen({ onJoinGame, onBack }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (roomCode.trim().length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onJoinGame(roomCode.trim().toUpperCase(), playerName.trim());
    } catch (err) {
      setError(err.message || 'Failed to join game');
      setLoading(false);
    }
  };

  const handleRoomCodeChange = (e) => {
    // Only allow alphanumeric characters and convert to uppercase
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value.slice(0, 6));
  };

  return (
    <div className="join-game-screen">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="join-game-content">
        <h2>🚀 Join Game</h2>
        <p className="subtitle">Enter the room code to join</p>

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
            <label>Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={handleRoomCodeChange}
              placeholder="Enter 6-digit code"
              className="room-code-input"
              maxLength={6}
            />
            <p className="input-hint">Ask the host for the room code</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="join-btn-submit" disabled={loading}>
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>

        <div className="join-info">
          <h4>💡 Tips</h4>
          <ul>
            <li>Make sure you have the correct room code</li>
            <li>The game must not have started yet</li>
            <li>Choose a unique name in the room</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default JoinGameScreen;
