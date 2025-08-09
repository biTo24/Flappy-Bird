const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas sizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Images
const birdImg = new Image();
birdImg.src = 'images/bird.png';

const logoImg = new Image();
logoImg.src = 'images/logo.png';

// Constants
const birdX = 80;
const birdWidth = 70;
const birdHeight = 70;
const gravity = 0.5;
const jump = -8;
const pipeGap = 250;
const pipeWidth = 52;
const groundHeight = 80;

// Variables
let birdY = 250, birdV = 0;
let pipes = [];
let frame = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem("flappyHighScore")) || 0;
let totalGames = parseInt(localStorage.getItem("flappyGamesPlayed")) || 0;
let bestStreak = parseInt(localStorage.getItem("flappyBestStreak")) || 0;
let currentStreak = 0;
let gameStarted = false;
let gameOver = false;
let paused = false;
let gameDead = false; // for death animation phase

// Cloud Variables
const clouds = Array.from({ length: 10 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * 120 + 20,
  speed: Math.random() * 0.5 + 0.1,
  type: Math.floor(Math.random() * 10)
}));

// Hill Colors
const hillColors = [
  "#b7e28a", // closest
  "#7fc97f", // mid
  "#4e7c4e"  // farthest
];

// Hills (Parallax)
const hills = [
  { amplitude: 90, frequency: 0.008, speed: 0.5, offset: 0, baseY: canvas.height - groundHeight - 90 },
  { amplitude: 70, frequency: 0.006, speed: 0.3, offset: 100, baseY: canvas.height - groundHeight - 160 },
  { amplitude: 50, frequency: 0.004, speed: 0.15, offset: 200, baseY: canvas.height - groundHeight - 220 }
];

// Draw Sky
function drawSky() {
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw Text Utility
function drawText(text, x, y, size = 24, color = '#fff', align = 'center', bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px Segoe UI`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

// Draw Hills (parallax)
function drawHills() {
  hills.forEach((hill, idx) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, hill.baseY);

    for (let x = 0; x <= canvas.width; x += 2) {
      const wave = Math.sin((x + frame * hill.speed + hill.offset) * hill.frequency) * hill.amplitude;
      ctx.lineTo(x, hill.baseY + wave);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = hillColors[idx];
    ctx.globalAlpha = 0.7 - idx * 0.2;
    ctx.fill();
    ctx.restore();
  });
}

// Update Game State
function update() {
  const pipeSpeed = 3 + score * 0.1;

  if (!gameOver) {
    birdV += gravity;
    birdY += birdV;

    if (frame % 90 === 0) {
      const top = Math.random() * 250 + 50;
      pipes.push({ x: canvas.width, top: top, gap: pipeGap, passed: false });
    }

    pipes.forEach(pipe => {
      pipe.x -= pipeSpeed;

      const hitPipe = birdX + birdWidth > pipe.x &&
        birdX < pipe.x + pipeWidth &&
        (birdY < pipe.top || birdY + birdHeight > pipe.top + pipe.gap);

      if (hitPipe) {
        gameOver = true;
        gameDead = false;
        if (typeof gameOverSound !== 'undefined') {
          gameOverSound.currentTime = 0;
          gameOverSound.play();
        }
        handleGameOver();
      }

      if (!pipe.passed && pipe.x + pipeWidth < birdX) {
        pipe.passed = true;
        score++;
        if (typeof jumpSound !== 'undefined') {
          jumpSound.currentTime = 0;
          jumpSound.play();
        }
      }
    });

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    if (birdY + birdHeight > canvas.height - groundHeight || birdY < 0) {
      gameOver = true;
      gameDead = false;
      if (typeof gameOverSound !== 'undefined') {
        gameOverSound.currentTime = 0;
        gameOverSound.play();
      }
      handleGameOver();
    }

    clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x < -100) {
        cloud.x = canvas.width + Math.random() * 200;
        cloud.y = Math.random() * 120 + 20;
        cloud.speed = Math.random() * 0.5 + 0.1;
        cloud.type = Math.floor(Math.random() * 10);
      }
    });

    frame++;

  } else if (!gameDead) {
    // death animation - bird falls, pipes move
    birdV += gravity;
    birdY += birdV;

    pipes.forEach(pipe => {
      pipe.x -= 3 + score * 0.1;
    });

    if (birdY + birdHeight >= canvas.height - groundHeight) {
      birdY = canvas.height - groundHeight - birdHeight;
      gameDead = true; // freeze animation
    }
  }
}

// Draw Everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawSky();

  clouds.forEach(cloud => {
    drawCloud(cloud.x, cloud.y, cloud.type);
  });

  drawHills();

  pipes.forEach(pipe => {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.top + pipe.gap, pipeWidth, canvas.height - pipe.top - pipe.gap - groundHeight);

    ctx.fillStyle = '#006400';
    ctx.fillRect(pipe.x - 5, pipe.top - 20, pipeWidth + 10, 20);
    ctx.fillRect(pipe.x - 5, pipe.top + pipe.gap, pipeWidth + 10, 20);
  });

  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  const maxRotation = Math.PI / 4;
  const rotation = Math.max(-maxRotation, Math.min(maxRotation, birdV / 10));
  ctx.save();
  ctx.translate(birdX + birdWidth / 2, birdY + birdHeight / 2);
  ctx.rotate(rotation);
  ctx.drawImage(birdImg, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
  ctx.restore();

  if (gameStarted && !gameOver) {
    drawText(score, canvas.width / 2, 80, 70, 'white', 'center', true);
  }

  if (!gameStarted && !gameOver) {
    const logoWidth = 400;
    const logoHeight = 200;
    const logoX = (canvas.width - logoWidth) / 2;
    const logoY = 120;
    ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

    drawText('Press SPACE or TAP to Start', canvas.width / 2, canvas.height / 2 + 50, 48, 'red', 'center', true);
  }

  if (paused) {
    drawText('Game Paused', canvas.width / 2, canvas.height / 2, 48, 'red', 'center', true);
    drawText('Press P or TAP to continue', canvas.width / 2, canvas.height / 2 + 60, 32, 'red', 'center', true);
  }

  if (gameOver) {
    drawStats();
    drawText('Press SPACE or TAP to Restart', canvas.width / 2, canvas.height / 2 + 100, 32, 'red', 'center', true);
  }
}

// Main Loop
function loop() {
  if (!gameStarted || paused || gameDead) {
    draw();
  } else {
    update();
    draw();
  }
  requestAnimationFrame(loop);
}

// Game Over Handling
function handleGameOver() {
  totalGames++;
  localStorage.setItem('flappyGamesPlayed', totalGames);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('flappyHighScore', highScore);
  }

  if (score > bestStreak) {
    bestStreak = score;
    localStorage.setItem('flappyBestStreak', bestStreak);
  }

  currentStreak = score;
  draw();
}

// Draw Stats
function drawStats() {
  drawText(`🎯 Final Score: ${score}`, canvas.width / 2, 160, 36, 'white', 'center', true);
  drawText(`🏆 High Score: ${highScore}`, canvas.width / 2, 210, 36, 'white', 'center', true);
  drawText(`📊 Games Played: ${totalGames}`, canvas.width / 2, 260, 36, 'white', 'center', true);
  drawText(`🔥 Best Streak: ${bestStreak}`, canvas.width / 2, 310, 36, 'white', 'center', true);
}

// Reset Game
function resetGame() {
  birdY = 250;
  birdV = 0;
  pipes = [];
  score = 0;
  frame = 0;
  gameDead = false;
}

// Controls
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    if (!gameStarted) {
      gameStarted = true;
      gameOver = false;
      paused = false;
      resetGame();
      if (typeof bgMusic !== 'undefined') {
        bgMusic.currentTime = 0;
        bgMusic.play();
      }
    } else if (gameOver && gameDead) {
      gameOver = false;
      paused = false;
      resetGame();
      if (typeof bgMusic !== 'undefined') {
        bgMusic.currentTime = 0;
        bgMusic.play();
      }
    } else if (!paused && !gameOver) {
      birdV = jump;
      if (typeof jumpSound !== 'undefined') {
        jumpSound.currentTime = 0;
        jumpSound.play();
      }
    } else if (paused) {
      paused = false;
      if (typeof bgMusic !== 'undefined') bgMusic.play();
      draw();
    }
  } else if (e.code === 'KeyP') {
    if (gameStarted && !gameOver) {
      paused = !paused;
      if (paused) {
        if (typeof bgMusic !== 'undefined') bgMusic.pause();
      } else {
        if (typeof bgMusic !== 'undefined') bgMusic.play();
      }
      draw();
    }
  }
});

// Touch Controls
canvas.addEventListener('touchstart', e => {
  e.preventDefault();

  if (!gameStarted) {
    gameStarted = true;
    gameOver = false;
    paused = false;
    resetGame();
    if (typeof bgMusic !== 'undefined') {
      bgMusic.currentTime = 0;
      bgMusic.play();
    }
  } else if (gameOver && gameDead) {
    gameOver = false;
    paused = false;
    resetGame();
    if (typeof bgMusic !== 'undefined') {
      bgMusic.currentTime = 0;
      bgMusic.play();
    }
  } else if (!paused && !gameOver) {
    birdV = jump;
    if (typeof jumpSound !== 'undefined') {
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  } else if (paused) {
    paused = false;
    if (typeof bgMusic !== 'undefined') bgMusic.play();
    draw();
  }
}, { passive: false });

// Cloud Drawing
function drawCloud(x, y, type) {
  const gradient = ctx.createRadialGradient(x, y, 10, x, y, 50);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
  ctx.shadowBlur = 12;

  ctx.beginPath();
  switch (type) {
    case 0:
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.arc(x + 25, y + 10, 20, 0, Math.PI * 2);
      ctx.arc(x - 25, y + 10, 20, 0, Math.PI * 2);
      break;
    case 1:
      ctx.arc(x - 30, y + 10, 15, 0, Math.PI * 2);
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 30, y + 10, 15, 0, Math.PI * 2);
      break;
    case 2:
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.arc(x, y + 20, 20, 0, Math.PI * 2);
      ctx.arc(x - 20, y + 10, 15, 0, Math.PI * 2);
      ctx.arc(x + 20, y + 10, 15, 0, Math.PI * 2);
      break;
    case 3:
      ctx.arc(x - 25, y + 10, 18, 0, Math.PI * 2);
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 25, y + 10, 18, 0, Math.PI * 2);
      ctx.arc(x, y + 15, 20, 0, Math.PI * 2);
      break;
    case 4:
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 5, 12, 0, Math.PI * 2);
      ctx.arc(x - 18, y + 5, 12, 0, Math.PI * 2);
      break;
    case 5:
      ctx.arc(x - 20, y + 5, 18, 0, Math.PI * 2);
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.arc(x + 20, y + 5, 18, 0, Math.PI * 2);
      ctx.arc(x + 35, y + 15, 14, 0, Math.PI * 2);
      break;
    case 6:
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 15, y + 10, 20, 0, Math.PI * 2);
      ctx.arc(x - 15, y + 10, 20, 0, Math.PI * 2);
      ctx.arc(x + 5, y + 20, 15, 0, Math.PI * 2);
      ctx.arc(x - 5, y + 20, 15, 0, Math.PI * 2);
      break;
    case 7:
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.arc(x + 25, y, 18, 0, Math.PI * 2);
      ctx.arc(x + 12, y + 15, 25, 0, Math.PI * 2);
      ctx.arc(x - 15, y + 10, 18, 0, Math.PI * 2);
      break;
    case 8:
      ctx.arc(x - 30, y + 15, 15, 0, Math.PI * 2);
      ctx.arc(x - 10, y + 5, 20, 0, Math.PI * 2);
      ctx.arc(x + 15, y + 10, 25, 0, Math.PI * 2);
      ctx.arc(x + 35, y + 15, 15, 0, Math.PI * 2);
      break;
    case 9:
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.arc(x - 20, y + 10, 18, 0, Math.PI * 2);
      ctx.arc(x + 20, y + 10, 18, 0, Math.PI * 2);
      ctx.arc(x - 35, y + 20, 12, 0, Math.PI * 2);
      ctx.arc(x + 35, y + 20, 12, 0, Math.PI * 2);
      break;
  }
  ctx.fill();

  ctx.shadowBlur = 0;
}

loop();
