import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/Constants.js';

export class ParallaxLayer {
    constructor(image, speed, y = 0, scale = 1.0) {
        this.image = image;
        this.speed = speed;
        this.x = 0;
        this.y = y;
        this.scale = scale;
        // Calculate the effective width/height of one tile
        this.width = image.width * scale;
        this.height = image.height * scale;
    }

    update(baseSpeed, dt) {
        // baseSpeed is pixels per frame at 60fps
        // dt is seconds per frame
        // standard movement: speed * baseSpeed
        // with dt: speed * baseSpeed * (dt * 60)
        // This keeps existing speed values roughly valid relative to 60fps
        const frameScale = dt * 60;
        this.x -= this.speed * baseSpeed * frameScale;

        // Reset when the first tile has completely scrolled off-screen
        if (this.x <= -this.width) {
            this.x += this.width;
        }
    }

    draw(ctx) {
        // Draw tiles from current x position until we cover the screen width
        let currentDrawX = this.x;

        // Safety break to prevent infinite loops if width is 0 (shouldn't happen)
        if (this.width <= 0) return;

        while (currentDrawX < CANVAS_WIDTH) {
            // Only draw if the tile is at least partially visible on the right side
            // (Standard behavior: draw if x < canvas_width)

            ctx.drawImage(
                this.image,
                0, 0, this.image.width, this.image.height, // Source
                Math.floor(currentDrawX), this.y,        // Destination
                this.width, this.height                  // Destination Size
            );
            currentDrawX += this.width;
        }
    }
}

export class Environment {
    constructor(assets) {
        this.layers = [];
        this.baseSpeed = 2;

        // Backgrounds (Auto-scale to fill screen height)
        // Ensure perfect vertical fit for any resolution
        let startScale = 1.0;
        if (assets.cave_bg.naturalHeight > 0) {
            startScale = CANVAS_HEIGHT / assets.cave_bg.naturalHeight;
        }
        this.bgStart = new ParallaxLayer(assets.cave_bg, 0.2, 0, startScale);

        // Layer 1: Gameplay (cave_bg_play) - Auto-scale for 512px optimized image
        let playScale = 1.05; // Default for 512px (512 * 1.05 ≈ 537px)
        if (assets.cave_bg_play.naturalHeight > 0) {
            playScale = CANVAS_HEIGHT / assets.cave_bg_play.naturalHeight;
        }

        this.bgPlay = new ParallaxLayer(assets.cave_bg_play, 0.1, 0, playScale);

        // Mist Layer (Slower, Semi-transparent - Image optimized to 50%: 1024→512px)
        this.mistLayer = new ParallaxLayer(assets.mist, 0.3, -40, 2.6); // Adjusted from 1.3

        this.currentBg = this.bgStart; // Default

        // Ground Configuration (Images optimized to 50%: 1024→512px)
        this.groundSpeed = 0.4;
        this.groundScale = 0.5; // Adjusted from 0.25 for 512px images (was 1024px)
        this.groundY = CANVAS_HEIGHT - (assets.ground.height * this.groundScale);

        // Ground State
        this.hasGroundStarted = false;
        this.groundIntro = {
            img: assets.groundIntro,
            x: CANVAS_WIDTH, // Start off-screen
            width: assets.groundIntro.width * this.groundScale
        };

        this.groundLoop = {
            img: assets.ground,
            // Starts right after intro
            x: CANVAS_WIDTH + (assets.groundIntro.width * this.groundScale),
            width: assets.ground.width * this.groundScale
        };

        this.groundDelay = 120; // 2 seconds

        // Generate Collision Maps
        this.introMap = this.createCollisionMap(assets.groundIntro);
        this.loopMap = this.createCollisionMap(assets.ground);
    }

    createCollisionMap(image) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const data = ctx.getImageData(0, 0, image.width, image.height).data;

        // Store only alpha channel (every 4th byte) as boolean (1 or 0) for memory efficiency
        // Actually, just storing the thresholded alpha
        const map = new Uint8Array(image.width * image.height);
        for (let i = 0; i < map.length; i++) {
            map[i] = data[i * 4 + 3] > 200 ? 1 : 0; // Threshold 200/255
        }
        return { map, width: image.width, height: image.height };
    }

    checkCollision(player) {
        // Check Easter Egg Collision
        if (this.checkEasterEggCollision(player)) {
            return true;
        }

        if (!this.hasGroundStarted) return false;

        // Check 3 points at the bottom of the player
        // Left, Center, Right
        const points = [
            { x: player.x + 10, y: player.y + player.height - 5 }, // Inset slightly
            { x: player.x + player.width / 2, y: player.y + player.height - 2 },
            { x: player.x + player.width - 10, y: player.y + player.height - 5 }
        ];

        for (let p of points) {
            if (this.checkPoint(p.x, p.y)) return true;
        }
        return false;
    }

    checkPoint(gx, gy) {
        // gy must be within ground area
        if (gy < this.groundY) return false;

        const localY = Math.floor((gy - this.groundY) / this.groundScale);

        // Check Intro
        if (this.groundIntro.x > -this.groundIntro.width && gx >= this.groundIntro.x && gx < this.groundIntro.x + this.groundIntro.width) {
            const localX = Math.floor((gx - this.groundIntro.x) / this.groundScale);
            if (this.isSolid(this.introMap, localX, localY)) return true;
        }

        // Check Loop
        // The loop effectively covers everything after the intro.
        // Or if intro is gone, it covers everything.
        // We can just check "Is it in the loop area?"
        // The loop starts at [groundLoop.x] conceptually, but it tiles.

        // Simpler approach for loop:
        // Calculate offset from the "start" of the loop layer.
        // Since groundLoop.x moves left, (gx - groundLoop.x) tells us how far into the strip we are.
        // We use Modulo to wrap.

        const loopOffset = gx - this.groundLoop.x;
        if (loopOffset >= 0) { // Valid loop area
            const tileWidth = this.groundLoop.width; // This is SCALED width
            const relativeX = loopOffset % tileWidth;

            // Convert to texture coordinates
            const localX = Math.floor(relativeX / this.groundScale);

            if (this.isSolid(this.loopMap, localX, localY)) return true;
        }

        return false;
    }

    checkEasterEggCollision(entity) {
        if (!this.easterEgg) return false;

        const eggY = CANVAS_HEIGHT - this.easterEgg.height - 10;

        // 1. Broad Phase (AABB)
        if (
            entity.x < this.easterEgg.x + this.easterEgg.width &&
            entity.x + entity.width > this.easterEgg.x &&
            entity.y < eggY + this.easterEgg.height &&
            entity.y + entity.height > eggY
        ) {
            // 2. Narrow Phase (Pixel Perfect)
            // Check Corners + Center, but INSET them slightly to avoid hitting "empty" space of the bullet sprite
            // This tightens the "feel" of the collision.
            const insetX = entity.width * 0.2; // 20% inset
            const insetY = entity.height * 0.2; // 20% inset

            const points = [
                { x: entity.x + insetX, y: entity.y + insetY },
                { x: entity.x + entity.width - insetX, y: entity.y + insetY },
                { x: entity.x + insetX, y: entity.y + entity.height - insetY },
                { x: entity.x + entity.width - insetX, y: entity.y + entity.height - insetY },
                { x: entity.x + entity.width / 2, y: entity.y + entity.height / 2 }
            ];

            for (let p of points) {
                // Convert World Point -> Local Egg Point
                const localX = Math.floor((p.x - this.easterEgg.x) / this.easterEgg.scale);
                const localY = Math.floor((p.y - eggY) / this.easterEgg.scale);

                if (this.isSolid(this.easterEgg.map, localX, localY)) {
                    return true;
                }
            }
        }
        return false;
    }

    isSolid(mapData, x, y) {
        if (!mapData || x < 0 || x >= mapData.width || y < 0 || y >= mapData.height) return false;
        return mapData.map[y * mapData.width + x] === 1;
    }

    reset() {
        this.hasGroundStarted = false;
        this.groundTimer = 0;
        this.groundIntro.x = CANVAS_WIDTH;
        this.groundLoop.x = CANVAS_WIDTH + (this.groundIntro.width);
        this.easterEgg = null;

        // Ensure we are back to Start BG if reset? 
        // Usually reset means Restart Game.
        // If we go back to menu, we call setMode('START').
    }

    setMode(mode) {
        if (mode === 'PLAY') {
            this.currentBg = this.bgPlay;
        } else {
            this.currentBg = this.bgStart;
        }
    }

    update(dt, shouldAdvanceGround = true) {
        // If dt is undefined (first frame or safety), default to ~1/60
        if (!dt) dt = 0.016;

        // 1. Background moves
        this.currentBg.update(this.baseSpeed, dt);

        // Mist moves
        if (this.currentBg === this.bgPlay && this.mistLayer) {
            this.mistLayer.update(this.baseSpeed, dt);
        }

        // Mist moves
        if (this.currentBg === this.bgPlay) {
            this.mistLayer.update(this.baseSpeed, dt);
        }

        if (!shouldAdvanceGround) return;

        // 2. Timer for Ground Start
        if (!this.hasGroundStarted) {
            this.groundTimer++;
            if (this.groundTimer > this.groundDelay) {
                this.hasGroundStarted = true;
            }
        }

        // 3. Ground Movement
        if (this.hasGroundStarted) {
            const frameScale = dt * 60;
            const moveAmt = this.groundSpeed * this.baseSpeed * frameScale;

            // Move Intro
            this.groundIntro.x -= moveAmt;

            // Move Loop
            // If Intro is still on screen or just finishing, Loop follows it
            // Once Intro is gone, Loop tiles itself

            // Standard Loop Logic:
            // We can treat the loop layer as a standard infinite scroller that follows the intro.
            // But standard ParallaxLayer logic resets to 0 when < -width.
            // We need it to reset to 'x + width' to tile.

            // Let's manually manage the Loop strip.
            // The loop actually consists of infinite tiles.
            // We only need to track one 'head' tile position relative to the intro?

            // Actually, simpler:
            // Intro is distinct.
            // Loop Layer starts at Intro.x + Intro.width.
            // We update Loop Layer X.
            // If Loop Layer X goes too far left, we shift it right by its width to create the infinite effect,
            // BUT only if we don't expose a gap.
            // Since Intro eventually disappears, we can just switch to standard looping once intro is gone.

            this.groundLoop.x -= moveAmt;

            // Loop Logic
            // If the first loop tile is completely off screen...
            if (this.groundLoop.x <= -this.groundLoop.width) {
                this.groundLoop.x += this.groundLoop.width;
            }

            // Move Easter Egg
            if (this.easterEgg) {
                this.easterEgg.x -= moveAmt;
                if (this.easterEgg.x < -this.easterEgg.width) {
                    this.easterEgg = null; // Remove when off screen
                }
            }
        }
    }

    draw(ctx) {
        this.currentBg.draw(ctx);

        // Darken overlay for Play Background (Atmosphere)
        if (this.currentBg === this.bgPlay) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // 20% Darker
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Hardcoded canvas size or use CONSTANTS if imported (they aren't in this class scope easily without imports, wait, they likely are or I can use canvas dims from ctx)
            // Using values from context or just CANVAS_WIDTH/HEIGHT if imported.
            // Looking at file, CANVAS_WIDTH is imported.
        }

        // Draw Mist (Start or Play? User implies game scene)
        if (this.currentBg === this.bgPlay && this.mistLayer) {
            ctx.save();
            ctx.globalAlpha = 0.3; // Semi-transparent
            this.mistLayer.draw(ctx);
            ctx.restore();
        }

        if (this.hasGroundStarted) {
            // Draw Intro if visible
            if (this.groundIntro.x > -this.groundIntro.width && this.groundIntro.x < CANVAS_WIDTH) {
                ctx.drawImage(
                    this.groundIntro.img,
                    0, 0, this.groundIntro.img.width, this.groundIntro.img.height,
                    Math.floor(this.groundIntro.x), this.groundY,
                    this.groundIntro.width, this.groundIntro.img.height * this.groundScale
                );
            }

            // Draw Loop Tiles
            // We start drawing from groundLoop.x
            // But wait, groundLoop.x tracks the "first" tile of the infinite loop.
            // If Intro is still visible (x > -width), then groundLoop.x should be exactly Intro.x + Intro.width.
            // Does our logic guarantee that?
            // Yes, both move at same speed. Initial positions were aligned.
            // Only catch: The "Loop Logic" (if x < -width, x += width) might desync if we process it too early.
            // Actually, if Intro is at -100, and Loop is attached at +Width-100...
            // When Loop resets, it jumps back.
            // We just need to make sure we draw enough tiles to cover the screen.

            let currentX = this.groundLoop.x;

            // Optimization: If Intro is taking up screen space, we might not need to draw many loop tiles yet.
            // But standard loop is fine.

            while (currentX < CANVAS_WIDTH) {
                if (currentX > -this.groundLoop.width) {
                    ctx.drawImage(
                        this.groundLoop.img,
                        0, 0, this.groundLoop.img.width, this.groundLoop.img.height,
                        Math.floor(currentX), this.groundY,
                        this.groundLoop.width, this.groundLoop.img.height * this.groundScale
                    );
                }
                currentX += this.groundLoop.width;
            }
        }

        if (this.easterEgg) {
            ctx.drawImage(
                this.easterEgg.img,
                Math.floor(this.easterEgg.x),
                CANVAS_HEIGHT - this.easterEgg.height - 10, // Move up more
                this.easterEgg.width,  // Add scaled width
                this.easterEgg.height  // Add scaled height
            );
        }
    }

    spawnEasterEgg(assets) {
        // Calculate scale to fit nicely or just huge?
        // User said "Almost whole vertical space".
        // Let's assume the image is already sized or we scale it.
        // Let's safe-scale it to 80% of screen height if it's too big, or just draw it.
        // Assuming "ground_easter.png" is the asset.

        const img = assets.groundEaster;
        // Scale to 95% of screen height (Force it huge)
        let scale = (CANVAS_HEIGHT * 0.85) / img.height;

        this.easterEgg = {
            img: img,
            x: CANVAS_WIDTH,
            y: 0, // Calculated at draw time for bottom alignment
            width: img.width * scale,
            height: img.height * scale,
            scale: scale, // Store scale relative to original image
            map: this.createCollisionMap(img) // Create Collision Map!
        };
    }
}
