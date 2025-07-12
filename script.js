
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Game variables
        let birdY = 250, birdV = 0, gravity = 0.5, jump = -8;
        let pipes = [];
        let frame = 0;
        let score = 0;
        let gameOver = false;

        function resetGame() {
            birdY = 250;
            birdV = 0;
            pipes = [];
            frame = 0;
            score = 0;
            gameOver = false;
        }

function drawBird() {
    // Body (circle with gradient)
    const gradient = ctx.createRadialGradient(80, birdY, 10, 80, birdY, 25);
    gradient.addColorStop(0, '#FFD700');  // gold
    gradient.addColorStop(1, '#FFA500');  // orange

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(80, birdY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(88, birdY - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(88, birdY - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(100, birdY);
    ctx.lineTo(92, birdY - 4);
    ctx.lineTo(92, birdY + 4);
    ctx.closePath();
    ctx.fill();

    // Wing
    ctx.fillStyle = '#FFCC00';
    ctx.beginPath();
    ctx.ellipse(70, birdY, 10, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
}


function drawPipes() {
    pipes.forEach(pipe => {
        const pipeWidth = 60;
        const capHeight = 20;

        // Gradient body
        const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        gradient.addColorStop(0, '#228B22');  // dark green
        gradient.addColorStop(1, '#32CD32');  // lighter green

        ctx.fillStyle = gradient;

        // Top pipe body
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        // Bottom pipe body
        ctx.fillRect(pipe.x, pipe.top + pipe.gap, pipeWidth, canvas.height - pipe.top - pipe.gap);

        // Pipe cap color
        ctx.fillStyle = '#006400';  // darker green cap

        // Top cap
        ctx.fillRect(pipe.x - 5, pipe.top - capHeight, pipeWidth + 10, capHeight);
        // Bottom cap
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

// "Game Over" text
ctx.font = 'bold 48px Comic Sans MS';
ctx.fillText('Game Over', canvas.width / 2, 300);

// "Press Space to Restart" text
ctx.font = '22px Comic Sans MS';
ctx.fillText('Press Space to Restart', canvas.width / 2, 330);

}


        function update() {
            if (gameOver) return;

            birdV += gravity;
            birdY += birdV;

            if (frame % 90 === 0) {
                let top = Math.random() * 250 + 50;
                pipes.push({ x: canvas.width, top: top, gap: 150, passed: false });
            }

            pipes.forEach(pipe => {
                pipe.x -= 3;
                // Score
                if (!pipe.passed && pipe.x + 60 < 80) {
                    score++;
                    pipe.passed = true;
                }
            });

            // Remove off-screen pipes
            pipes = pipes.filter(pipe => pipe.x + 60 > 0);

            // Collision detection
            pipes.forEach(pipe => {
                if (
                    80 + 20 > pipe.x && 80 - 20 < pipe.x + 60 &&
                    (birdY - 20 < pipe.top || birdY + 20 > pipe.top + pipe.gap)
                ) {
                    gameOver = true;
                }
            });

            // Ground/ceiling collision
            if (birdY + 20 > canvas.height || birdY - 20 < 0) {
                gameOver = true;
            }

            frame++;
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawPipes();
            drawBird();
            drawScore();
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
                } else {
                    birdV = jump;
                }
            }
        });

        loop();