import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/Constants.js';

export class Starfield {
    constructor() {
        this.layers = [
            { speed: 0.2, stars: [], color: 'rgba(255, 255, 255, 0.3)' }, // Distant (Brightest)
            { speed: 1.0, stars: [], color: 'rgba(255, 255, 255, 0.6)' }, // Mid
            { speed: 2.0, stars: [], color: 'rgba(255, 255, 255, 1.0)' }  // Close (Darkest)
        ];
        this.baseSpeed = 1;
        this.init();
    }

    init() {
        this.layers.forEach((layer, index) => {
            const count = 10 + (index * 10);
            for (let i = 0; i < count; i++) {
                layer.stars.push({
                    x: Math.random() * CANVAS_WIDTH,
                    y: Math.random() * CANVAS_HEIGHT,
                    size: (index + 1) * 0.5 + Math.random() * 0.5
                });
            }
        });
    }

    update() {
        this.layers.forEach(layer => {
            layer.stars.forEach(star => {
                star.x -= layer.speed * this.baseSpeed;
                if (star.x < 0) {
                    star.x = CANVAS_WIDTH;
                    star.y = Math.random() * CANVAS_HEIGHT;
                }
            });
        });
    }

    draw(ctx) {
        this.layers.forEach(layer => {
            ctx.fillStyle = layer.color;
            layer.stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }
}
