import { Assets } from '../core/Assets.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/Constants.js';

export class Projectile {
    constructor(x, y, directionOrVelocity, type = 'missile', speedMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;

        let baseSpeed = 6;
        let speed = baseSpeed * speedMultiplier;
        if (this.type === 'alien_spit') {
            speed = 4;
            this.width = 30;
            this.height = 15;
        } else if (this.type === 'giant_missile') {
            this.width = 45 * 4; // 225
            this.height = 22 * 4; // 110
        } else if (this.type === 'pierce') {
            this.width = 45 * 1.8; // Maior (81)
            this.height = 22 * 1.8; // Maior (39.6)
            // Velocidade pode ser a mesma ou um pouco mais rápido/devagar. Manteremos igual por enquanto
        } else {
            this.width = 45;
            this.height = 22;
        }

        // Handle Velocity
        if (typeof directionOrVelocity === 'string') {
            this.direction = directionOrVelocity;
            this.vx = (this.direction === 'right') ? speed : -speed;
            this.vy = 0;
        } else {
            // Assume object {vx, vy}
            this.vx = directionOrVelocity.vx;
            this.vy = directionOrVelocity.vy;
            this.direction = (this.vx > 0) ? 'right' : 'left';
        }

        // Calculate rotation angle based on velocity vector
        this.angle = Math.atan2(this.vy, this.vx);
        // Correct angle for left-facing sprites if necessary, but since we scale(-1, 1) later
        // we might just use the raw angle or absolute angle.
        // If moving left, atan2 gives angle from positive X axis (e.g., 170 deg).
        // Since we flip the rendering horizontally for left direction, 
        // the visual rotation needs to be adjusted.
        if (this.direction === 'left') {
            // When flipped, the sprite inherently faces left (180 deg).
            // We only need the extra tilt (vy correlation).
            // If vy is positive (down), mathematically atan2 gives positive angle > 90.
            // But when flipped contextually, tilting 'down' requires negative rotation in flipped space?
            // Let's use Math.atan(vy/abs(vx)) to get just the local tilt.
            this.angle = Math.atan2(this.vy, Math.abs(this.vx));
        }

        // Animation (Missile Only - Optimized spritesheet: 1721x1696→430x424, 25%)
        this.currentFrame = 0;
        this.totalFrames = 10;
        this.cols = 2;
        this.spriteWidth = 215; // 430 / 2 cols = 215px per frame
        this.spriteHeight = 85; // 425 / 5 rows = 85px per frame (fixed)
        this.frameTimer = 0;
        this.frameInterval = 6;
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;

        // Allow giant missiles to go further off screen before deletion (because they are huge)
        const margin = (this.type === 'giant_missile') ? 300 : 50;
        if (this.x > CANVAS_WIDTH + margin || this.x < -margin ||
            this.y > CANVAS_HEIGHT + margin || this.y < -margin) {
            this.markedForDeletion = true;
        }

        // Animate Missile
        if (this.type === 'missile' || this.type === 'giant_missile' || this.type === 'pierce') {
            this.frameTimer += 1 * frameScale;
            if (this.frameTimer > this.frameInterval) {
                this.currentFrame++;
                if (this.currentFrame >= this.totalFrames) this.currentFrame = 0;
                this.frameTimer = 0;
            }
        }
    }

    draw(ctx) {
        if (this.markedForDeletion) return;
        if (this.type === 'missile' || this.type === 'giant_missile' || this.type === 'pierce') {
            if (Assets.missile.complete && Assets.missile.naturalWidth > 0) {
                let col = this.currentFrame % this.cols;
                let row = Math.floor(this.currentFrame / this.cols);

                ctx.save();

                // Normal Missile Logic (and Giant Missile)
                if (this.direction === 'left') {
                    // Translate to the center of the projectile for rotation
                    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                    ctx.scale(-1, 1);
                    ctx.rotate(this.angle); // Apply tilt
                    ctx.drawImage(
                        Assets.missile,
                        col * this.spriteWidth, row * this.spriteHeight,
                        this.spriteWidth, this.spriteHeight,
                        -this.width / 2, -this.height / 2 - 5, // Center offset
                        this.width, this.height
                    );
                } else {
                    // Translate to the center of the projectile for rotation
                    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                    ctx.rotate(this.angle); // Apply tilt
                    ctx.drawImage(
                        Assets.missile,
                        col * this.spriteWidth, row * this.spriteHeight,
                        this.spriteWidth, this.spriteHeight,
                        -this.width / 2, -this.height / 2 - 5, // Center offset
                        this.width, this.height
                    );
                }
                ctx.restore();
            }
        } else if (this.type === 'alien_spit') {
            if (Assets.alien_spit.complete) {
                ctx.save();
                if (this.direction === 'right') {
                    ctx.translate(this.x + this.width, this.y);
                    ctx.scale(-1, 1);
                    ctx.drawImage(Assets.alien_spit, 0, 0, this.width, this.height);
                } else {
                    ctx.drawImage(Assets.alien_spit, this.x, this.y, this.width, this.height);
                }
                ctx.restore();
            } else {
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        }
    }
}
