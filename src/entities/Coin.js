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

    update(dt, player) {
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

        // Magnetism Logic
        if (player && player.hasCoinMagnet) {
            // Calculate center points
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const px = player.x + player.width / 2;
            const py = player.y + player.height / 2;

            const dx = px - cx;
            const dy = py - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Magnet Radius of 500px translates into strong pull
            const magnetRadius = 300;
            if (dist < magnetRadius && dist > 0) {
                // The closer the coin is, the faster it pulls, or just a constant magnet speed
                const pullSpeed = 4.0; // Diminuído pela metade a pedido do jogador (15 -> 7.5)
                this.x += (dx / dist) * pullSpeed;
                // Important: adjust baseY so the sine wave doesn't rubber-band it back down
                this.baseY += (dy / dist) * pullSpeed;
            }
        }
    }

    draw(ctx) {
        if (this.markedForDeletion) return;
        const img = this.frames[this.frameIndex];
        if (img) {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        }
    }
}
