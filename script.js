// Get the canvas and set its dimensions
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 360; // Default size
canvas.height = 640;

let gameRunning = false;
let player, zombies, score, level, boss;
let gameOver = false;
let maxLevels = 10;
let isBossLevel = false;

let keys = {};
let bullets = [];
let lastShot = 0; // To limit the rate of shooting
let shootDelay = 300; // Delay between shots in milliseconds

// Preload images and sounds
let zombieImage = new Image();
zombieImage.src = '103086822.png'; // Replace with the actual path to your zombie image

let playerImage = new Image();  // Add this line for player image
playerImage.src = 'WhatsApp Image 2024-09-14 at 21.46.30_8707e13b.png'; // Replace with actual path to your player image

// Preload images and sounds
let bulletImage = new Image();
bulletImage.src = 'hqdefault-removebg-preview.png'; // Replace with actual path to your bullet image

let backgroundMusic = new Audio('path_to_your_background_music.mp3');
let attackSound = new Audio('machin-gun-mgs2-sound-effect-8-11006.mp3');
let zombieDeathSound = new Audio('path_to_your_zombie_death_sound.mp3');

// Add event listeners for game start and retry
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('retry-button').addEventListener('click', restartGame);

// Get the full-screen button element
const fullscreenButton = document.getElementById('fullscreen-button');

// Add event listener for the full-screen button
fullscreenButton.addEventListener('click', toggleFullScreen);

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        // Request full screen for the canvas's parent element or the whole body
        document.documentElement.requestFullscreen()
            .then(() => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            })
            .catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
    } else {
        // Exit full-screen mode
        document.exitFullscreen();
    }
}

// Adjust canvas size on window resize (for responsiveness)
window.addEventListener('resize', () => {
    if (document.fullscreenElement) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = 360; // Default size when not in full-screen
        canvas.height = 640;
    }
});

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    
    // Add shooting mechanic for "f"
    if (e.key === 'f' && gameRunning && Date.now() - lastShot > shootDelay) {
        shootBullet();
        lastShot = Date.now(); // Record time of the shot
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Separate controls for mobile and desktop
if (isMobile()) {
    // Touch-based controls for mobile
    canvas.addEventListener('touchstart', function(e) {
        let touchX = e.touches[0].clientX;
        let touchY = e.touches[0].clientY;

        if (touchY < canvas.height / 2) player.y -= player.speed;
        else player.y += player.speed;

        if (touchX < canvas.width / 2) player.x -= player.speed;
        else player.x += player.speed;

        shootBullet();  // Shoot bullet on touch
    });}
function startGame() {
    document.getElementById('start-menu').style.display = 'none';
    canvas.style.display = 'block';
    gameRunning = true;
    playBackgroundMusic();
    initializeGame();
}

function restartGame() {
    document.getElementById('retry-menu').style.display = 'none';
    canvas.style.display = 'block';
    gameRunning = true;
    gameOver = false;
    initializeGame();
}

// Game initialization
function initializeGame() {
    player = { 
        x: 160, 
        y: 580, 
        width: 50,  // Adjust size to match your image
        height: 50, // Adjust size to match your image
        speed: 5, 
        health: 100 
    };
    zombies = [];
    score = 0;
    level = 1;
    isBossLevel = false;
    spawnZombies(level);
    gameLoop();
}


function gameLoop() {
    if (!gameRunning || gameOver) return;
    updateGame();
    updateBullets(); // Move bullets
    renderGame();
    drawBullets(); // Draw bullets on canvas
    requestAnimationFrame(gameLoop);
}

// Update game state
function updateGame() {
    movePlayer();
    updateZombies();

    if (isBossLevel) {
        updateBoss();
    }

    if (zombies.length === 0 && !isBossLevel) {
        levelUp();
    }

    if (level > maxLevels && !isBossLevel) {
        startBossLevel();
    }

    if (player.health <= 0) {
        gameOver = true;
        endGame();
    }
}

// Render game on canvas
function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    drawPlayer();

    // Draw zombies
    drawZombies();

    // Draw boss if in boss level
    if (isBossLevel) {
        drawBoss();
    }

    // Draw score and level
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Level: ${level}`, 10, 50);
}

// End the game
function endGame() {
    canvas.style.display = 'none';
    document.getElementById('final-score').innerText = `Your score: ${score}`;
    document.getElementById('retry-menu').style.display = 'block';
    backgroundMusic.pause();
}

// Player movement
function movePlayer() {
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
}

// Spawn zombies with a larger fixed size across all levels
function spawnZombies(level) {
    zombies = [];
    let zombieCount = level * 5;
    let fixedZombieWidth = 100;  // Set the larger fixed width for all zombies
    let fixedZombieHeight = 100; // Set the larger fixed height for all zombies

    for (let i = 0; i < zombieCount; i++) {
        zombies.push({
            x: Math.random() * (canvas.width - fixedZombieWidth), // Ensure zombies spawn within the canvas width
            y: Math.random() * -100,
            width: fixedZombieWidth,  // Use fixed larger width
            height: fixedZombieHeight, // Use fixed larger height
            speed: 1 + (level * 0.2),
            health: 20 + (level * 5),
            image: zombieImage // Assign the preloaded image
        });
    }
}


// Update zombies
function updateZombies() {
    zombies.forEach((zombie, index) => {
        zombie.y += zombie.speed;
        if (zombie.y > canvas.height) {
            zombie.y = Math.random() * -100;
            zombie.x = Math.random() * canvas.width;
        }
        if (checkCollision(player, zombie)) {
            player.health -= 10;
        }

        if (zombie.health <= 0) {
            zombies.splice(index, 1);
            score += 10;
            playZombieDeathSound();
        }
    });
}

// Draw zombies
function drawZombies() {
    zombies.forEach(zombie => {
        if (zombie.image.complete) {  // Check if the image is loaded
            ctx.drawImage(zombie.image, zombie.x, zombie.y, zombie.width, zombie.height);
        } else {
            // Fallback in case the image isn't ready yet
            ctx.fillStyle = 'green';
            ctx.fillRect(zombie.x, zombie.y, zombie.width, zombie.height);
        }
    });
}
//draw player
function drawPlayer() {
    if (playerImage.complete) {  // Ensure the image is loaded
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        // Fallback if the image isn't ready yet
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

//draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        if (bulletImage.complete) {  // Ensure the bullet image is loaded
            ctx.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
        } else {
            // Fallback if the image isn't ready yet
            ctx.fillStyle = 'red';
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    });
}



// Level up
function levelUp() {
    level++;
    spawnZombies(level);
}

// Start boss level
function startBossLevel() {
    isBossLevel = true;
    boss = { x: 120, y: 50, width: 120, height: 120, health: 200 };
}

// Update boss
function updateBoss() {
    // Boss attacks and movement logic
    if (checkCollision(player, boss)) {
        player.health -= 20;
    }
    if (boss.health <= 0) {
        gameOver = true;
        endGame();
    }
}

// Draw boss
function drawBoss() {
    ctx.fillStyle = "red";
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
}

// Check collision between two objects
function checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

// Play background music
function playBackgroundMusic() {
    backgroundMusic.loop = true;
    backgroundMusic.play();
}

// Play attack sound
function playAttackSound() {
    attackSound.play();
}

// Play zombie death sound
function playZombieDeathSound() {
    zombieDeathSound.play();
}

// Handle bullets
function shootBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 5, // Adjust to center the bullet
        y: player.y,
        width: 50,  // Set this to your bullet image's width
        height: 30, // Set this to your bullet image's height
        speed: 5
    });
    playAttackSound();
}


// Update bullets
function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            bullets.splice(index, 1); // Remove bullet if it goes off screen
        }

        // Check collision with zombies
        zombies.forEach((zombie, zIndex) => {
            if (checkCollision(bullet, zombie)) {
                zombie.health -= 10;
                bullets.splice(index, 1); // Remove bullet
                if (zombie.health <= 0) {
                    zombies.splice(zIndex, 1); // Remove zombie
                    score += 10;
                    playZombieDeathSound();
                }
            }
        });
    });
}

