import React from 'react';
import './GameOverScreen.css';

function GameOverScreen({ score, round, totalWords, onPlayAgain, onGoToMenu }) {
  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <h2>💥 Game Over!</h2>
        <div className="final-stats">
          <p>Final Score: <span>{score}</span></p>
          <p>Rounds Completed: <span>{round}</span></p>
          <p>Words Found: <span>{totalWords}</span></p>
        </div>
        <button className="difficulty-btn" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="difficulty-btn secondary" onClick={onGoToMenu}>
          Main Menu
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;
