import React from 'react';
import './HomeScreen.css';
import { isSupabaseConfigured } from '../lib/supabase';

function HomeScreen({ onPlaySolo, onCreateGame, onJoinGame }) {
  const multiplayerEnabled = isSupabaseConfigured();

  return (
    <div className="home-screen">
      <div className="home-content">
        <div className="logo-section">
          <h1 className="game-title">💣 Word Bomb</h1>
          <p className="game-tagline">Type fast, think faster!</p>
        </div>

        <div className="menu-options">
          <button className="menu-btn solo-btn" onClick={onPlaySolo}>
            <span className="btn-icon">🎮</span>
            <span className="btn-text">Play Solo</span>
            <span className="btn-desc">Practice alone</span>
          </button>

          {multiplayerEnabled ? (
            <>
              <button className="menu-btn create-btn" onClick={onCreateGame}>
                <span className="btn-icon">🎯</span>
                <span className="btn-text">Create Game</span>
                <span className="btn-desc">Host a multiplayer room</span>
              </button>

              <button className="menu-btn join-btn" onClick={onJoinGame}>
                <span className="btn-icon">🚀</span>
                <span className="btn-text">Join Game</span>
                <span className="btn-desc">Enter with room code</span>
              </button>
            </>
          ) : (
            <div className="multiplayer-disabled">
              <p>🔒 Multiplayer features require Supabase configuration</p>
              <p className="small-text">Check SUPABASE_SETUP.md for instructions</p>
            </div>
          )}
        </div>

        <div className="game-info">
          <h3>How to Play</h3>
          <ul>
            <li>You'll see a letter combination (e.g., "AB", "ER")</li>
            <li>Type a word containing those letters</li>
            <li>Submit before time runs out!</li>
            <li>Longer words = more points</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
