const birdImg = new Image();
birdImg.src = 'images/bird.png';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let birdY = 250, birdV = 0, gravity = 0.5, jump = -8;
let pipes = [];
let frame = 0;
let score = 0;
let gameOver = false;
let gameStarted = false;

function resetGame() {
    birdY = 250;
    birdV = 0;
    pipes = [];
    frame = 0;
    score = 0;
    gameOver = false;
    gameStarted = false;
}

function drawBird() {
    const birdX = 80;
    const birdWidth = 60;
    const birdHeight = 60;

    const maxRotation = Math.PI / 4;
    const rotation = Math.max(-maxRotation, Math.min(maxRotation, birdV / 10));

    ctx.save();
    ctx.translate(birdX + birdWidth / 2, birdY + birdHeight / 2);
    ctx.rotate(rotation);
    ctx.drawImage(birdImg, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
    ctx.restore();
}

function drawPipes() {
    pipes.forEach(pipe => {
        const pipeWidth = 60;
        const capHeight = 20;

        const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        gradient.addColorStop(0, '#228B22');
        gradient.addColorStop(1, '#32CD32');
        ctx.fillStyle = gradient;

        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, pipe.top + pipe.gap, pipeWidth, canvas.height - pipe.top - pipe.gap);

        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, pipe.top - capHeight, pipeWidth + 10, capHeight);
        ctx.fillRect(pipe.x - 5, pipe.top + pipe.gap, pipeWidth + 10, capHeight);
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 42px "Comic Sans MS"';
    ctx.textAlign = 'center';
    ctx.fillText(score, canvas.width / 2, 60);
}

function drawGameOver() {
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px Comic Sans MS';
    ctx.fillText('Game Over', canvas.width / 2, 300);
    ctx.font = '22px Comic Sans MS';
    ctx.fillText('Press Space to Restart', canvas.width / 2, 340);
}

function drawStartScreen() {
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Comic Sans MS';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2);
}

function update() {
    if (gameOver || !gameStarted) return;

    birdV += gravity;
    birdY += birdV;

    if (frame % 90 === 0) {
        let top = Math.random() * 250 + 50;
        pipes.push({ x: canvas.width, top: top, gap: 150, passed: false });
    }

    pipes.forEach(pipe => {
        pipe.x -= 3;
        if (!pipe.passed && pipe.x + 60 < 80) {
            score++;
            pipe.passed = true;
        }
    });

    pipes = pipes.filter(pipe => pipe.x + 60 > 0);

    // Collision detection: bird hits pipe
    pipes.forEach(pipe => {
        if (
            80 + 30 > pipe.x && 80 - 30 < pipe.x + 60 &&
            (birdY - 30 < pipe.top || birdY + 30 > pipe.top + pipe.gap - 20)
        ) {
            gameOver = true;
        }
    });

    // Collision detection: bird hits top or bottom of canvas
    if (birdY + 30 > canvas.height || birdY - 30 < 0) {
        gameOver = true;
    }

    frame++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPipes();

    if (gameStarted) {
        drawBird();
        drawScore();
    }

    if (!gameStarted && !gameOver) drawStartScreen();
    if (gameOver) drawGameOver();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else if (!gameStarted) {
            gameStarted = true;
        } else {
            birdV = jump;
        }
    }
});

loop();