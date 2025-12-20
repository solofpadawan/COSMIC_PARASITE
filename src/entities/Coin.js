import { Assets } from '../core/Assets.js';

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.width = 40; // Approx size
        this.height = 40;
        this.frames = Assets.coin;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameSpeed = 2; // Animation speed

        this.floatTimer = 0;
        this.markedForDeletion = false;

        // Auto-despawn after 10 seconds
        this.lifeTime = 0;
        this.maxLifeTime = 600; // 10s at 60fps
    }

    update(dt) {
        // Animation
        this.frameTimer++;
        if (this.frameTimer >= this.frameSpeed) {
            this.frameTimer = 0;
            this.frameIndex++;
            if (this.frameIndex >= this.frames.length) {
                this.frameIndex = 0;
            }
        }

        // Floating Physics (Sine wave)
        this.floatTimer += dt * 5;
        this.y = this.baseY + Math.sin(this.floatTimer) * 10;

        // Lifetime
        this.lifeTime++;
        if (this.lifeTime > this.maxLifeTime) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        const img = this.frames[this.frameIndex];
        if (img) {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        }
    }
}
