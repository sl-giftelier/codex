const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const restartButton = document.getElementById('restart');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 14;
const PADDLE_HEIGHT = 90;
const BALL_RADIUS = 8;
const WINNING_SCORE = 10;

const player = {
  x: 24,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  vy: 0,
};

const ai = {
  x: WIDTH - PADDLE_WIDTH - 24,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  vy: 0,
};

const ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  speed: 6,
  angle: Math.random() * Math.PI / 3 - Math.PI / 6,
  direction: Math.random() > 0.5 ? 1 : -1,
};

const keys = new Set();
let lastTime = 0;
let playerScore = 0;
let aiScore = 0;
let isGameOver = false;

function resetBall(servingPlayer = Math.random() > 0.5 ? 1 : -1) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.speed = 6;
  ball.angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
  ball.direction = servingPlayer;
}

function resetGame() {
  playerScore = 0;
  aiScore = 0;
  isGameOver = false;
  updateScoreboard();
  player.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
  ai.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
  resetBall(Math.random() > 0.5 ? 1 : -1);
}

function updateScoreboard() {
  playerScoreEl.textContent = playerScore;
  aiScoreEl.textContent = aiScore;
}

function updatePlayer(delta) {
  let direction = 0;
  if (keys.has('ArrowUp') || keys.has('w')) direction -= 1;
  if (keys.has('ArrowDown') || keys.has('s')) direction += 1;

  const speed = 420;
  player.y += direction * speed * delta;
  player.y = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, player.y));
}

function updateAI(delta) {
  const target = ball.y - PADDLE_HEIGHT / 2;
  const reactionSpeed = 280;
  const easing = 0.12;

  const difference = target - ai.y;
  const move = difference * easing;
  ai.y += Math.sign(move) * Math.min(Math.abs(move), reactionSpeed * delta);
  ai.y = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, ai.y));
}

function updateBall(delta) {
  const vx = Math.cos(ball.angle) * ball.speed * ball.direction;
  const vy = Math.sin(ball.angle) * ball.speed;

  ball.x += vx * delta * 60;
  ball.y += vy * delta * 60;

  if (ball.y - BALL_RADIUS <= 0 || ball.y + BALL_RADIUS >= HEIGHT) {
    ball.angle = -ball.angle;
    ball.y = Math.max(BALL_RADIUS, Math.min(HEIGHT - BALL_RADIUS, ball.y));
  }

  // Player paddle collision
  if (
    ball.x - BALL_RADIUS <= player.x + PADDLE_WIDTH &&
    ball.y >= player.y &&
    ball.y <= player.y + PADDLE_HEIGHT &&
    ball.x > player.x
  ) {
    reflectFromPaddle(player);
  }

  // AI paddle collision
  if (
    ball.x + BALL_RADIUS >= ai.x &&
    ball.y >= ai.y &&
    ball.y <= ai.y + PADDLE_HEIGHT &&
    ball.x < ai.x + PADDLE_WIDTH
  ) {
    reflectFromPaddle(ai);
  }

  if (ball.x < 0) {
    aiScore += 1;
    checkWin();
    resetBall(1);
  }

  if (ball.x > WIDTH) {
    playerScore += 1;
    checkWin();
    resetBall(-1);
  }
}

function reflectFromPaddle(paddle) {
  const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
  const relativeIntersect = ball.y - paddleCenter;
  const normalized = relativeIntersect / (PADDLE_HEIGHT / 2);
  const maxBounceAngle = (75 * Math.PI) / 180;
  ball.angle = normalized * maxBounceAngle;
  ball.direction *= -1;
  ball.speed = Math.min(ball.speed + 0.4, 14);
}

function checkWin() {
  if (playerScore >= WINNING_SCORE || aiScore >= WINNING_SCORE) {
    isGameOver = true;
  }
  updateScoreboard();
}

function drawNet() {
  ctx.setLineDash([10, 12]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 20);
  ctx.lineTo(WIDTH / 2, HEIGHT - 20);
  ctx.stroke();
  ctx.setLineDash([]);
}

function render() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const gradient = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 10, WIDTH / 2, HEIGHT / 2, WIDTH / 2);
  gradient.addColorStop(0, 'rgba(49, 194, 124, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawNet();

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(player.x, player.y, PADDLE_WIDTH, PADDLE_HEIGHT);
  ctx.fillRect(ai.x, ai.y, PADDLE_WIDTH, PADDLE_HEIGHT);

  ctx.beginPath();
  ctx.fillStyle = '#31c27c';
  ctx.shadowColor = '#31c27c';
  ctx.shadowBlur = 15;
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (isGameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, HEIGHT / 2 - 60, WIDTH, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      playerScore > aiScore ? 'You Win!' : 'AI Wins!',
      WIDTH / 2,
      HEIGHT / 2
    );

    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Press Restart to play again', WIDTH / 2, HEIGHT / 2 + 36);
  }
}

function update(time) {
  const delta = (time - lastTime) / 1000 || 0;
  lastTime = time;

  if (!isGameOver) {
    updatePlayer(delta);
    updateAI(delta);
    updateBall(delta);
  }

  render();
  requestAnimationFrame(update);
}

restartButton.addEventListener('click', resetGame);

document.addEventListener('keydown', (event) => {
  keys.add(event.key);
});

document.addEventListener('keyup', (event) => {
  keys.delete(event.key);
});

resetGame();
requestAnimationFrame(update);
