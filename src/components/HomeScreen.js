import React from 'react';
import './HomeScreen.css';
import { isSupabaseConfigured } from '../lib/supabase';
import { GiTimeBomb } from 'react-icons/gi';
import { FaGamepad, FaPlusCircle, FaSignInAlt, FaCheckCircle, FaLock } from 'react-icons/fa';

function HomeScreen({ onPlaySolo, onCreateGame, onJoinGame }) {
  const multiplayerEnabled = isSupabaseConfigured();

  return (
    <div className="home-screen">
      <div className="home-content">
        <div className="logo-section">
          <div className="logo-icon">
          <GiTimeBomb />
          </div>
          <h1 className="game-title">Word Bomb</h1>
          <p className="game-tagline">Type fast, think faster!</p>
        </div>

        <div className="menu-options">
          <button className="menu-btn solo-btn" onClick={onPlaySolo}>
            <span className="btn-icon"><FaGamepad /></span>
            <div className="btn-text-group">
              <span className="btn-text">Play Solo</span>
              <span className="btn-desc">Practice alone</span>
            </div>
          </button>

          {multiplayerEnabled ? (
            <>
              <button className="menu-btn create-btn" onClick={onCreateGame}>
                <span className="btn-icon"><FaPlusCircle /></span>
                <div className="btn-text-group">
                  <span className="btn-text">Create Game</span>
                  <span className="btn-desc">Host a multiplayer room</span>
                </div>
              </button>

              <button className="menu-btn join-btn" onClick={onJoinGame}>
                <span className="btn-icon"><FaSignInAlt /></span>
                <div className="btn-text-group">
                  <span className="btn-text">Join Game</span>
                  <span className="btn-desc">Enter with room code</span>
                </div>
              </button>
            </>
          ) : (
            <div className="multiplayer-disabled">
              <p><FaLock style={{ marginRight: 8 }} />Multiplayer requires Supabase configuration</p>
              <p className="small-text">Check SUPABASE_SETUP.md for instructions</p>
            </div>
          )}
        </div>

        <div className="game-info">
          <h3>How to Play</h3>
          <ul>
            <li><FaCheckCircle className="check-icon" /> You'll see a letter combination (e.g., "AB", "ER")</li>
            <li><FaCheckCircle className="check-icon" /> Type a word containing those letters</li>
            <li><FaCheckCircle className="check-icon" /> Submit before time runs out!</li>
            <li><FaCheckCircle className="check-icon" /> Longer words = more points</li>
          </ul>
        </div>

        <div className="home-footer">
          Created by <span className="home-footer-name">Michael Paraiso</span>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
