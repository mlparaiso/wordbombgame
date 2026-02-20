import React, { useState } from 'react';
import './JoinGameScreen.css';
import { FaHome, FaSignInAlt, FaLightbulb, FaArrowRight } from 'react-icons/fa';
import { GiTimeBomb } from 'react-icons/gi';

const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Gold', 'Silver', 'White', 'Black', 'Crimson', 'Violet', 'Teal', 'Coral', 'Amber', 'Jade', 'Ivory', 'Scarlet', 'Indigo'];
const FRUITS = ['Lemon', 'Mango', 'Kiwi', 'Peach', 'Cherry', 'Melon', 'Grape', 'Papaya', 'Guava', 'Lychee', 'Banana', 'Coconut', 'Pineapple', 'Strawberry', 'Blueberry', 'Watermelon', 'Avocado', 'Dragonfruit', 'Passion', 'Jackfruit'];
const randomFunnyName = () => {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  return `${color}${fruit}`;
};

function JoinGameScreen({ onJoinGame, onBack }) {
  const [playerName, setPlayerName] = useState(() => randomFunnyName());
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
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value.slice(0, 6));
  };

  const tips = [
    'Ask the host for the 6-character room code',
    'The game must not have started yet',
    'Choose a unique name in the room',
  ];

  return (
    <div className="join-game-screen">
      <button className="back-home-btn" onClick={onBack}>
        <FaHome /> Home
      </button>

      <div className="join-game-content">
        <div className="join-game-header">
          <div className="join-game-icon"><GiTimeBomb /></div>
          <h2>Join Game</h2>
          <p className="subtitle">Enter the room code to join</p>
        </div>

        <form onSubmit={handleSubmit}>
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

          <div className="form-section">
            <label className="form-label">Room Code</label>
            <input
              type="text"
              className="form-input room-code-input"
              value={roomCode}
              onChange={handleRoomCodeChange}
              placeholder="A B C 1 2 3"
              maxLength={6}
            />
            <p className="input-hint">Ask the host for the 6-character room code</p>

            {/* Code character slots visual */}
            <div className="code-slots">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`code-slot ${roomCode[i] ? 'filled' : ''}`}>
                  {roomCode[i] || ''}
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="join-submit-btn" disabled={loading || roomCode.length !== 6 || !playerName.trim()}>
            {loading ? (
              'Joining...'
            ) : (
              <><FaSignInAlt style={{marginRight: 8}} /> Join Room</>
            )}
          </button>
        </form>

        <div className="join-tips">
          <h4><FaLightbulb className="tip-icon" /> Tips</h4>
          <ul>
            {tips.map((tip, i) => (
              <li key={i}>
                <FaArrowRight className="tip-arrow" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default JoinGameScreen;
