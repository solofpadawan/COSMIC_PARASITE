import { Assets } from '../core/Assets.js';

export class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frames = Assets.explosionEnemy01;
        this.frameIndex = 0;
        this.markedForDeletion = false;

        // Animation Control
        this.frameTimer = 0;
        this.frameInterval = 1; // Fast explosion

        // Center the explosion?
        // Assuming the frames are roughly centered or scaled properly.
        // If necessary we can offset.
        this.width = 100; // Placeholder
        this.height = 100;
    }

    update(dt) {
        const frameScale = dt * 60;
        this.frameTimer += 1 * frameScale;
        if (this.frameTimer > this.frameInterval) {
            this.frameIndex++;
            this.frameTimer = 0;

            if (this.frameIndex >= this.frames.length) {
                this.markedForDeletion = true;
            }
        }
    }

    draw(ctx) {
        if (this.frameIndex < this.frames.length) {
            const img = this.frames[this.frameIndex];
            if (img && img.complete) {
                // Scale Config
                const scale = 2.5; // Much bigger!

                const w = img.width * scale;
                const h = img.height * scale;

                // Draw Centered on this.x, this.y
                ctx.drawImage(img, this.x - (w / 2), this.y - (h / 2), w, h);
            }
        }
    }
}
