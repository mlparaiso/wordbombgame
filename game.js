// Game State
let gameState = {
    score: 0,
    round: 1,
    lives: 3,
    currentCombo: '',
    usedWords: [],
    timer: null,
    timeLeft: 10,
    maxTime: 10,
    difficulty: 'medium',
    isPlaying: false
};

// Letter combinations for the game
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

// DOM Elements
const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const difficultyBtns = document.querySelectorAll('.difficulty-btn[data-difficulty]');
const scoreEl = document.getElementById('score');
const roundEl = document.getElementById('round');
const livesEl = document.getElementById('lives');
const timerBar = document.getElementById('timerBar');
const timerText = document.getElementById('timerText');
const letterCombo = document.getElementById('letterCombo');
const wordInput = document.getElementById('wordInput');
const submitBtn = document.getElementById('submitBtn');
const feedback = document.getElementById('feedback');
const usedWordsList = document.getElementById('usedWordsList');
const finalScore = document.getElementById('finalScore');
const finalRound = document.getElementById('finalRound');
const totalWords = document.getElementById('totalWords');
const playAgainBtn = document.getElementById('playAgainBtn');
const menuBtn = document.getElementById('menuBtn');

// Event Listeners
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const difficulty = btn.dataset.difficulty;
        startGame(difficulty);
    });
});

submitBtn.addEventListener('click', submitWord);
wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitWord();
    }
});

playAgainBtn.addEventListener('click', () => {
    startGame(gameState.difficulty);
});

menuBtn.addEventListener('click', showMenu);

// Game Functions
function startGame(difficulty) {
    gameState = {
        score: 0,
        round: 1,
        lives: 3,
        currentCombo: '',
        usedWords: [],
        timer: null,
        timeLeft: 10,
        maxTime: 10,
        difficulty: difficulty,
        isPlaying: true
    };

    // Set time based on difficulty
    switch(difficulty) {
        case 'easy':
            gameState.maxTime = 15;
            gameState.timeLeft = 15;
            break;
        case 'medium':
            gameState.maxTime = 10;
            gameState.timeLeft = 10;
            break;
        case 'hard':
            gameState.maxTime = 7;
            gameState.timeLeft = 7;
            break;
    }

    showScreen('game');
    updateUI();
    startNewRound();
}

function startNewRound() {
    if (!gameState.isPlaying) return;

    // Clear previous round
    wordInput.value = '';
    feedback.textContent = '';
    feedback.className = 'feedback';

    // Generate new combo
    gameState.currentCombo = letterCombos[Math.floor(Math.random() * letterCombos.length)];
    letterCombo.textContent = gameState.currentCombo;

    // Reset timer
    gameState.timeLeft = gameState.maxTime;
    updateTimer();
    startTimer();

    // Focus input
    wordInput.focus();
}

function startTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    gameState.timer = setInterval(() => {
        gameState.timeLeft -= 0.1;

        if (gameState.timeLeft <= 0) {
            gameState.timeLeft = 0;
            clearInterval(gameState.timer);
            handleTimeout();
        }

        updateTimer();
    }, 100);
}

function updateTimer() {
    const percentage = (gameState.timeLeft / gameState.maxTime) * 100;
    timerBar.style.width = percentage + '%';
    timerText.textContent = Math.ceil(gameState.timeLeft);
}

function submitWord() {
    if (!gameState.isPlaying) return;

    const word = wordInput.value.trim().toLowerCase();

    // Validate word
    if (word.length < 3) {
        showFeedback('Word must be at least 3 letters!', 'error');
        shakeInput();
        return;
    }

    if (!word.includes(gameState.currentCombo.toLowerCase())) {
        showFeedback(`Word must contain "${gameState.currentCombo}"!`, 'error');
        shakeInput();
        return;
    }

    if (gameState.usedWords.includes(word)) {
        showFeedback('Word already used!', 'error');
        shakeInput();
        return;
    }

    // Word is valid!
    handleCorrectWord(word);
}

function handleCorrectWord(word) {
    // Add to used words
    gameState.usedWords.push(word);

    // Calculate score (longer words = more points)
    const points = Math.max(10, word.length * 5);
    gameState.score += points;

    // Show feedback
    showFeedback(`+${points} points! Great word!`, 'success');

    // Update UI
    updateUI();
    addUsedWord(word);

    // Next round
    gameState.round++;
    setTimeout(() => {
        startNewRound();
    }, 1000);
}

function handleTimeout() {
    gameState.lives--;
    
    if (gameState.lives <= 0) {
        endGame();
    } else {
        showFeedback('Time\'s up! Try again!', 'error');
        updateUI();
        setTimeout(() => {
            startNewRound();
        }, 1500);
    }
}

function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.timer);

    // Update final stats
    finalScore.textContent = gameState.score;
    finalRound.textContent = gameState.round - 1;
    totalWords.textContent = gameState.usedWords.length;

    showScreen('gameOver');
}

function showFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
}

function shakeInput() {
    wordInput.classList.add('shake');
    setTimeout(() => {
        wordInput.classList.remove('shake');
    }, 300);
}

function addUsedWord(word) {
    const wordEl = document.createElement('div');
    wordEl.className = 'used-word';
    wordEl.textContent = word;
    usedWordsList.appendChild(wordEl);
}

function updateUI() {
    scoreEl.textContent = gameState.score;
    roundEl.textContent = gameState.round;
    
    // Update lives display
    const hearts = '❤️'.repeat(gameState.lives);
    const emptyHearts = '🖤'.repeat(3 - gameState.lives);
    livesEl.textContent = hearts + emptyHearts;
}

function showScreen(screen) {
    menuScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    switch(screen) {
        case 'menu':
            menuScreen.classList.remove('hidden');
            break;
        case 'game':
            gameScreen.classList.remove('hidden');
            usedWordsList.innerHTML = '';
            break;
        case 'gameOver':
            gameOverScreen.classList.remove('hidden');
            break;
    }
}

function showMenu() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    gameState.isPlaying = false;
    showScreen('menu');
}

// Initialize
showScreen('menu');
