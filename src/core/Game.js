import { InputHandler } from './Input.js';
import { AudioManager } from './AudioManager.js';
import { Assets } from './Assets.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Enemy02 } from '../entities/Enemy02.js';
import { Projectile } from '../entities/Projectile.js';
import { Explosion } from '../entities/Explosion.js';
import { Coin } from '../entities/Coin.js';
import { SpeedUp } from '../entities/SpeedUp.js';
import { FloatingIsland } from '../entities/FloatingIsland.js';
import { Environment } from '../environment/Environment.js';
import { ScoreManager } from './ScoreManager.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATE, Keys } from '../utils/Constants.js';
import { t } from '../utils/Language.js';

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
        this.speedUps = []; // Power-ups
        this.speedUpTimer = 0;
        this.nextSpeedUpDelay = Math.random() * 10 + 20; // First one between 20-30 seconds
        this.enemyProjectiles = [];
        this.explosions = [];
        this.gameTimer = 0;
        this.wave01Spawned = false;
        this.wave02Spawned = false;
        this.wave03Spawned = false;
        this.easterEggSpawned = false;
        this.rustyBgTriggered = false;

        // Barrage State
        this.barrageActive = false;
        this.barrageCount = 0;
        this.barrageTimer = 0;
        this.barrageComplete = false;

        // Post-Shop Waves
        this.postShopWave1Spawned = false;
        this.postShopWave2Spawned = false;
        this.postShopWave2Timer = 0;

        // Dev Message (after Easter Egg exits)
        this.showDevMessage = false;

        this.lastWaveDirection = 0; // Store for wave 2 logic
        this.godMode = false;
        this.paused = false;
        this.lastPauseState = false; // Latch for input
        this.score = 0;
        this.distance = 0; // Distance in meters

        this.floatingIslands = [];
        this.islandSpawnedAfterShop = false;

        this.state = GAME_STATE.START;
        this.startScreenTimer = 0; // Cooldown for start screen inputs

        // Shop State
        this.shopOpen = false;
        this.shopVisited = false;
        this.shopPurchased = false;
        this.shopSelectedIndex = 0; // Focus index: 0-4 items, 5 close

        // Bind for events
        this.submitName = this.submitName.bind(this);
        this.closeShop = this.closeShop.bind(this);
        this.buySpread = this.buySpread.bind(this);
        this.buyFireRate = this.buyFireRate.bind(this);
        this.buyShield = this.buyShield.bind(this);
        this.buyPierce = this.buyPierce.bind(this);
        this.buyMagnet = this.buyMagnet.bind(this);
        const submitBtn = document.getElementById('submit-name-btn');
        if (submitBtn) {
            // Remove old listeners to avoid duplicates
            const newBtn = submitBtn.cloneNode(true);
            submitBtn.parentNode.replaceChild(newBtn, submitBtn);
            newBtn.addEventListener('click', this.submitName);
        }

        const btnCloseShop = document.getElementById('btn-close-shop');
        if (btnCloseShop) {
            const newBtn = btnCloseShop.cloneNode(true);
            btnCloseShop.parentNode.replaceChild(newBtn, btnCloseShop);
            newBtn.addEventListener('click', this.closeShop);
        }

        const btnBuySpread = document.getElementById('btn-buy-spread');
        if (btnBuySpread) {
            const newBtn = btnBuySpread.cloneNode(true);
            btnBuySpread.parentNode.replaceChild(newBtn, btnBuySpread);
            newBtn.addEventListener('click', this.buySpread);
        }

        const btnBuyFireRate = document.getElementById('btn-buy-firerate');
        if (btnBuyFireRate) {
            const newBtn = btnBuyFireRate.cloneNode(true);
            btnBuyFireRate.parentNode.replaceChild(newBtn, btnBuyFireRate);
            newBtn.addEventListener('click', this.buyFireRate);
        }

        const btnBuyShield = document.getElementById('btn-buy-shield');
        if (btnBuyShield) {
            const newBtn = btnBuyShield.cloneNode(true);
            btnBuyShield.parentNode.replaceChild(newBtn, btnBuyShield);
            newBtn.addEventListener('click', this.buyShield);
        }

        const btnBuyPierce = document.getElementById('btn-buy-piercing');
        if (btnBuyPierce) {
            const newBtn = btnBuyPierce.cloneNode(true);
            btnBuyPierce.parentNode.replaceChild(newBtn, btnBuyPierce);
            newBtn.addEventListener('click', this.buyPierce);
        }

        const btnBuyMagnet = document.getElementById('btn-buy-magnet');
        if (btnBuyMagnet) {
            const newBtn = btnBuyMagnet.cloneNode(true);
            btnBuyMagnet.parentNode.replaceChild(newBtn, btnBuyMagnet);
            newBtn.addEventListener('click', this.buyMagnet);
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
        if (Keys.Pause && !this.lastPauseState && this.state === GAME_STATE.PLAYING && !this.isTransitioningToShop) {
            this.setPaused(!this.paused);
        }
        this.lastPauseState = Keys.Pause;

        // Try unlock audio with Gamepad
        if (this.audio.isLocked && this.input.gamepadActive) {
            this.audio.unlock();
        }

        if (!this.paused) {
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
        }

        // Handle Shop UI Navigation
        if (this.shopOpen) {
            this.handleShopInput();
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
        this.environment.draw(this.ctx, this.shopVisited && !this.shopOpen && !this.isTransitioningToShop);
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
            this.ctx.fillText(t('press_any_key_start'), CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
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
        this.ctx.fillText(t('top_pilots'), CANVAS_WIDTH / 2, tableY + 35);
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
            this.ctx.fillText(`${t('currency')}${scoreStr},00`, x + colWidth - 40, y);
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

        // Reset player orientation to facing right
        this.player.direction = 'right';
        this.player.isTurning = false;

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

        // --- Wave 01 Logic (Cabeção) ---
        // Dynamically append the rusty tile precisely before this wave spawns
        // Wave 1 spawns at 600m, so we trigger the 3-part rusty sequence at 450m
        if (this.distance >= 200 && !this.rustyBgTriggered) {
            this.environment.queueBgTile(Assets);
            this.rustyBgTriggered = true;
        }

        // Was 600 frames. Now 1000m (1.0km) -> Wave 1 spawns at 600m
        if (this.distance >= 600 && !this.wave01Spawned) {
            this.spawnWave01();
            this.wave01Spawned = true;
        }

        /*
        // --- Rusty Full Background Trigger ---
        // Dynamically show the full rusty background around midway before Wave 2
        // Distance matches roughly a lull at 1200m
        if (this.distance >= 0 && !this.rustyFullBgTriggered) {
            this.environment.queueRustyBgFull(Assets);
            this.rustyFullBgTriggered = true;
        }
        */

        // --- Wave 02 Logic ---
        // Was 940 frames. Now 1700m (1.5km)
        if (this.distance >= 1700 && !this.wave02Spawned) {
            this.spawnWave02();
            this.wave02Spawned = true;
        }

        // --- Wave 03 Logic ---
        // Spawn when Easter Egg has passed the middle and is further to the left (1/4 of the screen)
        if (this.environment.easterEgg && this.environment.easterEgg.x <= CANVAS_WIDTH / 18 && !this.wave03Spawned) {
            this.spawnWave03();
            this.wave03Spawned = true;
        }

        // Easter Egg (After Wave 2/3)
        // Was 1600 frames. Now 2600m (2.6km) -> 3700m
        if (this.distance >= 3700 && !this.easterEggSpawned) {
            this.environment.spawnEasterEgg(Assets);
            this.environment.spawnShop();
            this.easterEggSpawned = true;
        }

        // --- Shop Logic ---
        if (this.environment.shopActive && !this.shopVisited && !this.shopOpen && this.fadeState === 'NONE') {
            // A porta da loja fica numa área específica da imagem.
            // A imagem tem largura `Assets.groundShop.width * this.environment.groundScale`
            // Vamos checar um rect na área da porta: do meio pra direita.
            const shopDrawW = Assets.groundShop.width * this.environment.groundScale;
            const shopDrawH = Assets.groundShop.height * this.environment.groundScale;
            // Coordenada Y da loja (desenhada a partir daqui)
            const extraHeight = (Assets.groundShop.height - this.environment.groundLoop.img.height) * this.environment.groundScale;
            const shopY = this.environment.groundY - extraHeight;

            // Retângulo aproximado da porta da loja (metade direita, inferior)
            // Retângulo ajustado para a vitrine de armas (red box da imagem)
            // Começa um pouco antes da metade (ex: 35%) até perto do fim (ex: largura de 40%)
            // E na altura, fica na parte mais inferior, abaixo do letreiro "LOJA" (ex: y = 65% a 95%)
            const doorRect = {
                x: this.environment.shopX + shopDrawW * 0.35, // Começa mais centralizado sob o letreiro
                y: shopY + shopDrawH * 0.70, // Começa bem para baixo, onde ficam as armas
                width: shopDrawW * 0.40, // Pega a largura da vitrine (40% do total)
                height: shopDrawH * 0.25 // Altura suficiente da vitrine
            };

            // Se o player encostar nessa área:
            if (this.checkCollision(this.player, doorRect)) {
                // Inicia o fade out parando o jogo
                this.triggerShopFade();
            }
        }

        // Speed-Up Spawn Logic (Every 20-30 seconds)
        // dt is roughly 1/60s normally, so dt accumulates to seconds
        this.speedUpTimer += dt;
        if (this.speedUpTimer >= this.nextSpeedUpDelay) {
            let canSpawn = true;
            const spawnX = CANVAS_WIDTH + 50;
            const speedUpWidth = 50;
            const speedUpHeight = 50;

            // Random Y on the screen
            const randomY = 100 + Math.random() * (CANVAS_HEIGHT - 200);

            const speedUpRect = { x: spawnX, y: randomY, width: speedUpWidth, height: speedUpHeight };

            // Ensure it does not spawn over the Shop
            if (this.environment.shopActive) {
                const shopWidth = Assets.groundShop.width ? Assets.groundShop.width * this.environment.groundScale : 0;
                if (spawnX + speedUpWidth > this.environment.shopX && spawnX < this.environment.shopX + shopWidth) {
                    canSpawn = false;
                }
            }

            // Ensure it does not spawn over the Easter Egg
            if (canSpawn && this.environment.easterEgg) {
                const egg = this.environment.easterEgg;
                if (spawnX + speedUpWidth > egg.x && spawnX < egg.x + egg.width) {
                    canSpawn = false;
                }
            }

            // Ensure it does not spawn over ANY enemy (like cabeção)
            if (canSpawn) {
                for (let enemy of this.enemies) {
                    // Check if the generated rect overlaps the enemy's current position
                    if (this.checkCollision(speedUpRect, enemy)) {
                        canSpawn = false;
                        break;
                    }
                }
            }

            // Ensure it does not spawn over giant missiles
            if (canSpawn) {
                for (let proj of this.enemyProjectiles) {
                    if (this.checkCollision(speedUpRect, proj)) {
                        canSpawn = false;
                        break;
                    }
                }
            }

            if (canSpawn) {
                this.speedUpTimer = 0;
                this.nextSpeedUpDelay = Math.random() * 10 + 20; // 20 to 30 seconds for the next one
                this.speedUps.push(new SpeedUp(spawnX, randomY));
            } else {
                // If blocked, try again in 0.5s instead of resetting the whole timer
                this.speedUpTimer -= 0.5;
            }
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
        if (this.distance >= 20000 && !this.showDevMessage) {
            this.showDevMessage = true;
        }

        // --- Post-Shop Waves ---
        if (this.environment.shopActive) {
            const shopDrawW = Assets.groundShop.width * this.environment.groundScale;

            // Trigger island spawn when shop is almost off-screen
            if (this.environment.shopX + shopDrawW < 600 && !this.islandSpawnedAfterShop) {
                const islandX = CANVAS_WIDTH + 200;

                // Create temp instance to get dimensions or use the asset directly
                const scale = 0.65;
                const islandHeight = Assets.floatingIsland.height * scale;
                const islandY = (CANVAS_HEIGHT / 2) - (islandHeight / 2);

                const islandSpeed = this.environment.groundSpeed * this.environment.baseSpeed;
                this.floatingIslands.push(new FloatingIsland(islandX, islandY, islandSpeed));
                this.islandSpawnedAfterShop = true;
            }

            // Trigger first wave when the shop is almost off-screen (left edge < 0)
            if (this.environment.shopX + shopDrawW < 500 && !this.postShopWave1Spawned) {
                this.spawnWave04();
                this.postShopWave1Spawned = true;
                this.postShopWave2Timer = 10.0; // 8 seconds delay before wave 2
            }
        }

        if (this.postShopWave1Spawned && !this.postShopWave2Spawned) {
            this.postShopWave2Timer -= dt;
            if (this.postShopWave2Timer <= 0) {
                this.spawnWave05();
                this.postShopWave2Spawned = true;
            }
        }

        // Update Floating Islands
        for (let i = this.floatingIslands.length - 1; i >= 0; i--) {
            this.floatingIslands[i].update(dt);
            if (this.floatingIslands[i].markedForDeletion) {
                this.floatingIslands.splice(i, 1);
            }
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
            coin.update(dt, this.player);
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

        // Update SpeedUps
        for (let i = this.speedUps.length - 1; i >= 0; i--) {
            const powerUp = this.speedUps[i];
            powerUp.update(dt);

            // Move the item with the background so it looks like it is part of the scene
            powerUp.x -= this.environment.groundSpeed * this.environment.baseSpeed * (dt * 60);

            if (powerUp.markedForDeletion || powerUp.x < -100) {
                this.speedUps.splice(i, 1);
                continue;
            }

            // Check Collision with Player
            if (this.checkCollision(this.player, powerUp)) {
                // Collect SpeedUp
                powerUp.markedForDeletion = true;

                // Apply additive speed modifiers instead of doubling
                // Base speed is 2, adding 0.5 is a 25% increase
                // Base bullet speed is 6, adding 0.25 to the multiplier is a +1.5 increase
                // Increase the speed slightly so it's noticeable but manageable
                this.player.speed += 0.7; // era 0.5
                this.player.bulletSpeedMultiplier += 0.35; // era 0.25

                // Add an upper cap if we want to prevent going infinitely fast
                if (this.player.speed > 5) this.player.speed = 5;
                if (this.player.bulletSpeedMultiplier > 2.5) this.player.bulletSpeedMultiplier = 2.5;

                this.audio.playSFX('assets/audio/speed-up-sound.mp3');
                setTimeout(() => {
                    this.audio.playSFX('assets/audio/speed-up-voice.mp3');
                }, 300); // Toca a voz 300ms (0.3s) depois do efeito sonoro

                this.speedUps.splice(i, 1);
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

                    if (bullet.type !== 'pierce') {
                        bullet.markedForDeletion = true;
                    }

                    // Spawn Explosion (Centered)
                    const centerX = enemy.x + (enemy.width / 2);
                    const centerY = enemy.y + (enemy.height / 2);
                    this.explosions.push(new Explosion(centerX, centerY));

                    // Play Explosion Sound
                    this.audio.playSFX('assets/audio/explosion-enemy01.ogg');

                    if (bullet.type !== 'pierce') {
                        break; // Bullet hits one enemy and disappears
                    }
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

        // 5. Collision with Floating Islands
        for (let island of this.floatingIslands) {
            if (this.checkCollision(this.player, island.getBounds())) {
                if (!this.godMode) this.handlePlayerDeath();
                break;
            }
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
        if (this.player.hasShield) {
            this.player.hasShield = false;
            // Destroi inimigo se colidiu
            if (enemy) {
                this.explosions.push(new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2));
                enemy.markedForDeletion = true;
            }
            this.audio.playSFX('assets/audio/power-down.mp3'); // Ou outro som caso possua, usando explosion por enquanto se não houver
            return; // Impede morte
        }

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
        this.environment.draw(this.ctx, this.shopVisited && !this.shopOpen && !this.isTransitioningToShop);
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.enemyProjectiles.forEach(proj => proj.draw(this.ctx));
        this.coins.forEach(coin => coin.draw(this.ctx));
        this.speedUps.forEach(pu => pu.draw(this.ctx));
        this.floatingIslands.forEach(island => island.draw(this.ctx));
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
            this.ctx.fillText(t('in_development'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
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

        this.ctx.fillText(t('money') + this.score + ",00", 20, 30);

        // Draw Distance (e.g. 1.2 km)
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.fillStyle = '#AAAAAA';
        const km = (this.distance / 1000).toFixed(1);
        this.ctx.fillText(t('dist') + km + " km", 20, 50);

        if (this.godMode) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillText(t('god_mode'), 20, 80); // Moved down
        }

        // Draw PAUSED Overlay
        if (this.paused && !this.isTransitioningToShop && !this.shopOpen) {
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
                this.ctx.fillText(t('paused'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50); // Moved down 50px
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
        const count = 5;
        const delayBetween = 80; // Frames between each enemy (Slow snake)

        // Decide spawn direction for the ENTIRE wave
        // 50% chance Top-Down (1), 50% chance Bottom-Up (-1)
        // Store direction for Wave 2
        this.lastWaveDirection = Math.random() < 0.5 ? 1 : -1;

        for (let i = 0; i < count; i++) {
            this.enemies.push(new Enemy(i * delayBetween, this.lastWaveDirection));
        }
    }

    spawnWave02() {
        const count = 5;
        const delayBetween = 80;

        // Opposite direction of Wave 1
        const waveDirection = -this.lastWaveDirection;

        for (let i = 0; i < count; i++) {
            this.enemies.push(new Enemy(i * delayBetween, waveDirection));
        }
    }

    spawnWave03() {
        const count = 4;
        const delayBetween = 40; // Spaced out like Enemy01

        // Spawn 4 enemies in a zig zag pattern
        // Y start varies slightly to make them spread out or follow each other perfectly.
        // If we want same wave, offset phase.

        for (let i = 0; i < count; i++) {
            // startY, phaseOffset
            // To make them follow each other exactly in a snake:
            // same Y, phaseOffset = i * -1.0; 
            // Começando mais do topo (ex: Y=50) em vez do meio (250)
            this.enemies.push(new Enemy02(i * delayBetween, 200, i * -0.2));
        }
    }

    spawnWave04() {
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

    spawnWave05() {
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
        this.environment.draw(this.ctx, this.shopVisited && !this.shopOpen && !this.isTransitioningToShop);
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
        this.speedUps = [];
        this.speedUpTimer = 0;
        this.nextSpeedUpDelay = Math.random() * 10 + 20;
        this.enemyProjectiles = [];
        this.explosions = [];
        this.player.x = 100;
        this.player.y = 200;
        this.player.bullets = [];
        this.gameTimer = 0;
        this.wave01Spawned = false;
        this.wave02Spawned = false;
        this.wave03Spawned = false;
        this.easterEggSpawned = false;
        this.barrageActive = false;
        this.barrageCount = 0;
        this.barrageTimer = 0;
        this.barrageComplete = false;
        this.postShopWave1Spawned = false;
        this.postShopWave2Spawned = false;
        this.postShopWave2Timer = 0;
        this.showDevMessage = false;
        this.score = 0;
        this.distance = 0;
        this.shopOpen = false;
        this.shopVisited = false;
        this.shopPurchased = false;

        // Reset Player Upgrades
        this.player.weaponType = 'single';
        this.player.fireRateLevel = 0;
        this.player.hasShield = false;
        this.player.hasCoinMagnet = false;

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

        const shopScreen = document.getElementById('shop-screen');
        if (shopScreen) shopScreen.classList.add('hidden');

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

    triggerShopFade() {
        if (this.shopOpen || this.shopVisited) return;
        this.shopVisited = true;

        // Pausa completamente a física
        this.setPaused(true);

        // Oculta o texto "PAUSADO" padrão para não ficar na tela, mudando o flag ou desenhando outra coisa
        // Podemos adicionar um estado especial ou usar um flag
        this.isTransitioningToShop = true;

        this.onFadeOutComplete = () => {
            this.openShop();
        };

        this.fadeState = 'FADE_OUT';
        this.fadeSpeed = 0.02; // Um pouco mais rápido para a loja
    }

    openShop() {
        if (this.shopOpen) return;
        this.shopOpen = true;

        const shopScreen = document.getElementById('shop-screen');
        if (shopScreen) shopScreen.classList.remove('hidden');

        // Retorna o fade imediatamente para revelar a loja (o painel escuro)
        // ou deixa escuro mesmo dependendo do estilo css da loja (o atual já é rgba 0.9)
        // Mas como a loja tá por cima, podemos fazer FADE_IN do jogo atrás dela
        this.fadeState = 'FADE_IN';
        this.fadeSpeed = 0.05; // Fade in limpo atrás da loja

        this.updateShopUI();
    }

    closeShop() {
        if (!this.shopOpen) return;

        this.shopOpen = false;

        // Hide Shop DOM immediately
        const shopScreen = document.getElementById('shop-screen');
        if (shopScreen) shopScreen.classList.add('hidden');

        // Unpause game
        this.isTransitioningToShop = false;
        this.setPaused(false);

        // Aplicar um cooldown para evitar que o player atire imediatamente ao sair da loja
        this.player.shootTimer = 30;
        this.player.canShoot = false;

        // Start a slow fade-in on the black background
        this.fadeAlpha = 1; // Força a tela preta totalmente
        this.fadeState = 'FADE_IN';
        this.fadeSpeed = 0.01; // Velocidade lenta, como pedido
    }

    updateShopUI() {
        const balanceEl = document.getElementById('shop-balance');
        if (balanceEl) balanceEl.innerText = `${t('money')}${this.score},00`;

        const btnSpread = document.getElementById('btn-buy-spread');
        const btnFireRate = document.getElementById('btn-buy-firerate');
        const btnShield = document.getElementById('btn-buy-shield');
        const btnPierce = document.getElementById('btn-buy-piercing');
        const btnMagnet = document.getElementById('btn-buy-magnet');
        const btnClose = document.getElementById('btn-close-shop');

        // Update focus classes
        const buttons = [btnSpread, btnFireRate, btnShield, btnPierce, btnMagnet, btnClose];
        buttons.forEach((btn, index) => {
            if (btn) {
                if (index === this.shopSelectedIndex) {
                    btn.classList.add('focused');
                } else {
                    btn.classList.remove('focused');
                }
            }
        });

        if (btnSpread) {
            btnSpread.disabled = this.score < 500 || this.player.weaponType === 'spread';
            if (this.player.weaponType === 'spread') {
                btnSpread.querySelector('.item-name').innerText = t('triple_shot_purchased');
            } else {
                btnSpread.querySelector('.item-name').innerText = t('triple_shot');
            }
        }
        if (btnPierce) {
            btnPierce.disabled = this.score < 1000 || this.player.weaponType === 'pierce';
            if (this.player.weaponType === 'pierce') {
                btnPierce.querySelector('.item-name').innerText = t('piercing_missile_purchased');
            } else {
                btnPierce.querySelector('.item-name').innerText = t('piercing_missile');
            }
        }
        if (btnFireRate) {
            btnFireRate.disabled = this.score < 300 || this.player.fireRateLevel >= 3;
            if (this.player.fireRateLevel >= 3) {
                btnFireRate.querySelector('.item-name').innerText = t('fire_rate_max');
            } else {
                btnFireRate.querySelector('.item-name').innerText = t('fire_rate');
            }
        }
        if (btnShield) {
            btnShield.disabled = this.score < 800 || this.player.hasShield;
            if (this.player.hasShield) {
                btnShield.querySelector('.item-name').innerText = t('extra_shield_active');
            } else {
                btnShield.querySelector('.item-name').innerText = t('extra_shield');
            }
        }
        if (btnMagnet) {
            btnMagnet.disabled = this.score < 700 || this.player.hasCoinMagnet;
            if (this.player.hasCoinMagnet) {
                btnMagnet.querySelector('.item-name').innerText = t('coin_magnet_active');
            } else {
                btnMagnet.querySelector('.item-name').innerText = t('coin_magnet');
            }
        }
    }

    handleShopInput() {
        if (Keys.UI_Down) {
            this.shopSelectedIndex++;
            if (this.shopSelectedIndex > 5) this.shopSelectedIndex = 0;
            this.updateShopUI();
        } else if (Keys.UI_Up) {
            this.shopSelectedIndex--;
            if (this.shopSelectedIndex < 0) this.shopSelectedIndex = 5;
            this.updateShopUI();
        }

        if (Keys.UI_Accept) {
            switch (this.shopSelectedIndex) {
                case 0: document.getElementById('btn-buy-spread')?.click(); break;
                case 1: document.getElementById('btn-buy-firerate')?.click(); break;
                case 2: document.getElementById('btn-buy-shield')?.click(); break;
                case 3: document.getElementById('btn-buy-piercing')?.click(); break;
                case 4: document.getElementById('btn-buy-magnet')?.click(); break;
                case 5: document.getElementById('btn-close-shop')?.click(); break;
            }
        }
    }

    buySpread() {
        if (this.score >= 500 && this.player.weaponType !== 'spread') {
            this.score -= 500;
            this.player.weaponType = 'spread';
            this.audio.playCoinSound();
            this.shopPurchased = true;
            this.updateShopUI();
        }
    }

    buyFireRate() {
        if (this.score >= 300 && this.player.fireRateLevel < 3) {
            this.score -= 300;
            this.player.fireRateLevel++;
            this.audio.playCoinSound();
            this.shopPurchased = true;
            this.updateShopUI();
        }
    }

    buyShield() {
        if (this.score >= 800 && !this.player.hasShield) {
            this.score -= 800;
            this.player.hasShield = true;
            this.audio.playCoinSound();
            this.shopPurchased = true;
            this.updateShopUI();
        }
    }

    buyPierce() {
        if (this.score >= 1000 && this.player.weaponType !== 'pierce') {
            this.score -= 1000;
            this.player.weaponType = 'pierce';
            this.audio.playCoinSound();
            this.shopPurchased = true;
            this.updateShopUI();
        }
    }

    buyMagnet() {
        if (this.score >= 700 && !this.player.hasCoinMagnet) {
            this.score -= 700;
            this.player.hasCoinMagnet = true;
            this.audio.playCoinSound();
            this.shopPurchased = true;
            this.updateShopUI();
        }
    }
}
