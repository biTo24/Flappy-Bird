// ===== FLAPPY BIRD CLONE WITH STATS & POLISH =====

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// === Images ===
const birdImg = new Image();
birdImg.src = 'images/bird.png';

// === Constants ===
const birdX = 80;
const birdWidth = 60;
const birdHeight = 60;
const gravity = 0.5;
const jump = -8;
const pipeGap = 150;
const pipeWidth = 52;
const groundHeight = 80;

// === Variables ===
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

// === Helpers ===
function drawText(text, x, y, size = 24, color = '#fff', align = 'center', bold = false) {
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${size}px Segoe UI`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
}

// === Game Loop ===
function update() {
    if (gameOver || paused || !gameStarted) return;

    birdV += gravity;
    birdY += birdV;

    // Pipe speed scales with score for difficulty increase
    const pipeSpeed = 3 + score * 0.1;

    if (frame % 90 === 0) {
        let top = Math.random() * 250 + 50;
        pipes.push({ x: canvas.width, top: top, gap: pipeGap, passed: false });
    }

    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;

        // Collision check
        if (
            birdX + birdWidth > pipe.x && birdX < pipe.x + pipeWidth &&
            (birdY < pipe.top || birdY + birdHeight > pipe.top + pipe.gap)
        ) {
            gameOver = true;
            handleGameOver();
        }

        // Passed pipe check
        if (!pipe.passed && pipe.x + pipeWidth < birdX) {
            pipe.passed = true;
            score++;
        }
    });

    // Remove offscreen pipes
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    // Ground and ceiling collision
    if (birdY + birdHeight > canvas.height - groundHeight || birdY < 0) {
        gameOver = true;
        handleGameOver();
    }

    frame++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient (sky)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#70c5ce');
    skyGradient.addColorStop(1, '#a0d8ef');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pipes
    pipes.forEach(pipe => {
        // Pipe top
        ctx.fillStyle = '#228B22';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        // Pipe bottom
        ctx.fillRect(pipe.x, pipe.top + pipe.gap, pipeWidth, canvas.height - pipe.top - pipe.gap - groundHeight);

        // Pipe caps
        ctx.fillStyle = '#006400';
        const capHeight = 20;
        ctx.fillRect(pipe.x - 5, pipe.top - capHeight, pipeWidth + 10, capHeight);
        ctx.fillRect(pipe.x - 5, pipe.top + pipe.gap, pipeWidth + 10, capHeight);
    });

    // Draw ground
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    // Draw bird with rotation based on velocity (clamp between -45deg and 45deg)
    const maxRotation = Math.PI / 4; // 45 degrees
    const rotation = Math.max(-maxRotation, Math.min(maxRotation, birdV / 10));
    ctx.save();
    ctx.translate(birdX + birdWidth / 2, birdY + birdHeight / 2);
    ctx.rotate(rotation);
    ctx.drawImage(birdImg, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
    ctx.restore();

    // Draw score top-left
    drawText(score, 20, 50, 40, 'white', 'left', true);

    if (!gameStarted && !gameOver) {
        // Start screen
        drawText('Press SPACE to Start', canvas.width / 2, canvas.height / 2 - 20, 36, 'red', 'center', true);
        drawText('Press P to Pause/Resume during game', canvas.width / 2, canvas.height / 2 + 30, 18, 'white', 'center');
        return;
    }

    if (paused) {
        drawText('Paused', canvas.width / 2, canvas.height / 2, 48, 'yellow', 'center', true);
        return;
    }

    if (gameOver) {
        drawStats();
        drawText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 60, 28, 'red', 'center', true);
        return;
    }

    requestAnimationFrame(loop);
}

function loop() {
    update();
    draw();
}

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

function drawStats() {
    drawText(`🎯 Final Score: ${score}`, canvas.width / 2, 150, 28, 'white', 'center', true);
    drawText(`🏆 High Score: ${highScore}`, canvas.width / 2, 190, 28, 'white', 'center', true);
    drawText(`📊 Games Played: ${totalGames}`, canvas.width / 2, 230, 28, 'white', 'center', true);
    drawText(`🔥 Best Streak: ${bestStreak}`, canvas.width / 2, 270, 28, 'white', 'center', true);
}

// === Controls ===
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        if (!gameStarted) {
            gameStarted = true;
            gameOver = false;
            paused = false;
            resetGame();
            loop();
        } else if (gameOver) {
            gameOver = false;
            paused = false;
            resetGame();
            loop();
        } else if (!paused) {
            birdV = jump;
        }
    }

    if (e.code === 'KeyP' && gameStarted && !gameOver) {
        paused = !paused;
        draw(); // redraw paused state immediately
    }
});

function resetGame() {
    birdY = 250;
    birdV = 0;
    pipes = [];
    score = 0;
    frame = 0;
}
