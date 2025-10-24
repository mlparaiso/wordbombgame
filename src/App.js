import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import MenuScreen from './components/MenuScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';

const letterCombos = [
  'AB', 'AC', 'AD', 'AG', 'AI', 'AL', 'AM', 'AN', 'AP', 'AR', 'AS', 'AT', 'AY',
  'BA', 'BE', 'BI', 'BO', 'BR', 'BU', 'BY',
  'CA', 'CE', 'CH', 'CI', 'CK', 'CL', 'CO', 'CR', 'CT', 'CU',
  'DA', 'DE', 'DI', 'DO', 'DR', 'DU', 'DY',
  'EA', 'ED', 'EE', 'EL', 'EM', 'EN', 'ER', 'ES', 'ET', 'EW', 'EX', 'EY',
  'FA', 'FE', 'FI', 'FL', 'FO', 'FR', 'FU',
  'GA', 'GE', 'GH', 'GI', 'GL', 'GO', 'GR', 'GU',
  'HA', 'HE', 'HI', 'HO', 'HU',
  'IC', 'ID', 'IE', 'IF', 'IG', 'IL', 'IM', 'IN', 'IO', 'IR', 'IS', 'IT', 'IV',
  'JA', 'JE', 'JO', 'JU',
  'KE', 'KI', 'KN',
  'LA', 'LE', 'LI', 'LL', 'LO', 'LU', 'LY',
  'MA', 'ME', 'MI', 'MO', 'MP', 'MU', 'MY',
  'NA', 'NE', 'NG', 'NI', 'NO', 'NT', 'NU',
  'OA', 'OB', 'OC', 'OD', 'OF', 'OG', 'OI', 'OK', 'OL', 'OM', 'ON', 'OO', 'OP', 'OR', 'OS', 'OT', 'OU', 'OV', 'OW', 'OX', 'OY',
  'PA', 'PE', 'PH', 'PI', 'PL', 'PO', 'PR', 'PU',
  'QU',
  'RA', 'RE', 'RG', 'RI', 'RK', 'RM', 'RN', 'RO', 'RP', 'RR', 'RS', 'RT', 'RU', 'RY',
  'SA', 'SC', 'SE', 'SH', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'ST', 'SU', 'SW', 'SY',
  'TA', 'TE', 'TH', 'TI', 'TO', 'TR', 'TT', 'TU', 'TW', 'TY',
  'UB', 'UC', 'UD', 'UE', 'UG', 'UI', 'UL', 'UM', 'UN', 'UP', 'UR', 'US', 'UT',
  'VA', 'VE', 'VI', 'VO',
  'WA', 'WE', 'WH', 'WI', 'WO', 'WR',
  'YE', 'YO', 'YS',
  'ZE', 'ZO'
];

function App() {
  const [screen, setScreen] = useState('menu');
  const [difficulty, setDifficulty] = useState('medium');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [currentCombo, setCurrentCombo] = useState('');
  const [usedWords, setUsedWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [maxTime, setMaxTime] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);

  const getRandomCombo = useCallback(() => {
    return letterCombos[Math.floor(Math.random() * letterCombos.length)];
  }, []);

  const startGame = useCallback((selectedDifficulty) => {
    let time;
    switch(selectedDifficulty) {
      case 'easy':
        time = 15;
        break;
      case 'medium':
        time = 10;
        break;
      case 'hard':
        time = 7;
        break;
      default:
        time = 10;
    }

    setDifficulty(selectedDifficulty);
    setScore(0);
    setRound(1);
    setLives(3);
    setUsedWords([]);
    setMaxTime(time);
    setTimeLeft(time);
    setCurrentCombo(getRandomCombo());
    setIsPlaying(true);
    setScreen('game');
  }, [getRandomCombo]);

  const startNewRound = useCallback(() => {
    setCurrentCombo(getRandomCombo());
    setTimeLeft(maxTime);
  }, [getRandomCombo, maxTime]);

  const handleTimeout = useCallback(() => {
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0) {
      setIsPlaying(false);
      setScreen('gameOver');
    } else {
      setTimeout(() => {
        startNewRound();
      }, 1500);
    }
  }, [lives, startNewRound]);

  const submitWord = useCallback((word) => {
    if (!isPlaying) return { success: false, message: '' };

    const trimmedWord = word.trim().toLowerCase();

    if (trimmedWord.length < 3) {
      return { success: false, message: 'Word must be at least 3 letters!' };
    }

    if (!trimmedWord.includes(currentCombo.toLowerCase())) {
      return { success: false, message: `Word must contain "${currentCombo}"!` };
    }

    if (usedWords.includes(trimmedWord)) {
      return { success: false, message: 'Word already used!' };
    }

    // Word is valid
    const points = Math.max(10, trimmedWord.length * 5);
    setScore(prev => prev + points);
    setUsedWords(prev => [...prev, trimmedWord]);
    setRound(prev => prev + 1);

    setTimeout(() => {
      startNewRound();
    }, 1000);

    return { success: true, message: `+${points} points! Great word!` };
  }, [isPlaying, currentCombo, usedWords, startNewRound]);

  const goToMenu = useCallback(() => {
    setIsPlaying(false);
    setScreen('menu');
  }, []);

  const playAgain = useCallback(() => {
    startGame(difficulty);
  }, [difficulty, startGame]);

  // Timer effect
  useEffect(() => {
    if (!isPlaying || screen !== 'game') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, screen, handleTimeout]);

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>💣 Word Bomb</h1>
          <p className="subtitle">Type a word containing the letters before time runs out!</p>
        </header>

        <main>
          {screen === 'menu' && (
            <MenuScreen onStartGame={startGame} />
          )}

          {screen === 'game' && (
            <GameScreen
              score={score}
              round={round}
              lives={lives}
              timeLeft={timeLeft}
              maxTime={maxTime}
              currentCombo={currentCombo}
              usedWords={usedWords}
              onSubmitWord={submitWord}
              isPlaying={isPlaying}
            />
          )}

          {screen === 'gameOver' && (
            <GameOverScreen
              score={score}
              round={round - 1}
              totalWords={usedWords.length}
              onPlayAgain={playAgain}
              onGoToMenu={goToMenu}
            />
          )}
        </main>

        <footer>
          <p>Created with ❤️ | Deploy on Netlify</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
