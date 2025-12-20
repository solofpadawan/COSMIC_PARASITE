import { Assets } from '../core/Assets.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/Constants.js';
import { Projectile } from './Projectile.js';

export class Enemy {
    constructor(delayFrames, directionY = 1) {
        this.type = 'enemy01';
        this.delay = delayFrames;

        // Visual Scale (Adjusted for 25% resized sprites: 166px instead of 664px)
        this.scale = 0.48; // 0.12 * 4 = maintains same visual size

        // Initial State
        this.directionY = directionY; // 1 = Down (Top start), -1 = Up (Bottom start)

        this.startX = CANVAS_WIDTH + 50;

        if (this.directionY === 1) {
            this.startY = -250; // Start Top
        } else {
            this.startY = CANVAS_HEIGHT + 50; // Start Bottom (Higher up as requested)
        }

        this.x = this.startX;
        this.y = this.startY;

        this.width = 100 * this.scale;  // Placeholder until first draw
        this.height = 100 * this.scale;

        this.speed = 4;
        this.markedForDeletion = false;

        this.t = 0;
        this.isActive = false;
        this.age = 0;

        // Shooting
        this.shootTimer = Math.random() * 100 + 50; // Initial random delay

        // Animation
        this.frames = Assets.enemy01;
        this.frameIndex = 0;
        this.frameDirection = 1;
        this.frameTimer = 0;
        this.frameInterval = 2;
    }

    update(projectiles, player, dt) {
        // Handle Delay
        const frameScale = dt * 60;

        if (this.delay > 0) {
            this.delay -= 1 * frameScale;
            return;
        }
        this.isActive = true;
        this.age += 1 * frameScale;

        // --- Path Logic ---
        // Top-Right Entry -> Maneuvers -> Bottom-Right Exit
        const speedFactor = 0.005;
        this.t = this.age * speedFactor;

        // X: Enters from Right, sweeps left, returns Right.
        const mainSweep = Math.cos(this.t * 1.5) * 400;
        this.x = (CANVAS_WIDTH - 200) + mainSweep;

        // Y: Linear progression 
        const verticalSpeed = 1.0;
        this.y = this.startY + (this.age * verticalSpeed * this.directionY);

        // Add "Maneuvers" (Wobbles)
        // Adds the "squiggly" look
        this.x += Math.sin(this.t * 8) * 50; // Horizontal wobble
        this.y += Math.cos(this.t * 6) * 30; // Vertical wobble

        // Cleanup
        if (this.directionY === 1) {
            if (this.y > CANVAS_HEIGHT + 100) this.markedForDeletion = true;
        } else {
            if (this.y < -150) this.markedForDeletion = true;
        }

        // --- Shooting Logic ---
        if (this.isActive) {
            this.shootTimer -= 1 * frameScale;
            if (this.shootTimer <= 0) {
                // Check if visible before shooting
                const isVisible = (
                    this.x < CANVAS_WIDTH &&
                    this.x + this.width > 0 &&
                    this.y < CANVAS_HEIGHT &&
                    this.y + this.height > 0
                );

                if (isVisible && projectiles) {
                    // Fire from the "mouth" (approx center-left)
                    const spawnX = this.x;
                    const spawnY = this.y + (this.height / 2);

                    // Calculate Vector to Player
                    let vx = -4; // Default left
                    let vy = 0;

                    if (player) {
                        const targetX = player.x + (player.width / 2);
                        const targetY = player.y + (player.height / 2);

                        const dx = targetX - spawnX;
                        const dy = targetY - spawnY;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance > 0) {
                            const speed = 4;
                            vx = (dx / distance) * speed;
                            vy = (dy / distance) * speed;
                        }
                    }

                    projectiles.push(new Projectile(spawnX, spawnY, { vx, vy }, 'alien_spit'));
                }
                this.shootTimer = Math.random() * 100 + 100; // Reset timer (~1.5 - 3s)
            }
        }

        // --- Animation Logic (Ping Pong) ---
        if (this.frames.length > 0) {
            this.frameTimer += 1 * frameScale;
            if (this.frameTimer > this.frameInterval) {
                this.frameIndex += this.frameDirection;

                if (this.frameIndex >= this.frames.length - 1) {
                    this.frameIndex = this.frames.length - 1;
                    this.frameDirection = -1;
                } else if (this.frameIndex <= 0) {
                    this.frameIndex = 0;
                    this.frameDirection = 1;
                }

                this.frameTimer = 0;
            }
        }
    }

    draw(ctx) {
        if (this.isActive && this.frames.length > 0) {
            const img = this.frames[this.frameIndex];
            if (img && img.complete) {
                // Resize based on scale
                const w = img.width * this.scale;
                const h = img.height * this.scale;

                ctx.drawImage(img, this.x, this.y, w, h);

                this.width = w;
                this.height = h;
            }
        }
    }
}
