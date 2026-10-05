// Estado do Jogo Glacial
let sequence = [];
let playerSequence = [];
let level = 1;
let score = 0;
let lives = 3;
let timer = null;
let timeLeft = 0;
let isPlayingSequence = false;
let correctMathAnswer = 0;

// Elementos DOM
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');

const levelVal = document.getElementById('level-val');
const scoreVal = document.getElementById('score-val');
const livesVal = document.getElementById('lives-val');
const timerVal = document.getElementById('timer-val');
const statusMsg = document.getElementById('status-message');

const numButtons = document.querySelectorAll('.num-btn');
const mathModal = document.getElementById('math-modal');
const mathExpression = document.getElementById('math-expression');
const mathOptBtns = document.querySelectorAll('.math-opt-btn');

// Sintetizador de Áudio Glacial (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, duration = 180, type = 'sine') {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}

// Frequências estilo "cristais de gelo"
const sounds = {
  1: 329.63, 2: 392.00, 3: 440.00,
  4: 523.25, 5: 587.33, 6: 659.25,
  7: 698.46, 8: 783.99, 9: 880.00
};

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

numButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (isPlayingSequence) return;
    const num = parseInt(e.target.dataset.num);
    handlePlayerInput(num, e.target);
  });
});

// Inicialização do Jogo
function startGame() {
  sequence = [];
  playerSequence = [];
  level = 1;
  score = 0;
  lives = 3;
  
  updateStats();
  switchScreen(gameScreen);
  nextRound();
}

function updateStats() {
  levelVal.textContent = level;
  scoreVal.textContent = score;
  livesVal.textContent = '❄️'.repeat(lives);
}

function switchScreen(screenToActive) {
  [startScreen, gameScreen, gameoverScreen].forEach(s => s.classList.remove('active'));
  screenToActive.classList.add('active');
}

// Lógica das Rodadas
function nextRound() {
  playerSequence = [];
  statusMsg.textContent = "Observe os cristais congelados...";
  isPlayingSequence = true;

  const nextNum = Math.floor(Math.random() * 9) + 1;
  sequence.push(nextNum);

  playSequence();
}

function playSequence() {
  let i = 0;
  const speed = Math.max(280, 750 - (level * 35));

  const interval = setInterval(() => {
    if (i >= sequence.length) {
      clearInterval(interval);
      isPlayingSequence = false;
      statusMsg.textContent = "Sua vez! Toque nos cristais corretos.";
      return;
    }

    const num = sequence[i];
    const btn = document.querySelector(`.num-btn[data-num="${num}"]`);
    activateButton(btn, num);
    i++;
  }, speed);
}

function activateButton(btn, num) {
  btn.classList.add('active');
  playSound(sounds[num], 220);
  setTimeout(() => {
    btn.classList.remove('active');
  }, 250);
}

// Clique do Jogador
function handlePlayerInput(num, btnElement) {
  playerSequence.push(num);
  const currentIndex = playerSequence.length - 1;

  if (num === sequence[currentIndex]) {
    playSound(sounds[num], 150);
    btnElement.classList.add('active');
    setTimeout(() => btnElement.classList.remove('active'), 150);

    if (playerSequence.length === sequence.length) {
      score += level * 15;
      updateStats();
      
      // Desafio do Mamute a cada 2 ERAS
      if (level % 2 === 0) {
        setTimeout(startMathChallenge, 500);
      } else {
        level++;
        updateStats();
        setTimeout(nextRound, 1000);
      }
    }
  } else {
    // Erro (Gelo quebrando)
    btnElement.classList.add('error');
    playSound(120, 500, 'sawtooth');
    setTimeout(() => btnElement.classList.remove('error'), 400);

    lives--;
    updateStats();

    if (lives <= 0) {
      gameOver();
    } else {
      statusMsg.textContent = "O gelo trincou! Repita a sequência.";
      playerSequence = [];
      setTimeout(playSequence, 1200);
    }
  }
}

// Desafio Matemático do Mamute
function startMathChallenge() {
  mathModal.classList.remove('hidden');
  
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b;

  if (op === '*') {
    a = Math.floor(Math.random() * 8) + 2;
    b = Math.floor(Math.random() * 8) + 2;
    correctMathAnswer = a * b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 30) + 10;
    b = Math.floor(Math.random() * a);
    correctMathAnswer = a - b;
  } else {
    a = Math.floor(Math.random() * 40) + 5;
    b = Math.floor(Math.random() * 40) + 5;
    correctMathAnswer = a + b;
  }

  mathExpression.textContent = `\({a}\){op} ${b} = ?`;

  const options = [correctMathAnswer];
  while (options.length < 3) {
    const wrong = correctMathAnswer + (Math.floor(Math.random() * 10) - 5);
    if (wrong !== correctMathAnswer && !options.includes(wrong)) {
      options.push(wrong);
    }
  }

  options.sort(() => Math.random() - 0.5);

  mathOptBtns.forEach((btn, idx) => {
    btn.textContent = options[idx];
    btn.onclick = () => checkMathAnswer(options[idx]);
  });

  timeLeft = 5;
  timerVal.textContent = `${timeLeft}s`;
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    timerVal.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      checkMathAnswer(null);
    }
  }, 1000);
}

function checkMathAnswer(selectedAnswer) {
  clearInterval(timer);
  timerVal.textContent = '--';
  mathModal.classList.add('hidden');

  if (selectedAnswer === correctMathAnswer) {
    playSound(900, 250);
    score += 75;
    statusMsg.textContent = "🦣 Mamute Aprovou! +75 Pontos!";
  } else {
    playSound(100, 400, 'sawtooth');
    lives--;
    statusMsg.textContent = "Tempestade de neve! Você errou ou o tempo acabou.";
  }

  updateStats();

  if (lives <= 0) {
    gameOver();
  } else {
    level++;
    updateStats();
    setTimeout(nextRound, 1200);
  }
}

// Game Over
function gameOver() {
  document.getElementById('final-level').textContent = level;
  document.getElementById('final-score').textContent = score;
  switchScreen(gameoverScreen);
}