import { Assets } from '../core/Assets.js';
import { CANVAS_WIDTH } from '../utils/Constants.js';

export class FloatingIsland {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.image = Assets.floatingIsland;

        // Scale the image to be slightly larger than the ground (0.5)
        const scale = 0.65;
        this.width = this.image.width * scale;
        this.height = this.image.height * scale;

        this.markedForDeletion = false;

        // Collision Box (Simplified to the bulk of the island, ignoring spikes/crystals for fairness)
        this.collisionPaddingX = this.width * 0.1;
        this.collisionPaddingY = this.height * 0.3;
    }

    getBounds() {
        return {
            x: this.x + this.collisionPaddingX,
            y: this.y + this.collisionPaddingY,
            width: this.width - (this.collisionPaddingX * 2),
            height: this.height - (this.collisionPaddingY * 2)
        };
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x -= this.speed * frameScale;

        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);

            // Debug: Show collision box
            /*
            const bounds = this.getBounds();
            ctx.strokeStyle = 'red';
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            */
        }
    }
}
