// ===== FLAPPY BIRD CLONE WITH STATS, POLISH, HOMESCREEN, CLOUDS & MOVING SUN =====

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// === Images ===
const birdImg = new Image();
birdImg.src = 'images/bird.png';

const logoImg = new Image();
logoImg.src = 'images/logo.png';

// === Constants ===
const birdX = 80;
const birdWidth = 70;
const birdHeight = 70;
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
let gameLoopActive = false;

// === Sun Movement ===
let sunAngle = 0;
const sunRadius = 40;

// === Cloud Variables ===
const clouds = Array.from({ length: 10 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * 120 + 20,
    speed: Math.random() * 0.5 + 0.1,
    type: Math.floor(Math.random() * 10)
}));

// === Helpers ===
function drawText(text, x, y, size = 24, color = '#fff', align = 'center', bold = false) {
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${size}px Segoe UI`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
}

function drawSun(x, y, radius) {
    ctx.fillStyle = '#FFD93B';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFC300';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        const startX = x + Math.cos(angle) * radius;
        const startY = y + Math.sin(angle) * radius;
        const endX = x + Math.cos(angle) * (radius + 20);
        const endY = y + Math.sin(angle) * (radius + 20);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

// === Game Loop ===
function update() {
    if (gameOver || paused || !gameStarted) return;

    birdV += gravity;
    birdY += birdV;

    const pipeSpeed = 3 + score * 0.1;

    if (frame % 90 === 0) {
        let top = Math.random() * 250 + 50;
        pipes.push({ x: canvas.width, top: top, gap: pipeGap, passed: false });
    }

    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;

        const hitPipe = birdX + birdWidth > pipe.x &&
                        birdX < pipe.x + pipeWidth &&
                        (birdY < pipe.top || birdY + birdHeight > pipe.top + pipe.gap);

        if (hitPipe) {
            gameOver = true;
            handleGameOver();
        }

        if (!pipe.passed && pipe.x + pipeWidth < birdX) {
            pipe.passed = true;
            score++;
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    if (birdY + birdHeight > canvas.height - groundHeight || birdY < 0) {
        gameOver = true;
        handleGameOver();
    }

    // Update clouds
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x < -100) {
            cloud.x = canvas.width + Math.random() * 200;
            cloud.y = Math.random() * 120 + 20;
            cloud.speed = Math.random() * 0.5 + 0.1;
            cloud.type = Math.floor(Math.random() * 10);
        }
    });

    // Update sun angle
    sunAngle += 0.002;
    if (sunAngle > Math.PI * 2) sunAngle -= Math.PI * 2;

    frame++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#70c5ce');
    skyGradient.addColorStop(1, '#a0d8ef');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw moving sun
    const sunX = canvas.width / 2 + Math.cos(sunAngle) * 300;
    const sunY = 150 + Math.sin(sunAngle) * 80;
    drawSun(sunX, sunY, sunRadius);

    // Clouds
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.type);
    });

    // Pipes
    pipes.forEach(pipe => {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, pipe.top + pipe.gap, pipeWidth, canvas.height - pipe.top - pipe.gap - groundHeight);

        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, pipe.top - 20, pipeWidth + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.top + pipe.gap, pipeWidth + 10, 20);
    });

    // Ground
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    // Bird
    const maxRotation = Math.PI / 4;
    const rotation = Math.max(-maxRotation, Math.min(maxRotation, birdV / 10));
    ctx.save();
    ctx.translate(birdX + birdWidth / 2, birdY + birdHeight / 2);
    ctx.rotate(rotation);
    ctx.drawImage(birdImg, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
    ctx.restore();

    // Score
    if (gameStarted && !gameOver) {
        drawText(score, canvas.width / 2, 80, 70, 'white', 'center', true);
    }

    // UI: Homescreen logo & prompt
    if (!gameStarted && !gameOver) {
        const logoWidth = 400;
        const logoHeight = 200;
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = 120;
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

        drawText('Press SPACE to Start', canvas.width / 2, canvas.height / 2 + 50, 48, 'red', 'center', true);
    }

    if (paused) {
        drawText('Paused', canvas.width / 2, canvas.height / 2, 48, 'yellow', 'center', true);
    }

    if (gameOver) {
        drawStats();
        drawText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 100, 32, 'red', 'center', true);
    }
}

function loop() {
    if (!gameStarted || paused || gameOver) return;
    update();
    draw();
    requestAnimationFrame(loop);
}

function handleGameOver() {
    gameLoopActive = false;
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
    drawText(`🎯 Final Score: ${score}`, canvas.width / 2, 160, 36, 'white', 'center', true);
    drawText(`🏆 High Score: ${highScore}`, canvas.width / 2, 210, 36, 'white', 'center', true);
    drawText(`📊 Games Played: ${totalGames}`, canvas.width / 2, 260, 36, 'white', 'center', true);
    drawText(`🔥 Best Streak: ${bestStreak}`, canvas.width / 2, 310, 36, 'white', 'center', true);
}

// === Controls ===
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        if (!gameStarted) {
            gameStarted = true;
            gameOver = false;
            paused = false;
            resetGame();
            gameLoopActive = true;
            loop();
        } else if (gameOver) {
            gameOver = false;
            paused = false;
            resetGame();
            gameLoopActive = true;
            loop();
        } else if (!paused) {
            birdV = jump;
        }
    }

    if (e.code === 'KeyP' && gameStarted && !gameOver) {
        paused = !paused;
        if (!paused && gameLoopActive) {
            loop();
        } else {
            draw();
        }
    }
});

function resetGame() {
    birdY = 250;
    birdV = 0;
    pipes = [];
    score = 0;
    frame = 0;
    sunAngle = 0;
}

// === Cloud Draw Function ===
function drawCloud(x, y, type) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    switch (type) {
        case 0: ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.arc(x + 25, y + 10, 20, 0, Math.PI * 2);
                ctx.arc(x - 25, y + 10, 20, 0, Math.PI * 2); break;
        case 1: ctx.arc(x - 30, y + 10, 15, 0, Math.PI * 2);
                ctx.arc(x, y, 25, 0, Math.PI * 2);
                ctx.arc(x + 30, y + 10, 15, 0, Math.PI * 2); break;
        case 2: ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.arc(x, y + 20, 20, 0, Math.PI * 2);
                ctx.arc(x - 20, y + 10, 15, 0, Math.PI * 2);
                ctx.arc(x + 20, y + 10, 15, 0, Math.PI * 2); break;
        case 3: ctx.arc(x - 25, y + 10, 18, 0, Math.PI * 2);
                ctx.arc(x, y, 25, 0, Math.PI * 2);
                ctx.arc(x + 25, y + 10, 18, 0, Math.PI * 2);
                ctx.arc(x, y + 15, 20, 0, Math.PI * 2); break;
        case 4: ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.arc(x + 18, y + 5, 12, 0, Math.PI * 2);
                ctx.arc(x - 18, y + 5, 12, 0, Math.PI * 2); break;
        case 5: ctx.arc(x - 20, y + 5, 18, 0, Math.PI * 2);
                ctx.arc(x, y, 22, 0, Math.PI * 2);
                ctx.arc(x + 20, y + 5, 18, 0, Math.PI * 2);
                ctx.arc(x + 35, y + 15, 14, 0, Math.PI * 2); break;
        case 6: ctx.arc(x, y, 25, 0, Math.PI * 2);
                ctx.arc(x + 15, y + 10, 20, 0, Math.PI * 2);
                ctx.arc(x - 15, y + 10, 20, 0, Math.PI * 2);
                ctx.arc(x + 5, y + 20, 15, 0, Math.PI * 2);
                ctx.arc(x - 5, y + 20, 15, 0, Math.PI * 2); break;
        case 7: ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.arc(x + 25, y, 18, 0, Math.PI * 2);
                ctx.arc(x + 12, y + 15, 25, 0, Math.PI * 2);
                ctx.arc(x - 15, y + 10, 18, 0, Math.PI * 2); break;
        case 8: ctx.arc(x - 30, y + 15, 15, 0, Math.PI * 2);
                ctx.arc(x - 10, y + 5, 20, 0, Math.PI * 2);
                ctx.arc(x + 15, y + 10, 25, 0, Math.PI * 2);
                ctx.arc(x + 35, y + 15, 15, 0, Math.PI * 2); break;
        case 9: ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.arc(x - 20, y + 10, 18, 0, Math.PI * 2);
                ctx.arc(x + 20, y + 10, 18, 0, Math.PI * 2);
                ctx.arc(x - 35, y + 20, 12, 0, Math.PI * 2);
                ctx.arc(x + 35, y + 20, 12, 0, Math.PI * 2); break;
    }
    ctx.fill();
}
