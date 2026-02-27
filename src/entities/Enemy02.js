import { Assets } from '../core/Assets.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/Constants.js';
import { Projectile } from './Projectile.js';

export class Enemy02 {
    constructor(delayFrames, startY, phaseOffset) {
        this.type = 'enemy02';
        this.delay = delayFrames;

        // Visual Scale
        // The original image is 500x500. Player is ~100px.
        // Half size as requested by user.
        this.scale = 0.15;

        // Initial State
        this.startX = CANVAS_WIDTH + 100;
        this.startY = startY;

        this.x = this.startX;
        this.y = this.startY;

        this.width = 100 * this.scale;  // Placeholder until first draw
        this.height = 100 * this.scale;

        this.speed = 2.5; // Match similar horizontal speed to enemy01
        this.markedForDeletion = false;

        this.t = 0;
        this.isActive = false;
        this.age = 0;

        // Zigzag config
        // phaseOffset makes them wave together or separate
        this.phaseOffset = phaseOffset;
        this.amplitude = 200; // How high/low they go in the zigzag

        // Shooting
        this.shootTimer = Math.random() * 100 + 50;

        // Animation
        this.frames = Assets.enemy02;
        this.frameIndex = 0;
        this.frameDirection = 1;
        this.frameTimer = 0;
        this.frameInterval = 2; // Keep animation fast like Enemy01
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
        const speedFactor = 0.02; // Slower wave like enemy01
        this.t = this.age * speedFactor;

        // X: Move consistently from right to left
        this.x = this.startX - (this.age * this.speed);

        // Y: Zigzag (Sine wave) - inverted direction
        this.y = this.startY - Math.sin(this.t + this.phaseOffset) * this.amplitude;

        // Add a tiny bit of horizontal wobble for organic movement
        this.x += Math.sin(this.t * 3) * 15;

        // Cleanup
        if (this.x < -200) {
            this.markedForDeletion = true;
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
                    const spawnY = this.y + (this.height / 2) + 20;

                    // Calculate Vector to Player
                    let vx = -5; // Default left, slightly faster projectile
                    let vy = 0;

                    if (player) {
                        const targetX = player.x + (player.width / 2);
                        const targetY = player.y + (player.height / 2);

                        const dx = targetX - spawnX;
                        const dy = targetY - spawnY;

                        // ONLY shoot if player is in front (to the left)
                        if (dx < 0) {
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            if (distance > 0) {
                                const speed = 5;
                                vx = (dx / distance) * speed;
                                vy = (dy / distance) * speed;

                                projectiles.push(new Projectile(spawnX, spawnY, { vx, vy }, 'alien_spit'));
                            }
                        }
                    } else {
                        // If no player object, just shoot straightforward
                        projectiles.push(new Projectile(spawnX, spawnY, { vx, vy }, 'alien_spit'));
                    }
                }
                this.shootTimer = Math.random() * 100 + 80; // Reset timer (~1.3 - 3s)
            }
        }

        // --- Animation Logic (Loop from 0 to 47) ---
        if (this.frames && this.frames.length > 0) {
            this.frameTimer += 1 * frameScale;
            if (this.frameTimer > this.frameInterval) {
                this.frameIndex++;

                if (this.frameIndex >= this.frames.length) {
                    this.frameIndex = 0; // Loop back to start
                }

                this.frameTimer = 0;
            }
        }
    }

    draw(ctx) {
        if (this.isActive && this.frames && this.frames.length > 0) {
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
