import React, { useState, useEffect, useRef } from 'react';
import './GameScreen.css';

function GameScreen({ 
  score, 
  round, 
  lives, 
  timeLeft, 
  maxTime, 
  currentCombo, 
  usedWords, 
  onSubmitWord,
  isPlaying 
}) {
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isPlaying && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPlaying, currentCombo]);

  useEffect(() => {
    setInputValue('');
    setFeedback({ message: '', type: '' });
  }, [currentCombo]);

  const handleSubmit = () => {
    const result = onSubmitWord(inputValue);
    
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

  const percentage = (timeLeft / maxTime) * 100;
  const hearts = '❤️'.repeat(lives);
  const emptyHearts = '🖤'.repeat(3 - lives);

  return (
    <div className="game-screen">
      <div className="stats">
        <div className="stat">
          <span className="stat-label">Score</span>
          <span className="stat-value">{score}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Round</span>
          <span className="stat-value">{round}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Lives</span>
          <span className="stat-value">{hearts}{emptyHearts}</span>
        </div>
      </div>

      <div className="timer-container">
        <div 
          className="timer-bar" 
          style={{ width: `${percentage}%` }}
        ></div>
        <span className="timer-text">{Math.ceil(timeLeft)}</span>
      </div>

      <div className="prompt-container">
        <p className="prompt-label">Your letters:</p>
        <div className="letter-combo">{currentCombo}</div>
      </div>

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
        <button onClick={handleSubmit}>Submit</button>
      </div>

      <div className={`feedback ${feedback.type}`}>
        {feedback.message}
      </div>

      <div className="used-words">
        <h4>Words Used:</h4>
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
