// Sound service using Web Audio API for game sound effects

let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  return audioContext;
};

const playTone = (frequency, duration, type = 'sine', gain = 0.3) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

const playChord = (frequencies, duration, type = 'sine', gain = 0.2) => {
  frequencies.forEach(freq => playTone(freq, duration, type, gain));
};

export const sounds = {
  // Correct word submitted
  success: () => {
    playTone(523, 0.1, 'sine', 0.3);  // C5
    setTimeout(() => playTone(659, 0.1, 'sine', 0.3), 100); // E5
    setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 200); // G5
  },

  // Wrong word / error
  error: () => {
    playTone(200, 0.15, 'sawtooth', 0.3);
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.25), 150);
  },

  // Timer ticking (urgent)
  tick: () => {
    playTone(880, 0.05, 'square', 0.1);
  },

  // Timer expired / lost a life
  timeout: () => {
    playTone(300, 0.1, 'sawtooth', 0.3);
    setTimeout(() => playTone(200, 0.1, 'sawtooth', 0.25), 100);
    setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.2), 200);
  },

  // Game over
  gameOver: () => {
    playTone(440, 0.1, 'sawtooth', 0.3);
    setTimeout(() => playTone(349, 0.1, 'sawtooth', 0.25), 150);
    setTimeout(() => playTone(294, 0.1, 'sawtooth', 0.2), 300);
    setTimeout(() => playTone(220, 0.4, 'sawtooth', 0.2), 450);
  },

  // Win / celebration
  win: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.3), i * 100);
    });
  },

  // New round started
  newRound: () => {
    playTone(440, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(550, 0.15, 'sine', 0.2), 100);
  },

  // Player joined
  playerJoined: () => {
    playTone(660, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(880, 0.15, 'sine', 0.2), 120);
  },

  // Countdown beep
  countdown: () => {
    playTone(700, 0.1, 'square', 0.15);
  },

  // Game started
  gameStart: () => {
    playChord([523, 659, 784], 0.3, 'sine', 0.2);
    setTimeout(() => playChord([659, 784, 1047], 0.4, 'sine', 0.2), 350);
  },

  // Button click
  click: () => {
    playTone(800, 0.05, 'sine', 0.15);
  },
};

export default sounds;
