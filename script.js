const birdImg = new Image();
birdImg.src = 'images/bird.png';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const birdX = 80;
const birdWidth = 85;
const birdHeight = 85;

const groundHeight = 80;
let groundX = 0;
const groundScrollSpeed = 2;

const pipeWidth = 85;

const basePipeSpeed = 2.5;
const basePipeGap = 280;

let pipeSpeed;
let pipeGap;

let birdY = 250, birdV = 0, gravity = 0.5, jump = -8;
let pipes = [];
let frame = 0;
let score = 0;
let gameOver = false;
let gameStarted = false;
let showStartScreen = true;
let paused = false;

let highScore = parseInt(localStorage.getItem('flappyHighScore') || '0');

// Cloud setup
const cloudCount = 5;
const clouds = [];
for (let i = 0; i < cloudCount; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height - groundHeight - 100),
        speed: 0.2 + Math.random() * 0.3,
        size: 40 + Math.random() * 30,
        type: Math.floor(Math.random() * 3)
    });
}

function drawCloud(cloud) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    switch (cloud.type) {
        case 0:
            ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.5, cloud.y + 10, cloud.size * 0.7, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            break;
        case 1:
            ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - 5, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.5, cloud.y + 5, cloud.size * 0.45, 0, Math.PI * 2);
            break;
        case 2:
            ctx.arc(cloud.x, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.2, cloud.y + cloud.size * 0.5, cloud.size * 0.6, 0, Math.PI * 2);
            break;
    }
    ctx.fill();
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '50px Comic Sans MS';
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, 60);
    ctx.font = 'bold 65px Comic Sans MS';
    ctx.fillText(score, canvas.width / 2, 130);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height - groundHeight);
    skyGradient.addColorStop(0, '#70c5ce');
    skyGradient.addColorStop(1, '#a0d8ef');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height - groundHeight);

    clouds.forEach(drawCloud);

    // Ground
    groundX -= groundScrollSpeed;
    if (groundX <= -canvas.width) groundX = 0;

    ctx.fillStyle = '#ded895';
    ctx.fillRect(groundX, canvas.height - groundHeight, canvas.width, groundHeight);
    ctx.fillRect(groundX + canvas.width, canvas.height - groundHeight, canvas.width, groundHeight);

    // Pipes
    pipes.forEach(pipe => {
        const capHeight = 55;
        ctx.fillStyle = '#228B22';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, pipe.top + pipe.gap, pipeWidth, canvas.height - pipe.top - pipe.gap - groundHeight);

        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, pipe.top - capHeight, pipeWidth + 10, capHeight);
        ctx.fillRect(pipe.x - 5, pipe.top + pipe.gap, pipeWidth + 10, capHeight);
    });

    // Bird
    if (gameStarted) {
        const rotation = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, birdV / 10));
        ctx.save();
        ctx.translate(birdX + birdWidth / 2, birdY + birdHeight / 2);
        ctx.rotate(rotation);
        ctx.drawImage(birdImg, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
        ctx.restore();

        drawScore();
    }

    if (paused) {
        ctx.fillStyle = 'yellow';
        ctx.font = 'bold 70px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    }

    if (showStartScreen && !gameStarted) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 50px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2 - 20);
    } else if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 68px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, 300);
        ctx.font = '42px Comic Sans MS';
        ctx.fillText('Press Space to Restart', canvas.width / 2, 340);
    }
}

function update() {
    if (gameOver || !gameStarted || paused) return;

    birdV += gravity;
    birdY += birdV;

    pipeSpeed = basePipeSpeed + (score * 0.15);
    pipeGap = Math.max(120, basePipeGap - (score * 8));

    if (frame % 90 === 0) {
        const top = Math.random() * 250 + 50;
        pipes.push({ x: canvas.width, top, gap: pipeGap, passed: false });
    }

    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
        if (!pipe.passed && pipe.x + pipeWidth < birdX) {
            score++;
            pipe.passed = true;
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    for (const pipe of pipes) {
        const collidesX = birdX + birdWidth > pipe.x && birdX < pipe.x + pipeWidth;
        const collidesY = birdY < pipe.top || birdY + birdHeight > pipe.top + pipe.gap;
        if (collidesX && collidesY) {
            gameOver = true;
        }
    }

    if (birdY + birdHeight > canvas.height - groundHeight || birdY < 0) {
        gameOver = true;
    }

    if (gameOver && score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
    }

    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.size < 0) {
            cloud.x = canvas.width + cloud.size;
            cloud.y = Math.random() * (canvas.height - groundHeight - 100);
            cloud.speed = 0.2 + Math.random() * 0.3;
            cloud.size = 40 + Math.random() * 30;
            cloud.type = Math.floor(Math.random() * 3);
        }
    });

    frame++;
}

function resetGame() {
    birdY = 250;
    birdV = 0;
    pipes = [];
    frame = 0;
    score = 0;
    gameOver = false;
    gameStarted = false;
    showStartScreen = true;
    groundX = 0;
    paused = false;
}

document.addEventListener('keydown', e => {
    if (!gameStarted && !gameOver && (e.code === 'Space' || e.key === ' ')) {
        gameStarted = true;
        showStartScreen = false;
        return;
    }

    if (e.code === 'Space' || e.key === ' ') {
        if (gameOver) {
            resetGame();
        } else if (paused) {
            paused = false;
        } else {
            birdV = jump;
        }
    }

    if (e.code === 'KeyP' && gameStarted && !gameOver) {
        paused = !paused;
    }
});

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
