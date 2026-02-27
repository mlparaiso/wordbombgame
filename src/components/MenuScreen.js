import React from 'react';
import './MenuScreen.css';
import { FaHome, FaClock, FaFire, FaSnowflake } from 'react-icons/fa';
import { GiTimeBomb } from 'react-icons/gi';

function MenuScreen({ onStartGame, onBack }) {
  return (
    <div className="menu-screen">
      <button className="back-home-btn" onClick={onBack}>
        <FaHome /> Home
      </button>

      <div className="menu-content">
        <div className="menu-header">
          <div className="menu-logo">
            <GiTimeBomb className="menu-logo-icon" />
            <span className="menu-logo-text">Word Bomb</span>
          </div>
          <h2>Solo Play</h2>
          <p className="menu-description">
            Type words containing the given letter combination before the bomb explodes!
            Survive all <strong>20 rounds</strong> to complete the game.
          </p>
        </div>

        <div className="difficulty-selector">
          <h3>Select Difficulty</h3>

          <button
            className="difficulty-btn easy-btn"
            onClick={() => onStartGame('easy')}
          >
            <span className="diff-icon"><FaSnowflake /></span>
            <span className="diff-info">
              <span className="diff-name">Easy</span>
              <span className="diff-desc">15 seconds per round</span>
            </span>
            <span className="diff-badge"><FaClock /> 15s</span>
          </button>

          <button
            className="difficulty-btn medium-btn"
            onClick={() => onStartGame('medium')}
          >
            <span className="diff-icon"><GiTimeBomb /></span>
            <span className="diff-info">
              <span className="diff-name">Medium</span>
              <span className="diff-desc">10 seconds per round</span>
            </span>
            <span className="diff-badge"><FaClock /> 10s</span>
          </button>

          <button
            className="difficulty-btn hard-btn"
            onClick={() => onStartGame('hard')}
          >
            <span className="diff-icon"><FaFire /></span>
            <span className="diff-info">
              <span className="diff-name">Hard</span>
              <span className="diff-desc">7 seconds per round</span>
            </span>
            <span className="diff-badge"><FaClock /> 7s</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuScreen;
