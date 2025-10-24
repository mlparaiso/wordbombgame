import React from 'react';
import './MenuScreen.css';

function MenuScreen({ onStartGame }) {
  return (
    <div className="menu-screen">
      <div className="menu-content">
        <h2>Welcome to Word Bomb!</h2>
        <p>Type words containing the given letter combination before the timer runs out.</p>
        <div className="difficulty-selector">
          <h3>Select Difficulty:</h3>
          <button 
            className="difficulty-btn" 
            onClick={() => onStartGame('easy')}
          >
            Easy (15s)
          </button>
          <button 
            className="difficulty-btn" 
            onClick={() => onStartGame('medium')}
          >
            Medium (10s)
          </button>
          <button 
            className="difficulty-btn" 
            onClick={() => onStartGame('hard')}
          >
            Hard (7s)
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuScreen;
