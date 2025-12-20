import { InputHandler } from './Input.js';
import { AudioManager } from './AudioManager.js';
import { Assets } from './Assets.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { Explosion } from '../entities/Explosion.js';
import { Coin } from '../entities/Coin.js';
import { Environment } from '../environment/Environment.js';
import { ScoreManager } from './ScoreManager.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATE, Keys } from '../utils/Constants.js';

export class Game {
    constructor(ctx, scoreManager) {
        this.ctx = ctx;
        this.scoreManager = scoreManager;
        this.input = new InputHandler();
        this.audio = new AudioManager();
        this.player = new Player(this.audio);
        this.environment = new Environment(Assets);

        this.enemies = [];
        this.coins = []; // Coins
        this.enemyProjectiles = [];
        this.explosions = [];
        this.gameTimer = 0;
        this.wave01Spawned = false;
        this.wave02Spawned = false;
        this.easterEggSpawned = false;

        // Barrage State
        this.barrageActive = false;
        this.barrageCount = 0;
        this.barrageTimer = 0;
        this.barrageComplete = false;

        // Dev Message (after Easter Egg exits)
        this.showDevMessage = false;

        this.lastWaveDirection = 0; // Store for wave 2 logic
        this.godMode = false;
        this.paused = false;
        this.lastPauseState = false; // Latch for input
        this.score = 0;
        this.distance = 0; // Distance in meters

        this.state = GAME_STATE.START;
        this.startScreenTimer = 0; // Cooldown for start screen inputs

        // Bind for events
        this.submitName = this.submitName.bind(this);
        const submitBtn = document.getElementById('submit-name-btn');
        if (submitBtn) {
            // Remove old listeners to avoid duplicates
            const newBtn = submitBtn.cloneNode(true);
            submitBtn.parentNode.replaceChild(newBtn, submitBtn);
            newBtn.addEventListener('click', this.submitName);
        }

        const nameInput = document.getElementById('player-name');
        if (nameInput) {
            const newInput = nameInput.cloneNode(true);
            nameInput.parentNode.replaceChild(newInput, nameInput);
            newInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.submitName();
                }
            });
        }

        // Auto-pause on blur
        window.addEventListener('blur', () => {
            if (this.state === GAME_STATE.PLAYING && !this.paused) {
                this.setPaused(true);
            }
        });


        // Transition / Fade Logic
        this.fadeAlpha = 0;
        this.fadeState = 'NONE'; // 'NONE', 'FADE_OUT', 'FADE_IN'
        this.fadeSpeed = 0.01; // Slow fade as requested

        // Start Intro Music
        this.audio.playMusic('assets/audio/intro.ogg');

        // Blink timer for text
        this.blinkTimer = 0;

        // High Score Animation State (Canvas Start Screen)
        this.highScoreAnimState = 'HIDDEN'; // 'HIDDEN', 'SLIDING_IN', 'VISIBLE', 'SLIDING_OUT'
        this.highScoreAnimTimer = 0;
        this.highScoreY = CANVAS_HEIGHT + 100; // Start off-screen below
        this.highScoreTargetY = CANVAS_HEIGHT / 2 - 150; // Center of screen (adjusted for table height)

        this.onFadeOutComplete = null;

        // FPS Counter
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsTime = this.lastTime;

        // Start Loop
        this.input.update(); // Initial Input Update
    }

    update() {
        // Update Input First (Always, so we can unpause)
        this.input.update();

        // Calculate FPS & Delta Time
        const now = performance.now();
        let dt = (now - this.lastTime) / 1000; // Delta time in seconds
        // Limit dt to avoid huge jumps if lag
        if (dt > 0.1) dt = 0.1;

        this.lastTime = now;

        this.frameCount++;
        if (now - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }

        // Global Speed Multiplier
        // Fast Forward (Turbo) or Normal
        if (Keys.FastForward) {
            dt *= 10.0; // Turbo Speed (Super Fast)
        } else {
            dt *= 1.5; // Normal Speed (Previously adjusted)
        }

        // PAUSE LOGIC
        // Toggle Latch
        if (Keys.Pause && !this.lastPauseState && this.state === GAME_STATE.PLAYING) {
            this.setPaused(!this.paused);
        }
        this.lastPauseState = Keys.Pause;

        if (this.paused) {
            // Draw paused state and return
            this.drawPlaying(); // Draw underlying game
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.font = 'bold 40px "Courier New", monospace';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            this.ctx.restore();
            return; // STOP UPDATE LOOP
        }

        // Try unlock audio with Gamepad
        if (this.audio.isLocked && this.input.gamepadActive) {
            this.audio.unlock();
        }

        switch (this.state) {
            case GAME_STATE.START:
                this.updateStartScreen(dt);
                break;
            case GAME_STATE.PLAYING:
                this.updatePlaying(dt);
                break;
            case GAME_STATE.GAME_OVER:
                this.updateGameOver(dt);
                break;
        }

        // Handle Global Fade
        if (this.fadeState === 'FADE_OUT') {
            this.fadeAlpha += this.fadeSpeed * (dt * 60); // Apply dt to fade too
            if (this.fadeAlpha >= 1) {
                this.fadeAlpha = 1;

                if (this.onFadeOutComplete) {
                    this.onFadeOutComplete();
                    this.onFadeOutComplete = null;
                }

                this.fadeState = 'FADE_IN';
            }
        } else if (this.fadeState === 'FADE_IN') {
            this.fadeAlpha -= this.fadeSpeed * (dt * 60);
            if (this.fadeAlpha <= 0) {
                this.fadeAlpha = 0;
                this.fadeState = 'NONE';
            }
        }
    }

    setPaused(value) {
        this.paused = value;
        if (this.paused) {
            this.audio.pause();
        } else {
            this.audio.resume();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        switch (this.state) {
            case GAME_STATE.START:
                this.drawStartScreen();
                break;
            case GAME_STATE.PLAYING:
                this.drawPlaying();
                break;
            case GAME_STATE.GAME_OVER:
                this.drawGameOver();
                break;
        }

        // Draw Fade Overlay
        if (this.fadeAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // Draw FPS
        this.ctx.save();
        this.ctx.fillStyle = 'cyan';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`FPS: ${this.fps}`, CANVAS_WIDTH - 10, 20);
        this.ctx.restore();
    }

    updateStartScreen(dt) {
        // Only scroll background, do not spawn ground
        this.environment.update(dt, false);
        this.startScreenTimer += dt;

        // High Score Animation State Machine
        this.highScoreAnimTimer += dt;

        switch (this.highScoreAnimState) {
            case 'HIDDEN':
                // Wait 10 seconds before showing
                if (this.highScoreAnimTimer >= 10) {
                    this.highScoreAnimState = 'SLIDING_IN';
                    this.highScoreAnimTimer = 0;
                }
                break;

            case 'SLIDING_IN':
                // Slide up over 1 second
                const slideInProgress = Math.min(this.highScoreAnimTimer / 1.0, 1.0);
                const easeOut = 1 - Math.pow(1 - slideInProgress, 3); // Ease-out cubic
                this.highScoreY = CANVAS_HEIGHT + 100 - (CANVAS_HEIGHT + 100 - this.highScoreTargetY) * easeOut;

                if (slideInProgress >= 1.0) {
                    this.highScoreAnimState = 'VISIBLE';
                    this.highScoreAnimTimer = 0;
                }
                break;

            case 'VISIBLE':
                // Stay visible for 15 seconds
                if (this.highScoreAnimTimer >= 15) {
                    this.highScoreAnimState = 'SLIDING_OUT';
                    this.highScoreAnimTimer = 0;
                }
                break;

            case 'SLIDING_OUT':
                // Slide down over 1 second
                const slideOutProgress = Math.min(this.highScoreAnimTimer / 1.0, 1.0);
                const easeIn = Math.pow(slideOutProgress, 3); // Ease-in cubic
                this.highScoreY = this.highScoreTargetY + (CANVAS_HEIGHT + 100 - this.highScoreTargetY) * easeIn;

                if (slideOutProgress >= 1.0) {
                    this.highScoreAnimState = 'HIDDEN';
                    this.highScoreAnimTimer = 0;
                }
                break;
        }

        // Start Game on ANY key - But only if not already fading AND cooldown passed
        if (this.input.anyKeyPressed && this.fadeState === 'NONE' && this.startScreenTimer > 1.0) {
            this.onFadeOutComplete = () => this.startGame();
            this.fadeState = 'FADE_OUT';
            this.audio.fadeOut(1.0); // Assuming AudioManager has fadeOut, or we just stop it in startGame
        }
    }

    drawStartScreen() {
        this.environment.draw(this.ctx);
        // Removed Player draw
        // Player is hidden

        // Draw Logo
        const logo = Assets.logo;
        const logoScale = 1.32; // Adjusted from 0.66 for 50% optimized logo (926→463px)
        const logoW = logo.width * logoScale;
        const logoH = logo.height * logoScale;
        const logoX = (CANVAS_WIDTH - logoW) / 2;
        const logoY = 50;

        this.ctx.save();
        this.ctx.shadowBlur = 6; // Reduced from 20
        this.ctx.shadowColor = '#00ff00';
        this.ctx.drawImage(logo, logoX, logoY, logoW, logoH);
        this.ctx.restore();

        // Draw Blinking Text
        this.blinkTimer++;
        if (Math.floor(this.blinkTimer / 30) % 2 === 0) {
            this.ctx.font = '24px "Courier New", Courier, monospace';
            this.ctx.fillStyle = '#00ff00'; // Matrix Green or maybe Magenta?
            this.ctx.textAlign = 'center';
            this.ctx.fillText("Press any key to start!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
        }

        // Draw High Score Table (Animated)
        if (this.highScoreAnimState !== 'HIDDEN') {
            this.drawHighScoreTable();
        }
    }

    drawHighScoreTable() {
        const scores = this.scoreManager.highScores || [];
        const tableWidth = 800;
        const tableHeight = 340;
        const tableX = (CANVAS_WIDTH - tableWidth) / 2;
        const tableY = this.highScoreY;

        this.ctx.save();

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.roundRect(tableX, tableY, tableWidth, tableHeight, 15);
        this.ctx.fill();
        this.ctx.stroke();

        // Title
        this.ctx.font = 'bold 24px "Courier New", monospace';
        this.ctx.fillStyle = '#00ff00';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('TOP 20 PILOTS', CANVAS_WIDTH / 2, tableY + 35);
        this.ctx.shadowBlur = 0;

        // Draw Scores in 2 Columns
        const colWidth = tableWidth / 2;
        const startY = tableY + 60;
        const lineHeight = 28;
        const fontSize = 14;

        this.ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        this.ctx.textAlign = 'left';

        for (let i = 0; i < 20; i++) {
            const col = i < 10 ? 0 : 1;
            const row = i < 10 ? i : i - 10;
            const x = tableX + 20 + col * colWidth;
            const y = startY + row * lineHeight;

            const rank = (i + 1).toString().padStart(2, '0');
            const data = scores[i] || { name: '---', score: 0 };
            const scoreStr = data.score.toLocaleString('pt-BR');

            // Rank + Name (Magenta)
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.fillText(`${rank} ${data.name}`, x, y);

            // Score (Yellow)
            this.ctx.fillStyle = '#ffff00';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`R$ ${scoreStr},00`, x + colWidth - 40, y);
            this.ctx.textAlign = 'left';
        }

        this.ctx.restore();
    }

    startGame() {
        this.state = GAME_STATE.PLAYING;

        const introScreen = document.getElementById('intro-screen');
        if (introScreen) introScreen.style.display = 'none';

        // Switch Music
        this.audio.playMusic('assets/audio/stage01.ogg');

        this.environment.setMode('PLAY'); // Switch to Huge BG
        this.environment.reset(); // Restart ground timer
        this.player.x = 100;
        this.player.y = 200;
        // Logic for Fade In is handled in update()
    }


    updatePlaying(dt) {
        this.gameTimer++;

        // Update Distance
        // Base speed 100m/s * dt
        // If Fast Forward is on, dt is higher (10x), so distance grows faster.
        this.distance += 100 * dt;

        this.environment.update(dt);

        if (this.fadeState !== 'FADE_OUT') {
            this.player.update(dt);
        }

        // --- Wave 01 Logic ---
        // Was 600 frames. Now 1000m (1.0km)
        if (this.distance >= 600 && !this.wave01Spawned) {
            this.spawnWave01();
            this.wave01Spawned = true;
        }

        // --- Wave 02 Logic ---
        // Was 940 frames. Now 1700m (1.5km)
        if (this.distance >= 1700 && !this.wave02Spawned) {
            this.spawnWave02();
            this.wave02Spawned = true;
        }

        // Easter Egg (After Wave 2)
        // Was 1600 frames. Now 2600m (2.6km)
        if (this.distance >= 3700 && !this.easterEggSpawned) {
            this.environment.spawnEasterEgg(Assets);
            this.easterEggSpawned = true;
        }

        // --- Giant Missile Barrage ---
        // Trigger shortly after easter egg (e.g., 3400m)
        if (this.easterEggSpawned && this.distance >= 3500 && !this.barrageComplete && !this.barrageActive) {
            this.barrageActive = true;
            this.barrageTimer = 0;
            this.barrageCount = 0;
        }

        if (this.barrageActive) {
            this.barrageTimer += dt * 50;
            // Spawn every 60 frames (approx 1s)
            if (this.barrageTimer > 50) {
                this.barrageTimer = 0;
                this.spawnGiantMissile();
                this.barrageCount++;

                if (this.barrageCount >= 10) {
                    this.barrageActive = false;
                    this.barrageComplete = true;
                }
            }
        }

        // Check if Easter Egg exited the screen
        if (this.easterEggSpawned && !this.environment.easterEgg && !this.showDevMessage) {
            this.showDevMessage = true;
        }


        // Update Enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update(this.enemyProjectiles, this.player, dt);
            if (enemy.markedForDeletion) {
                this.enemies.splice(index, 1);
            }
        });

        // Update Enemy Projectiles
        this.enemyProjectiles.forEach((proj, index) => {
            proj.update(dt);
            if (proj.markedForDeletion) {
                this.enemyProjectiles.splice(index, 1);
            }
        });

        // Update Explosions
        this.explosions.forEach((explosion, index) => {
            explosion.update(dt);
            if (explosion.markedForDeletion) {
                this.explosions.splice(index, 1);
            }
        });

        // Update Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.update(dt);
            if (coin.markedForDeletion) {
                this.coins.splice(i, 1);
                continue; // Skip collision check if deleted
            }

            // Check Collision with Player
            if (this.checkCollision(this.player, coin)) {
                // Collect Coin
                coin.markedForDeletion = true;
                this.score += 100;
                this.audio.playCoinSound();
                this.coins.splice(i, 1); // Remove immediately
            }
        }

        // Cheat Check
        if (this.input.cheatGodEntered) {
            this.godMode = !this.godMode;
            this.input.cheatGodEntered = false;
            console.log("God Mode:", this.godMode ? "ON" : "OFF");
        }

        this.checkCollisions();
    }

    checkCollisions() {
        const bullets = this.player.bullets;
        const enemies = this.enemies;

        // Iterate backwards for safe removal? Or just mark for deletion.
        // Let's use standard loops.
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];

            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];

                // Simple AABB Collision
                if (!enemy.isActive) continue; // Don't hit invisible/waiting enemies

                // Optimization/Fairness: Check if enemy is on screen
                if (enemy.x > CANVAS_WIDTH || enemy.x + enemy.width < 0 ||
                    enemy.y > CANVAS_HEIGHT || enemy.y + enemy.height < 0) {
                    continue;
                }

                // Bullet (small enough to be point or small box)
                if (this.checkCollision(bullet, enemy)) {
                    // Collision Detected!
                    enemy.markedForDeletion = true;
                    this.coins.push(new Coin(enemy.x, enemy.y)); // Spawn Coin
                    bullet.markedForDeletion = true;

                    // Spawn Explosion (Centered)
                    const centerX = enemy.x + (enemy.width / 2);
                    const centerY = enemy.y + (enemy.height / 2);
                    this.explosions.push(new Explosion(centerX, centerY));

                    // Play Explosion Sound
                    this.audio.playSFX('assets/audio/explosion-enemy01.ogg');

                    break; // Bullet hits one enemy and disappears
                }
            }
        }
        // 2. Player vs Enemy Collision
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy.isActive) continue;

            // Check visibility
            if (enemy.x > CANVAS_WIDTH || enemy.x + enemy.width < 0 ||
                enemy.y > CANVAS_HEIGHT || enemy.y + enemy.height < 0) {
                continue;
            }

            if (this.checkCollision(this.player, enemy)) {
                if (!this.godMode) this.handlePlayerDeath(enemy);
                break;
            }
        }

        // 3. Projectile vs Player Collision
        this.enemyProjectiles.forEach((proj, index) => {
            if (this.checkCollision(proj, this.player)) {
                // Hit!
                if (!this.godMode) {
                    this.enemyProjectiles.splice(index, 1); // Remove projectile
                    this.handlePlayerDeath();
                }
            }
        });

        // 4. Ground Collision (Crash)
        // Check pixel-perfect collision with environment
        if (this.environment.checkCollision(this.player)) {
            if (!this.godMode) this.handlePlayerDeath();
        }

        // 5. Giant Missile vs Easter Egg (Destroy Missile)
        this.enemyProjectiles.forEach((proj, index) => {
            if (proj.x > CANVAS_WIDTH || proj.x + proj.width < 0) return;

            // Use shared pixel-perfect logic
            if (this.environment.checkEasterEggCollision(proj)) {
                // Hit!
                // Destroy Missile
                this.enemyProjectiles.splice(index, 1);

                // Spawn Explosion at Contact Point (Center of projectile)
                this.explosions.push(new Explosion(proj.x + proj.width / 2, proj.y + proj.height / 2));
                this.audio.playSFX('assets/audio/explosion-enemy01.ogg');
            }
        });

        // 6. Player Bullets vs Easter Egg (Destroy Bullet)
        for (let i = this.player.bullets.length - 1; i >= 0; i--) {
            const bullet = this.player.bullets[i];
            if (this.environment.checkEasterEggCollision(bullet)) {
                this.player.bullets.splice(i, 1);
                // Smaller explosion or just spark? Using normal explosion for visibility
                this.explosions.push(new Explosion(bullet.x, bullet.y));
                // Maybe no sound for bullet hit to avoid spam? Or quiet one.
                // Keeping silent or reusing hit sound if available.
                // Reuse explosion sound sparingly or just visual if spammy
                this.audio.playSFX('assets/audio/explosion-enemy01.ogg');
            }
        }

        // 7. Player Bullets vs Giant Missiles (Indestructible)
        for (let i = this.player.bullets.length - 1; i >= 0; i--) {
            const bullet = this.player.bullets[i];

            for (const proj of this.enemyProjectiles) {
                if (proj.type !== 'giant_missile') continue;

                if (proj.x > CANVAS_WIDTH || proj.x + proj.width < 0) continue;

                // Use simple AABB for indestructible check
                if (this.checkCollision(bullet, proj)) {
                    // Hit Indestructible Object
                    this.player.bullets.splice(i, 1);
                    this.explosions.push(new Explosion(bullet.x, bullet.y));
                    this.audio.playSFX('assets/audio/explosion-enemy01.ogg');
                    break; // Bullet destroyed
                }
            }
        }
    }

    handlePlayerDeath(enemy) {
        // Explosion at Player
        this.explosions.push(new Explosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2));

        // Explosion at Enemy
        if (enemy) {
            this.explosions.push(new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2));
            enemy.markedForDeletion = true;
            // Spawn Coin
            this.coins.push(new Coin(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2));
        }

        this.audio.playSFX('assets/audio/explosion-enemy01.ogg');

        // Play second explosion sound slightly later
        setTimeout(() => {
            this.audio.playSFX('assets/audio/explosion-enemy01.ogg');
        }, 300);

        this.audio.fadeOut(2.0); // Fade out music over 2 seconds

        this.state = GAME_STATE.GAME_OVER;
        this.gameOverTimer = 0; // Cooldown before restart

        // Delay showing Game Over UI for 1 second
        setTimeout(() => {
            // Show Game Over UI
            const gameOverScreen = document.getElementById('game-over-screen');
            const finalScore = document.getElementById('final-score');
            const nameEntry = document.getElementById('name-entry');
            const restartMsg = document.getElementById('restart-msg');
            const nameInput = document.getElementById('player-name');

            if (gameOverScreen) gameOverScreen.classList.remove('hidden');
            if (finalScore) finalScore.innerText = `CASH: R$ ${this.score},00`;

            // Always show name entry for now
            if (nameEntry) nameEntry.classList.remove('hidden');
            if (restartMsg) restartMsg.classList.add('hidden');

            // Focus input after short delay (relative to this timeout)
            setTimeout(() => {
                if (nameInput) {
                    nameInput.value = '';
                    nameInput.focus();
                }
            }, 100);
        }, 1000);
    }

    drawPlaying() {
        this.environment.draw(this.ctx);
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.enemyProjectiles.forEach(proj => proj.draw(this.ctx));
        this.coins.forEach(coin => coin.draw(this.ctx));
        this.explosions.forEach(explosion => explosion.draw(this.ctx));

        // Draw Score
        // Draw Score
        this.drawScore();

        // Draw "Em desenvolvimento..." message
        if (this.showDevMessage) {
            this.ctx.save();
            this.ctx.font = 'normal 48px "Courier New", monospace';
            this.ctx.fillStyle = '#ffff00';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText('Em desenvolvimento...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            this.ctx.restore();
        }
    }

    drawScore() {
        this.ctx.save();
        this.ctx.font = 'bold 20px "Courier New", monospace';
        this.ctx.fillStyle = '#FFFF00'; // Yellow
        this.ctx.textAlign = 'left';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 0;

        this.ctx.fillText("GRANA: R$ " + this.score + ",00", 20, 30);

        // Draw Distance (e.g. 1.2 km)
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.fillStyle = '#AAAAAA';
        const km = (this.distance / 1000).toFixed(1);
        this.ctx.fillText("DIST: " + km + " km", 20, 50);

        if (this.godMode) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillText("GOD MODE", 20, 80); // Moved down
        }

        // Draw PAUSED Overlay
        if (this.paused) {
            this.ctx.save();
            // Optional: Semi-transparent background for better readability
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Blinking Text
            // Blink every 500ms
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                this.ctx.font = 'bold 48px "Courier New", monospace'; // Pixel-ish look
                this.ctx.fillStyle = '#FFFF00'; // Yellow
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            }
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    async submitName() {
        if (this.state !== GAME_STATE.GAME_OVER) return;

        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim().toUpperCase();

        // Hide Name Entry
        const nameEntry = document.getElementById('name-entry');
        if (nameEntry) nameEntry.classList.add('hidden');

        try {
            // Save Score ONLY if name is not empty
            if (this.scoreManager && name.length > 0) {
                const result = await this.scoreManager.saveHighScore(name, this.score);

                // Reload scores and update board
                // Maybe show celebration if result.updated?
                const scores = await this.scoreManager.loadHighScores();

                // Update global board directly
                const list = document.querySelector('.score-list');
                ScoreManager.render(scores, list);
            }
        } catch (e) {
            console.error(e);
        }

        // Direct Reset to Start Screen (User request)
        this.resetGame();
    }

    spawnWave01() {
        // Spawn 10 enemies, one after another
        const count = 10;
        const delayBetween = 40; // Frames between each enemy (Slow snake)

        // Decide spawn direction for the ENTIRE wave
        // 50% chance Top-Down (1), 50% chance Bottom-Up (-1)
        // Store direction for Wave 2
        this.lastWaveDirection = Math.random() < 0.5 ? 1 : -1;

        for (let i = 0; i < count; i++) {
            this.enemies.push(new Enemy(i * delayBetween, this.lastWaveDirection));
        }
    }

    spawnWave02() {
        const count = 10;
        const delayBetween = 40;

        // Opposite direction of Wave 1
        const waveDirection = -this.lastWaveDirection;

        for (let i = 0; i < count; i++) {
            this.enemies.push(new Enemy(i * delayBetween, waveDirection));
        }
    }

    spawnGiantMissile() {
        // Spawn from Left (-250), Random Y
        const x = -250;
        // height is 110. Keep within bounds efficiently
        const y = Math.random() * (CANVAS_HEIGHT - 150) + 20;

        // Create Projectile
        // Speed 6 (default)
        // Direction 'right' (vx > 0)
        const missile = new Projectile(x, y, 'right', 'giant_missile');

        // These are ENEMY projectiles (hurt player)
        this.enemyProjectiles.push(missile);
    }

    updateGameOver(dt) {
        this.gameOverTimer++;

        // Update Explosions
        this.explosions.forEach((explosion, index) => {
            explosion.update(dt);
            if (explosion.markedForDeletion) {
                this.explosions.splice(index, 1);
            }
        });

        // Check for Restart Key ONLY if Restart Message is visible (Name entry done)
        const restartMsg = document.getElementById('restart-msg');
        if (restartMsg && !restartMsg.classList.contains('hidden')) {
            if (this.input.anyKeyPressed && this.gameOverTimer > 60) {
                this.resetGame();
            }
        }
    }

    drawGameOver() {
        this.environment.draw(this.ctx);
        // Draw Enemies (Frozen or just last state)
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.enemyProjectiles.forEach(proj => proj.draw(this.ctx));

        // Draw Explosions
        this.explosions.forEach(explosion => explosion.draw(this.ctx));

        // Note: Text and UI handled by DOM overlay
    }

    resetGame() {
        this.state = GAME_STATE.START;
        this.startScreenTimer = 0;
        // Reset Logic
        this.enemies = [];
        this.coins = [];
        this.enemyProjectiles = [];
        this.explosions = [];
        this.player.x = 100;
        this.player.y = 200;
        this.player.bullets = [];
        this.gameTimer = 0;
        this.wave01Spawned = false;
        this.wave02Spawned = false;
        this.easterEggSpawned = false;
        this.barrageActive = false;
        this.barrageCount = 0;
        this.barrageTimer = 0;
        this.barrageComplete = false;
        this.showDevMessage = false;
        this.score = 0;
        this.distance = 0;

        // Reset High Score Animation
        this.highScoreAnimState = 'HIDDEN';
        this.highScoreAnimTimer = 0;
        this.highScoreY = CANVAS_HEIGHT + 100;

        this.environment.setMode('START');
        this.environment.reset();

        this.audio.playMusic('assets/audio/intro.ogg');

        // Hide Game Over UI
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');

        // Do NOT show DOM Start Screen UI (as requested, only Canvas elements)
        const introScreen = document.getElementById('intro-screen');
        if (introScreen) introScreen.style.display = 'none';

        // Ensure High Scores stays hidden if we ever show introScreen again
        const highScores = document.querySelector('.high-scores');
        if (highScores) highScores.classList.add('hidden');
        // Hide High Scores on subsequent resets
        if (highScores) highScores.classList.add('hidden');

        // Reset fade
        const fadeOverlay = document.getElementById('fade-overlay');
        if (fadeOverlay) fadeOverlay.style.opacity = 0;
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
}
