import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/Constants.js';

export class LightingSystem {
    constructor() {
        // Create offscreen canvas for the lightmap
        this.canvas = document.createElement('canvas');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx = this.canvas.getContext('2d');

        // How dark the ambient shadow is (0.0 = no shadow, 1.0 = pitch black)
        this.ambientDarkness = 0.60; //era 0.65

        this.enabled = true;
    }

    /**
     * Start a new lighting frame — fills the offscreen canvas with darkness.
     */
    beginFrame() {
        if (!this.enabled) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Fill with dark overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${this.ambientDarkness})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    /**
     * Add a light source that cuts through the darkness.
     * @param {number} x - Center X of the light
     * @param {number} y - Center Y of the light
     * @param {number} radius - Radius of the light in pixels
     * @param {string} color - CSS color string for the light tint (e.g. '#FF6600')
     * @param {number} intensity - Light intensity (0.0 to 1.0)
     */
    addLight(x, y, radius, color, intensity = 1.0) {
        if (!this.enabled) return;

        const ctx = this.ctx;

        // Step 1: Cut a hole in the darkness
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        const cutGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cutGradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
        cutGradient.addColorStop(0.5, `rgba(0, 0, 0, ${intensity * 0.5})`);
        cutGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = cutGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Step 2: Add colored glow on top
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // Parse color to get RGB components
        const rgb = this.parseColor(color);
        const glowAlpha = intensity * 0.4; // More vibrant color tint

        const colorGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.7);
        colorGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowAlpha})`);
        colorGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.fillStyle = colorGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Render the lightmap overlay on top of the main canvas.
     */
    render(ctx) {
        if (!this.enabled) return;
        ctx.drawImage(this.canvas, 0, 0);
    }

    /**
     * Parse a hex color string to RGB components.
     */
    parseColor(color) {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16)
            };
        }
        // Default fallback
        return { r: 255, g: 255, b: 255 };
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}
