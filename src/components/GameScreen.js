import React, { useState, useEffect, useRef } from 'react';
import './GameScreen.css';
import { FaHeart, FaRegHeart, FaStar, FaHome, FaPaperPlane, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { GiTimeBomb } from 'react-icons/gi';
import { getVolume, setVolume } from '../lib/soundService';

const MAX_SOLO_ROUNDS = 20;

function GameScreen({ 
  score, 
  round, 
  lives, 
  timeLeft, 
  maxTime, 
  currentCombo, 
  usedWords, 
  onSubmitWord,
  isPlaying,
  onExit
}) {
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [shake, setShake] = useState(false);
  const [volume, setVolumeState] = useState(getVolume);
  const inputRef = useRef(null);

  const maxLives = 3;

  useEffect(() => {
    if (isPlaying && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPlaying, currentCombo]);

  useEffect(() => {
    setInputValue('');
    setFeedback({ message: '', type: '' });
  }, [currentCombo]);

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    setVolume(val);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    const result = await onSubmitWord(inputValue);
    
    if (result.success) {
      setFeedback({ message: result.message, type: 'success' });
      setInputValue('');
    } else {
      setFeedback({ message: result.message, type: 'error' });
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleExit = () => {
    const confirmed = window.confirm(
      'Are you sure you want to exit? Your progress will be lost.'
    );
    if (confirmed && onExit) {
      onExit();
    }
  };

  const percentage = (timeLeft / maxTime) * 100;
  const isUrgent = timeLeft <= 3;

  return (
    <div className="game-screen solo-game-layout" style={{paddingTop: 0}}>
      {/* ── Header Bar ── */}
      <div className="game-header-bar" style={{width:'100%', alignSelf:'stretch', boxSizing:'border-box', marginBottom:14}}>
        {onExit && (
          <button className="exit-btn" onClick={handleExit}>
            <FaHome /> Home
          </button>
        )}
        <div className="game-header-logo">
          <GiTimeBomb style={{ fontSize: '1.3rem', color: '#a5b4fc' }} />
          <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem', letterSpacing: '0.02em' }}>Word Bomb</span>
        </div>
        <div className="game-header-center">
          <div className="header-stats">
            <span className="header-stat">
              <GiTimeBomb style={{color:'#a5b4fc'}} /> Round <span className="stat-val">{round} / {MAX_SOLO_ROUNDS}</span>
            </span>
            <span className="header-stat">
              <FaStar style={{color:'#fbbf24'}} /> <span className="stat-val">{score}</span>
            </span>
            <span className="header-stat header-lives">
              {Array.from({ length: maxLives }).map((_, i) => (
                i < lives
                  ? <FaHeart key={i} className="heart-icon filled" />
                  : <FaRegHeart key={i} className="heart-icon empty" />
              ))}
            </span>
          </div>
        </div>
        {/* Volume Control */}
        <div className="volume-control">
          {volume === 0
            ? <FaVolumeMute className="volume-icon" />
            : <FaVolumeUp className="volume-icon" />
          }
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>

      {/* ── Focus Card: Timer + Combo ── */}
      <div className="solo-focus-card">
        <div className={`timer-container ${isUrgent ? 'urgent' : ''}`}>
          <div className="timer-bar" style={{ width: `${percentage}%` }}></div>
          <span className="timer-text">{Math.ceil(timeLeft)}</span>
        </div>
        <div className="prompt-container" style={{marginBottom:0}}>
          <p className="prompt-label">Find a word containing:</p>
          <div className="letter-combo">{currentCombo}</div>
        </div>
      </div>

      {/* ── Input ── */}
      <div className="solo-input-zone">
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            className={shake ? 'shake' : ''}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your word here..."
            autoComplete="off"
            spellCheck="false"
          />
          <button onClick={handleSubmit}>
            <FaPaperPlane /> Submit
          </button>
        </div>
      </div>

      {/* ── Feedback ── */}
      <div className="solo-feedback-zone">
        <div className={`feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      </div>

      {/* ── Score Banner ── */}
      <div className="solo-score-banner">
        <FaStar style={{ color: '#fbbf24', fontSize: '1.1rem' }} />
        <span className="solo-score-label">Current Score</span>
        <span className="solo-score-value">{score}</span>
      </div>

      {/* ── Used Words ── */}
      <div className="solo-used-words used-words">
        <h4>Words Used ({usedWords.length}):</h4>
        <div className="used-words-list">
          {usedWords.map((word, index) => (
            <div key={index} className="used-word">{word}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GameScreen;
