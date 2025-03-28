const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elements
const playerForm = document.getElementById('playerForm');
const playerNameInput = document.getElementById('playerName');
const startGameButton = document.getElementById('startGame');
const currentScoreDisplay = document.getElementById('currentScore');
const leaderboardList = document.getElementById('leaderboardList');

// Tải âm thanh
const flapSounds = [
    new Audio('sounds/flapsound1.mp3'),
    new Audio('sounds/flapsound2.mp3')
];
const endSounds = [
    new Audio('sounds/endsound1.mp3'),
    new Audio('sounds/endsound2.mp3')
];

// Hàm phát âm thanh flap ngẫu nhiên
function playRandomFlapSound() {
    const randomSound = flapSounds[Math.floor(Math.random() * flapSounds.length)];
    randomSound.currentTime = 0; // Reset âm thanh về đầu
    randomSound.play();
}

// Hàm phát âm thanh kết thúc ngẫu nhiên
function playRandomEndSound() {
    const randomEndSound = endSounds[Math.floor(Math.random() * endSounds.length)];
    randomEndSound.currentTime = 0;
    randomEndSound.play();
}

// Tải ảnh background
const backgroundImage = new Image();
backgroundImage.src = 'images/back.jpg';

// Tải các ảnh chim
const birdImages = {
    bird1: new Image(),
    bird2: new Image(),
    bird3: new Image(),
    bird4: new Image(),
    bird5: new Image()
};

const pipeImages = {
    top: new Image(),
    bottom: new Image()
};

// Load ảnh chim
birdImages.bird1.src = 'images/bird1.png';
birdImages.bird2.src = 'images/bird2.png';
birdImages.bird3.src = 'images/bird3.png';
birdImages.bird4.src = 'images/bird4.png';
birdImages.bird5.src = 'images/bird5.png';

// Load ảnh ống
pipeImages.top.src = 'images/pipe-top.png';
pipeImages.bottom.src = 'images/pipe-bottom.png';

// Kích thước game
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// Các thông số của chim
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 40;
const BIRD_X = 80;
const BIRD_START_Y = GAME_HEIGHT / 2;
const GRAVITY = 0.125;
const JUMP_FORCE = -4;

// Các thông số của ống
const PIPE_WIDTH = 70;
const PIPE_GAP = 200;
const PIPE_SPEED = 2;
const PIPE_SPAWN_DISTANCE = 240;

// Khởi tạo game state
let bird = {
    x: BIRD_X,
    y: BIRD_START_Y,
    velocity: 0,
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
    currentBird: 'bird1'
};

let playerName = '';
let pipes = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let highScores = JSON.parse(localStorage.getItem('flappyBirdHighScores')) || {};

// Cập nhật điểm cao
function updateHighScore() {
    if (!playerName) return;
    
    if (!highScores[playerName] || score > highScores[playerName]) {
        highScores[playerName] = score;
        localStorage.setItem('flappyBirdHighScores', JSON.stringify(highScores));
    }
    
    updateLeaderboard();
}

// Cập nhật bảng xếp hạng
function updateLeaderboard() {
    const sortedScores = Object.entries(highScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    leaderboardList.innerHTML = '';

    sortedScores.forEach(([name, score], index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span class="leaderboard-rank">${index + 1}</span>
            <span class="leaderboard-name">${name}</span>
            <span class="leaderboard-score">${score}</span>
        `;
        leaderboardList.appendChild(item);
    });
}

// Xử lý form nhập tên
startGameButton.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        playerName = name;
        playerForm.style.display = 'none';
        updateLeaderboard();
    } else {
        alert('Vui lòng nhập tên của bạn!');
    }
});

// Xử lý chọn chim
const birdOptions = document.querySelectorAll('.bird-option');
birdOptions.forEach(option => {
    option.addEventListener('click', () => {
        bird.currentBird = option.dataset.bird;
        birdOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
    });
});

// Khởi tạo ống đầu tiên
function initPipes() {
    const gapY = Math.random() * (GAME_HEIGHT - PIPE_GAP - 200) + 100;
    pipes.push({
        x: GAME_WIDTH,
        gapY: gapY,
        passed: false,
        topHeight: gapY,
        bottomY: gapY + PIPE_GAP
    });
}

// Vẽ chim
function drawBird() {
    const birdImage = birdImages[bird.currentBird];
    if (birdImage.complete) {
        ctx.save();
        const rotation = Math.min(Math.max(bird.velocity * 0.1, -0.5), 0.5);
        ctx.translate(bird.x, bird.y);
        ctx.rotate(rotation);
        ctx.drawImage(birdImage, -BIRD_WIDTH/2, -BIRD_HEIGHT/2, BIRD_WIDTH, BIRD_HEIGHT);
        ctx.restore();
    }
}

// Vẽ ống
function drawPipes() {
    pipes.forEach(pipe => {
        // Vẽ ống trên (lật ngược)
        ctx.save();
        ctx.translate(pipe.x + PIPE_WIDTH/2, pipe.topHeight/2);
        ctx.rotate(Math.PI);
        ctx.drawImage(pipeImages.top, 
            -PIPE_WIDTH/2, -pipe.topHeight/2, 
            PIPE_WIDTH, pipe.topHeight);
        ctx.restore();

        // Vẽ ống dưới
        ctx.drawImage(pipeImages.bottom,
            pipe.x, pipe.bottomY,
            PIPE_WIDTH, GAME_HEIGHT - pipe.bottomY);
    });
}

// Vẽ màn hình game over
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    ctx.font = '24px Arial';
    ctx.fillText(`${playerName} - Điểm cuối: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    ctx.fillText('Nhấn SPACE để chơi lại', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
}

// Kiểm tra va chạm
function checkCollision() {
    const birdRadius = BIRD_WIDTH / 2;
    if (bird.y - birdRadius < 0 || bird.y + birdRadius > GAME_HEIGHT) {
        return true;
    }

    for (let pipe of pipes) {
        if (bird.x + birdRadius > pipe.x && bird.x - birdRadius < pipe.x + PIPE_WIDTH) {
            if (bird.y - birdRadius < pipe.gapY || bird.y + birdRadius > pipe.gapY + PIPE_GAP) {
                return true;
            }
        }
    }

    return false;
}

// Cập nhật trạng thái game
function update() {
    if (!gameStarted || gameOver || !playerName) return;

    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    pipes.forEach(pipe => {
        pipe.x -= PIPE_SPEED;
    });

    pipes = pipes.filter(pipe => pipe.x > -PIPE_WIDTH);

    if (pipes.length === 0 || pipes[pipes.length - 1].x < GAME_WIDTH - PIPE_SPAWN_DISTANCE) {
        initPipes();
    }

    pipes.forEach(pipe => {
        if (!pipe.passed && pipe.x < bird.x) {
            score++;
            currentScoreDisplay.textContent = score;
            pipe.passed = true;
            if (score > (highScores[playerName] || 0)) {
                updateHighScore();
            }
        }
    });

    if (checkCollision()) {
        gameOver = true;
        updateHighScore();
        playRandomEndSound(); // Thay đổi từ playEndSound sang playRandomEndSound
    }
}

// Vẽ game
function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Vẽ background
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    if (!playerName) {
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Vui lòng nhập tên để bắt đầu', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        return;
    }

    drawPipes();
    drawBird();

    if (gameOver) {
        drawGameOver();
    } else if (!gameStarted) {
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nhấn SPACE để bắt đầu', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Xử lý sự kiện nhấn phím
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && playerName) {
        if (!gameStarted) {
            gameStarted = true;
        }
        if (gameOver) {
            bird.y = BIRD_START_Y;
            bird.velocity = 0;
            pipes = [];
            score = 0;
            currentScoreDisplay.textContent = '0';
            gameOver = false;
            initPipes();
        } else {
            bird.velocity = JUMP_FORCE;
            playRandomFlapSound(); // Phát âm thanh khi nhảy
        }
    }
});

// Xử lý sự kiện chạm màn hình
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!playerName) return;

    if (!gameStarted) {
        gameStarted = true;
    }
    if (gameOver) {
        bird.y = BIRD_START_Y;
        bird.velocity = 0;
        pipes = [];
        score = 0;
        currentScoreDisplay.textContent = '0';
        gameOver = false;
        initPipes();
    } else {
        bird.velocity = JUMP_FORCE;
        playRandomFlapSound(); // Phát âm thanh khi nhảy trên thiết bị cảm ứng
    }
});

// Khởi tạo game
initPipes();
updateLeaderboard();
gameLoop();
