const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const playerScoreEl = document.getElementById('playerScore');
const opponentScoreEl = document.getElementById('opponentScore');
const restartButton = document.getElementById('restart');
const overlay = document.getElementById('overlay');
const overlayMessage = document.getElementById('overlayMessage');
const playButton = document.getElementById('playButton');
const statusEl = document.getElementById('status');
const matchForm = document.getElementById('matchForm');
const difficultySelect = document.getElementById('difficulty');
const opponentLabelEl = document.getElementById('opponentLabel');

const opponentRadios = Array.from(matchForm.elements['opponent']);
const difficultyField = matchForm.querySelector('[data-difficulty]');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 14;
const PADDLE_HEIGHT = 92;
const BALL_RADIUS = 8;
const WINNING_SCORE = 10;
const BASE_BALL_SPEED = 360;
const MAX_BALL_SPEED = 620;
const COUNTDOWN_START = 3;

const GameState = {
  READY: 'ready',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
};

const player = {
  x: 24,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  vy: 0,
};

const opponent = {
  x: WIDTH - PADDLE_WIDTH - 24,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  vy: 0,
};

const ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  vx: 0,
  vy: 0,
};

const keys = new Set();
let pointerActive = false;
let lastTime = 0;
let playerScore = 0;
let opponentScore = 0;
let gameState = GameState.READY;
let countdownValue = 0;
let countdownTimer = 0;
let serveDirection = 1;
let gameMode = 'ai';
let difficulty = 'normal';

const DifficultySettings = {
  normal: {
    reaction: 340,
    anticipation: 0.6,
    error: 24,
  },
  hard: {
    reaction: 440,
    anticipation: 0.85,
    error: 12,
  },
};

const PlayerControls = {
  left: {
    up: new Set(['w']),
    down: new Set(['s']),
  },
  right: {
    up: new Set(['arrowup']),
    down: new Set(['arrowdown']),
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setStatus(message) {
  statusEl.textContent = message;
}

function toggleDifficultyVisibility() {
  if (gameMode === 'friend' || opponentRadios.find((radio) => radio.checked)?.value === 'friend') {
    difficultyField.hidden = true;
  } else {
    difficultyField.hidden = false;
  }
}

function showOverlay(message, buttonLabel = 'Start Match') {
  overlayMessage.textContent = message;
  playButton.textContent = buttonLabel;
  overlay.hidden = false;
  toggleDifficultyVisibility();
  playButton.focus({ preventScroll: true });
}

function hideOverlay() {
  overlay.hidden = true;
}

function resetScores() {
  playerScore = 0;
  opponentScore = 0;
  updateScoreboard();
}

function resetPositions() {
  player.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
  opponent.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.vx = 0;
  ball.vy = 0;
}

function startCountdown(direction) {
  serveDirection = direction;
  countdownValue = COUNTDOWN_START;
  countdownTimer = 0;
  gameState = GameState.COUNTDOWN;
  resetPositions();
  setStatus(`Serve in ${countdownValue}…`);
}

function launchBall(direction) {
  const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
  const speed = BASE_BALL_SPEED;
  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;
}

function updateScoreboard() {
  playerScoreEl.textContent = playerScore;
  opponentScoreEl.textContent = opponentScore;
}

function configureControls() {
  if (gameMode === 'ai') {
    PlayerControls.left.up.add('arrowup');
    PlayerControls.left.down.add('arrowdown');
  } else {
    PlayerControls.left.up.delete('arrowup');
    PlayerControls.left.down.delete('arrowdown');
  }
}

function applyMatchSettings() {
  const selectedOpponent = opponentRadios.find((radio) => radio.checked)?.value || 'ai';
  gameMode = selectedOpponent;
  difficulty = difficultySelect.value;
  opponentLabelEl.textContent = gameMode === 'ai' ? 'AI' : 'Player 2';
  configureControls();
  toggleDifficultyVisibility();
}

function startMatch() {
  hideOverlay();
  applyMatchSettings();
  resetScores();
  startCountdown(Math.random() > 0.5 ? 1 : -1);
}

function usingControl(controlSet, keySet) {
  for (const key of controlSet) {
    if (keySet.has(key)) {
      return true;
    }
  }
  return false;
}

function updatePlayer(delta) {
  let direction = 0;
  if (usingControl(PlayerControls.left.up, keys)) direction -= 1;
  if (usingControl(PlayerControls.left.down, keys)) direction += 1;

  const speed = 420;
  player.y += direction * speed * delta;
  player.y = clamp(player.y, 0, HEIGHT - PADDLE_HEIGHT);
}

function anticipateBallPosition(framesAhead) {
  const simulatedBall = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy };
  const step = 1 / 60;
  for (let i = 0; i < framesAhead; i += 1) {
    simulatedBall.x += simulatedBall.vx * step;
    simulatedBall.y += simulatedBall.vy * step;
    if (simulatedBall.y - BALL_RADIUS <= 0 || simulatedBall.y + BALL_RADIUS >= HEIGHT) {
      simulatedBall.vy *= -1;
    }
  }
  return simulatedBall.y;
}

function updateAI(delta) {
  const settings = DifficultySettings[difficulty] || DifficultySettings.normal;
  const anticipationFrames = Math.round(settings.anticipation * 45);
  const predictedY = anticipateBallPosition(anticipationFrames) - PADDLE_HEIGHT / 2;
  const reactionSpeed = gameState === GameState.PLAYING ? settings.reaction : settings.reaction * 0.75;
  const noise = (Math.random() - 0.5) * settings.error;
  const targetY = predictedY + noise;
  const difference = targetY - opponent.y;
  const maxStep = reactionSpeed * delta;
  const step = clamp(difference, -maxStep, maxStep);
  opponent.y = clamp(opponent.y + step, 0, HEIGHT - PADDLE_HEIGHT);
}

function updateSecondPlayer(delta) {
  let direction = 0;
  if (usingControl(PlayerControls.right.up, keys)) direction -= 1;
  if (usingControl(PlayerControls.right.down, keys)) direction += 1;

  const speed = 420;
  opponent.y += direction * speed * delta;
  opponent.y = clamp(opponent.y, 0, HEIGHT - PADDLE_HEIGHT);
}

function updateOpponent(delta) {
  if (gameMode === 'ai') {
    updateAI(delta);
  } else {
    updateSecondPlayer(delta);
  }
}

function updateCountdown(delta) {
  countdownTimer += delta;
  if (countdownTimer >= 1) {
    countdownTimer -= 1;
    countdownValue -= 1;
    if (countdownValue > 0) {
      setStatus(`Serve in ${countdownValue}…`);
    } else {
      setStatus('Ball in play!');
      gameState = GameState.PLAYING;
      launchBall(serveDirection);
    }
  }
}

function reflectFromPaddle(paddle, isPlayer) {
  const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
  const relativeIntersect = ball.y - paddleCenter;
  const normalized = clamp(relativeIntersect / (PADDLE_HEIGHT / 2), -1, 1);
  const maxBounceAngle = (75 * Math.PI) / 180;
  const bounceAngle = normalized * maxBounceAngle;
  const direction = isPlayer ? 1 : -1;
  const currentSpeed = Math.hypot(ball.vx, ball.vy);
  const newSpeed = clamp(currentSpeed + 24, BASE_BALL_SPEED, MAX_BALL_SPEED);
  ball.vx = Math.cos(bounceAngle) * newSpeed * direction;
  ball.vy = Math.sin(bounceAngle) * newSpeed;
  ball.x = isPlayer ? player.x + PADDLE_WIDTH + BALL_RADIUS : opponent.x - BALL_RADIUS;
}

function awardPoint(winner) {
  if (winner === 'player') {
    playerScore += 1;
  } else {
    opponentScore += 1;
  }
  updateScoreboard();

  const opponentName = gameMode === 'ai' ? 'AI' : 'Player 2';

  if (playerScore >= WINNING_SCORE || opponentScore >= WINNING_SCORE) {
    gameState = GameState.GAME_OVER;
    const message = winner === 'player' ? 'You win!' : `${opponentName} wins!`;
    setStatus(`Match over — ${message}`);
    showOverlay(`${message}\nFinal score ${playerScore} : ${opponentScore}`, 'Play Again');
  } else {
    const scorer = winner === 'player' ? 'You' : opponentName;
    setStatus(`${scorer} scored! Next serve in ${COUNTDOWN_START}…`);
    startCountdown(winner === 'player' ? 1 : -1);
  }
}

function updateBall(delta) {
  ball.x += ball.vx * delta;
  ball.y += ball.vy * delta;

  if (ball.y - BALL_RADIUS <= 0) {
    ball.y = BALL_RADIUS;
    ball.vy = Math.abs(ball.vy);
  }
  if (ball.y + BALL_RADIUS >= HEIGHT) {
    ball.y = HEIGHT - BALL_RADIUS;
    ball.vy = -Math.abs(ball.vy);
  }

  if (
    ball.x - BALL_RADIUS <= player.x + PADDLE_WIDTH &&
    ball.x > player.x &&
    ball.y >= player.y &&
    ball.y <= player.y + PADDLE_HEIGHT
  ) {
    reflectFromPaddle(player, true);
  }

  if (
    ball.x + BALL_RADIUS >= opponent.x &&
    ball.x < opponent.x + PADDLE_WIDTH &&
    ball.y >= opponent.y &&
    ball.y <= opponent.y + PADDLE_HEIGHT
  ) {
    reflectFromPaddle(opponent, false);
  }

  if (ball.x + BALL_RADIUS < 0) {
    awardPoint('opponent');
  }

  if (ball.x - BALL_RADIUS > WIDTH) {
    awardPoint('player');
  }
}

function drawNet() {
  ctx.setLineDash([10, 12]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 20);
  ctx.lineTo(WIDTH / 2, HEIGHT - 20);
  ctx.stroke();
  ctx.setLineDash([]);
}

function renderCountdown() {
  if (gameState !== GameState.COUNTDOWN) return;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, HEIGHT / 2 - 70, WIDTH, 140);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(countdownValue), WIDTH / 2, HEIGHT / 2 + 20);
}

function renderGameOver() {
  if (gameState !== GameState.GAME_OVER) return;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, HEIGHT / 2 - 80, WIDTH, 160);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  const opponentName = gameMode === 'ai' ? 'AI' : 'Player 2';
  ctx.fillText(playerScore > opponentScore ? 'You Win!' : `${opponentName} Wins!`, WIDTH / 2, HEIGHT / 2 - 10);

  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('Press Play Again or hit Space to restart', WIDTH / 2, HEIGHT / 2 + 30);
}

function render() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const gradient = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    10,
    WIDTH / 2,
    HEIGHT / 2,
    WIDTH / 2
  );
  gradient.addColorStop(0, 'rgba(49, 194, 124, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawNet();

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(player.x, player.y, PADDLE_WIDTH, PADDLE_HEIGHT);
  ctx.fillRect(opponent.x, opponent.y, PADDLE_WIDTH, PADDLE_HEIGHT);

  ctx.beginPath();
  ctx.fillStyle = '#31c27c';
  ctx.shadowColor = '#31c27c';
  ctx.shadowBlur = 15;
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  renderCountdown();
  renderGameOver();
}

function update(time) {
  const delta = (time - lastTime) / 1000 || 0;
  lastTime = time;

  const active = gameState === GameState.PLAYING || gameState === GameState.COUNTDOWN;
  if (active) {
    updatePlayer(delta);
    updateOpponent(delta);
  }

  if (gameState === GameState.COUNTDOWN) {
    updateCountdown(delta);
  } else if (gameState === GameState.PLAYING) {
    updateBall(delta);
  }

  render();
  requestAnimationFrame(update);
}

function handlePointerMove(event) {
  if (!pointerActive) return;
  const rect = canvas.getBoundingClientRect();
  const scaleY = HEIGHT / rect.height;
  const y = (event.clientY - rect.top) * scaleY;
  player.y = clamp(y - PADDLE_HEIGHT / 2, 0, HEIGHT - PADDLE_HEIGHT);
}

canvas.addEventListener('pointerdown', (event) => {
  pointerActive = true;
  canvas.setPointerCapture(event.pointerId);
  handlePointerMove(event);
});

canvas.addEventListener('pointermove', handlePointerMove);

canvas.addEventListener('pointerup', (event) => {
  pointerActive = false;
  if (typeof canvas.hasPointerCapture === 'function' && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
});

canvas.addEventListener('pointerleave', () => {
  pointerActive = false;
});

canvas.addEventListener('pointercancel', () => {
  pointerActive = false;
});

playButton.addEventListener('click', startMatch);

restartButton.addEventListener('click', () => {
  resetScores();
  setStatus('Match reset. Press Start to serve.');
  resetPositions();
  showOverlay('Match reset! Adjust the setup and press Start when ready.');
});

matchForm.addEventListener('change', () => {
  const selectedOpponent = opponentRadios.find((radio) => radio.checked)?.value;
  if (selectedOpponent) {
    gameMode = selectedOpponent;
    opponentLabelEl.textContent = gameMode === 'ai' ? 'AI' : 'Player 2';
  }
  difficulty = difficultySelect.value;
  toggleDifficultyVisibility();
});

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === ' ' || key === 'spacebar') {
    if (gameState === GameState.READY || gameState === GameState.GAME_OVER) {
      event.preventDefault();
      startMatch();
      return;
    }
  }
  keys.add(key);
});

document.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  keys.delete(key);
});

applyMatchSettings();
showOverlay('Ready to play? Configure your match and hit Start.');
setStatus('Press Start to begin.');
updateScoreboard();
resetPositions();
requestAnimationFrame(update);
