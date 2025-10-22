(function initPingPong() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas?.getContext('2d');
  const playerScoreEl = document.getElementById('playerScore');
  const aiScoreEl = document.getElementById('aiScore');
  const messageBox = document.getElementById('messageBox');
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const actionButton = document.getElementById('actionButton');
  const container = document.getElementById('gameContainer');

  if (!canvas || !ctx || !playerScoreEl || !aiScoreEl || !messageBox || !messageTitle || !messageText || !actionButton || !container) {
    console.error('Ping Pong setup is missing required elements.');
    return;
  }

  const PADDLE_WIDTH = 10;
  const PADDLE_HEIGHT = 100;
  const BALL_RADIUS = 7;
  const WINNING_SCORE = 5;
  const BALL_SPEED_START = 320;
  const BALL_SPEED_INCREMENT = 12;
  const MAX_BALL_SPEED = 680;
  const AI_REACTION = 0.08;

  const player = {
    x: 0,
    y: 0,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
  };

  const ai = {
    x: 0,
    y: 0,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
  };

  const ball = {
    x: 0,
    y: 0,
    radius: BALL_RADIUS,
    speed: BALL_SPEED_START,
    dx: 0,
    dy: 0,
  };

  let pointerActive = false;
  let lastPointerY = 0;
  let playerScore = 0;
  let aiScore = 0;
  let gameRunning = false;
  let animationId = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function showMessage(title, text, buttonLabel) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    actionButton.textContent = buttonLabel;
    messageBox.style.display = 'block';
  }

  function hideMessage() {
    messageBox.style.display = 'none';
  }

  function updateScoreboard() {
    playerScoreEl.textContent = String(playerScore);
    aiScoreEl.textContent = String(aiScore);
  }

  function resetScores() {
    playerScore = 0;
    aiScore = 0;
    updateScoreboard();
  }

  function resetBall(servingLeft = true) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = BALL_SPEED_START;
    const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8;
    const direction = servingLeft ? -1 : 1;
    ball.dx = Math.cos(angle) * ball.speed * direction;
    ball.dy = Math.sin(angle) * ball.speed;
  }

  function resetPositions() {
    player.x = 10;
    player.y = canvas.height / 2 - player.height / 2;
    ai.x = canvas.width - ai.width - 10;
    ai.y = canvas.height / 2 - ai.height / 2;
  }

  function resizeCanvas() {
    const maxWidth = 854;
    const aspectRatio = 16 / 9;
    const containerWidth = container.clientWidth;
    const targetWidth = Math.min(containerWidth * 0.9, maxWidth);
    canvas.width = targetWidth;
    canvas.height = canvas.width / aspectRatio;
    resetPositions();
    resetBall(Math.random() > 0.5);
    render();
  }

  function collision(ballEntity, paddle) {
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;

    const ballTop = ballEntity.y - ballEntity.radius;
    const ballBottom = ballEntity.y + ballEntity.radius;
    const ballLeft = ballEntity.x - ballEntity.radius;
    const ballRight = ballEntity.x + ballEntity.radius;

    return ballRight > paddleLeft && ballLeft < paddleRight && ballBottom > paddleTop && ballTop < paddleBottom;
  }

  function update(delta) {
    if (!gameRunning) {
      return;
    }

    const deltaSeconds = delta / 1000;

    // Update player position
    player.y = clamp(player.y + player.dy * deltaSeconds, 0, canvas.height - player.height);

    // Update AI paddle
    const target = ball.y - ai.height / 2;
    ai.y += (target - ai.y) * AI_REACTION;
    ai.y = clamp(ai.y, 0, canvas.height - ai.height);

    // Move the ball
    ball.x += ball.dx * deltaSeconds;
    ball.y += ball.dy * deltaSeconds;

    // Collision with top/bottom
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
      ball.dy = -ball.dy;
      ball.y = clamp(ball.y, ball.radius, canvas.height - ball.radius);
    }

    // Paddle collisions
    const currentPaddle = ball.x < canvas.width / 2 ? player : ai;
    if (collision(ball, currentPaddle)) {
      const collidePoint = ball.y - (currentPaddle.y + currentPaddle.height / 2);
      const normalized = collidePoint / (currentPaddle.height / 2);
      const bounceAngle = normalized * (Math.PI / 4);
      const direction = ball.x < canvas.width / 2 ? 1 : -1;

      ball.speed = clamp(ball.speed + BALL_SPEED_INCREMENT, BALL_SPEED_START, MAX_BALL_SPEED);
      ball.dx = direction * ball.speed * Math.cos(bounceAngle);
      ball.dy = ball.speed * Math.sin(bounceAngle);
      ball.x = currentPaddle === player ? player.x + player.width + ball.radius : ai.x - ball.radius;
    }

    // Scoring
    if (ball.x + ball.radius < 0) {
      aiScore += 1;
      updateScoreboard();
      checkForWinner();
      if (gameRunning) {
        resetPositions();
        resetBall(false);
      }
    } else if (ball.x - ball.radius > canvas.width) {
      playerScore += 1;
      updateScoreboard();
      checkForWinner();
      if (gameRunning) {
        resetPositions();
        resetBall(true);
      }
    }
  }

  function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#555';
    const segmentHeight = 12;
    const segmentGap = 16;
    for (let y = 0; y < canvas.height; y += segmentHeight + segmentGap) {
      ctx.fillRect(canvas.width / 2 - 1, y, 2, segmentHeight);
    }

    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(ai.x, ai.y, ai.width, ai.height);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  function gameLoop(timestamp) {
    animationId = requestAnimationFrame(gameLoop);
    const delta = timestamp - (gameLoop.lastTime || timestamp);
    gameLoop.lastTime = timestamp;
    update(delta);
    render();
  }

  function startGame() {
    resetScores();
    resetPositions();
    resetBall(Math.random() > 0.5);
    pointerActive = false;
    player.dy = 0;
    hideMessage();
    gameRunning = true;
    gameLoop.lastTime = undefined;
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
  }

  function endGame(winner) {
    gameRunning = false;
    showMessage(winner, `Final Score: ${playerScore} - ${aiScore}`, 'Play Again');
  }

  function checkForWinner() {
    if (playerScore >= WINNING_SCORE || aiScore >= WINNING_SCORE) {
      const winner = playerScore > aiScore ? 'You Win!' : 'AI Wins!';
      endGame(winner);
    }
  }

  function handlePointerMove(event) {
    if (!gameRunning) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const clientY = event.clientY ?? (event.touches ? event.touches[0].clientY : lastPointerY);
    lastPointerY = clientY;
    const relativeY = clientY - rect.top;
    player.y = clamp(relativeY - player.height / 2, 0, canvas.height - player.height);
  }

  function handlePointerDown(event) {
    pointerActive = true;
    canvas.setPointerCapture?.(event.pointerId);
    handlePointerMove(event);
  }

  function handlePointerUp(event) {
    pointerActive = false;
    player.dy = 0;
    if (event.pointerId !== undefined) {
      canvas.releasePointerCapture?.(event.pointerId);
    }
  }

  function handleKey(event) {
    if (!gameRunning) {
      return;
    }

    const isKeyDown = event.type === 'keydown';
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
      player.dy = isKeyDown ? -520 : 0;
      event.preventDefault();
    } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
      player.dy = isKeyDown ? 520 : 0;
      event.preventDefault();
    }
  }

  function handleResize() {
    const wasRunning = gameRunning;
    resizeCanvas();
    if (!wasRunning) {
      render();
    }
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKey);
  window.addEventListener('keyup', handleKey);

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', (event) => {
    if (pointerActive) {
      handlePointerMove(event);
    }
  });
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
  canvas.addEventListener('pointerleave', handlePointerUp);

  canvas.addEventListener('mousemove', (event) => {
    if (!pointerActive) {
      handlePointerMove(event);
    }
  });

  canvas.addEventListener('touchmove', (event) => {
    if (!gameRunning) {
      return;
    }
    event.preventDefault();
    const touch = event.touches[0];
    if (touch) {
      handlePointerMove(touch);
    }
  }, { passive: false });

  actionButton.addEventListener('click', () => {
    if (gameRunning) {
      return;
    }
    startGame();
  });

  showMessage('Ping Pong', 'First to 5 points wins!', 'Start Game');
  resizeCanvas();
  animationId = requestAnimationFrame(gameLoop);
})();
