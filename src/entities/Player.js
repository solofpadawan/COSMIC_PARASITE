import { Assets } from '../core/Assets.js';
import { Keys, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/Constants.js';
import { Projectile } from './Projectile.js';

export class Player {
    constructor(audio) {
        this.audio = audio;
        this.x = 100;
        this.y = CANVAS_HEIGHT / 2;
        this.speed = 3.0;
        this.width = 75; // Increased Hitbox width (was 60)
        this.height = 37; // Increased Hitbox height (was 30)

        // Animation Standards (Optimized spritesheet: 2400x1792→600x448, 4 frames horizontal)
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 4;
        this.spriteWidth = 150; // 600px / 4 frames = 150px per frame
        this.spriteHeight = 112; // 448px / 4 (original had 4 rows, but we use 1)
        this.frameTimer = 0;
        this.frameInterval = 5;

        // Turn Animation State
        this.isTurning = false;
        this.turnTarget = null; // 'left' or 'right'
        this.turnIndex = 0;
        this.turnTimer = 0;
        this.turnSpeed = 7; // Frames per turn image
        this.turnMaxIndex = 4; // 0 to 4 (5 images)

        this.bullets = [];
        this.shootTimer = 0;
        this.canShoot = true;
        this.direction = 'right';
        this.bulletSpeedMultiplier = 1; // Default speed

        // Upgrades
        this.weaponType = 'single'; // 'single' ou 'spread'
        this.fireRateLevel = 0; // 0, 1, 2, 3
        this.baseShootCooldown = 25; // frames (Aumentou de 15 para 25 para reduzir cadência base)
        this.hasShield = false;
        this.shieldVisualTimer = 0;
        this.hasCoinMagnet = false;
    }

    startTurn(target) {
        this.isTurning = true;
        this.turnTarget = target;
        this.turnIndex = 0;
        this.turnTimer = 0;
    }

    updateTurn(frameScale = 1) {
        this.turnTimer += 1 * frameScale;
        if (this.turnTimer > this.turnSpeed) {
            this.turnIndex++;
            this.turnTimer = 0;

            if (this.turnIndex > this.turnMaxIndex) {
                // Turn Complete
                this.isTurning = false;
                this.direction = this.turnTarget;
                this.turnIndex = 0;
            }
        }
    }

    update(dt) {
        // Movement & Logic
        const frameScale = dt * 60;

        // Note: We decouple movement direction from facing direction state to handle turns

        if (Keys.ArrowUp || Keys.w) this.y -= this.speed * frameScale;
        if (Keys.ArrowDown || Keys.s) this.y += this.speed * frameScale;

        if (Keys.ArrowLeft || Keys.a) {
            this.x -= this.speed * frameScale;
            // Initiate Turn if facing right and not already turning
            if (this.direction === 'right' && !this.isTurning) {
                this.startTurn('left');
            }
            // If already facing left, ensure we stay left (unless turning back)
            if (this.direction === 'left' && !this.isTurning) {
                this.direction = 'left';
            }
        }

        if (Keys.ArrowRight || Keys.d) {
            this.x += this.speed * frameScale;
            // Initiate Turn if facing left and not already turning
            if (this.direction === 'left' && !this.isTurning) {
                this.startTurn('right');
            }
            if (this.direction === 'right' && !this.isTurning) {
                this.direction = 'right';
            }
        }

        // Logic Updates
        if (this.isTurning) {
            this.updateTurn(frameScale);
        }

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > CANVAS_WIDTH - this.width) this.x = CANVAS_WIDTH - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > CANVAS_HEIGHT - this.height) this.y = CANVAS_HEIGHT - this.height;

        // Standard Animation (Idle/Move)
        this.frameTimer += 1 * frameScale;
        if (this.frameTimer > this.frameInterval) {
            this.frameX++;
            if (this.frameX >= this.maxFrame) this.frameX = 0;
            this.frameTimer = 0;
        }

        // Shooting
        // Semi-automatic: Force release before shooting again
        if (Keys.Space) {
            if (this.canShoot && this.shootTimer <= 0) {
                this.shoot();
                // Calcula cooldown baseado no nível: ex: 25, 18, 11, 5
                const cooldown = Math.max(5, this.baseShootCooldown - (this.fireRateLevel * 7));
                this.shootTimer = cooldown;
                this.canShoot = false;
            }
        } else {
            this.canShoot = true;
        }

        if (this.shootTimer > 0) this.shootTimer -= 1 * frameScale;

        // Update Bullets
        this.bullets.forEach((bullet, index) => {
            bullet.update(dt);
            if (bullet.markedForDeletion) this.bullets.splice(index, 1);
        });
    }

    draw(ctx) {
        // Draw Bullets
        this.bullets.forEach(bullet => bullet.draw(ctx));

        // Draw Player or Turn Animation
        const scale = 0.60; // Adjusted for 25% sprites (0.15 * 4 = maintains visual size)

        if (this.isTurning) {
            // Draw Turn Sequence
            // Sequence 0..4
            // If turning Left (Right->Left): 05 to 01 (Index 4 to 0)
            // If turning Right (Left->Right): 01 to 05 (Index 0 to 4)

            let imgIndex;
            if (this.turnTarget === 'left') {
                imgIndex = 4 - this.turnIndex; // 4, 3, 2, 1, 0
            } else {
                imgIndex = this.turnIndex; // 0, 1, 2, 3, 4
            }

            // Safety clamp
            if (imgIndex < 0) imgIndex = 0;
            if (imgIndex > 4) imgIndex = 4;

            const turnImg = Assets.turn[imgIndex];

            if (turnImg) {
                // Center the turn image relative to player position
                // Assuming turn images are roughly same size as sprite frame?
                // Let's draw them with same scale/positioning logic for now
                // We might need to adjust offset if they shake

                // Use natural width of turn image? Or force size?
                // User didn't specify. I'll preserve aspect ratio but scale to similar local size.
                // Standard sprite is ~150px wide drawn.
                // Let's assume turn images are high res and scale them down too.
                // 600px -> 150px. Scale 0.25.

                const drawW = turnImg.width * scale;
                const drawH = turnImg.height * scale;

                // Centering correction
                const offsetX = (this.width - drawW) / 2;
                const offsetY = (this.height - drawH) / 2;

                ctx.drawImage(turnImg,
                    this.x - 7, this.y - 13, // Adjusted offsets for 0.125 scale
                    drawW, drawH
                );
            }

        } else {
            // Standard Draw
            const sprite = this.direction === 'left' ? Assets.helicopterLeft : Assets.helicopter;

            ctx.drawImage(
                sprite,
                this.frameX * this.spriteWidth, 0 * this.spriteHeight,
                this.spriteWidth, this.spriteHeight,
                this.x - 7, this.y - 13,
                this.spriteWidth * scale, this.spriteHeight * scale
            );
        }

        // Draw Shield
        if (this.hasShield) {
            this.shieldVisualTimer += 0.05;
            ctx.save();
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(this.shieldVisualTimer) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width * 0.75,
                this.height * 1.2,
                0, 0, Math.PI * 2
            );
            ctx.stroke();

            // Inner glow
            ctx.fillStyle = `rgba(0, 255, 255, 0.1)`;
            ctx.fill();
            ctx.restore();
        }
    }

    shoot() {
        if (this.bullets.length < 10) { // Aumentei o limite por causa de tiro duplo e cadência
            // If turning, fire in the target direction immediately
            const fireDirection = this.isTurning ? this.turnTarget : this.direction;

            const spawnX = fireDirection === 'right'
                ? this.x + this.width - 5
                : this.x - 20;

            if (this.weaponType === 'spread') {
                // Three bullets: Straight, Angled Up, Angled Down
                // Calculate normalized vectors so absolute speed is identical to single shot
                const baseSpeed = 6 * this.bulletSpeedMultiplier;
                const angle = 0.466; // approx Math.tan(25 degrees)

                // Calculate magnitude to normalize
                const mag = Math.sqrt(1 + angle * angle); // sqrt(1 + 0.217) = 1.103

                const vxNorm = baseSpeed / mag;
                const vyNorm = (baseSpeed * angle) / mag;

                const vxFront = fireDirection === 'right' ? vxNorm : -vxNorm;

                // Top (Angles Up)
                const b1 = new Projectile(spawnX, this.y + this.height / 2 - 20, { vx: vxFront, vy: -vyNorm }, 'missile', 1);
                // Mid (Straight)
                const b2 = new Projectile(spawnX, this.y + this.height / 2, fireDirection, 'missile', this.bulletSpeedMultiplier);
                // Bottom (Angles Down)
                const b3 = new Projectile(spawnX, this.y + this.height / 2 + 20, { vx: vxFront, vy: vyNorm }, 'missile', 1);

                this.bullets.push(b1, b2, b3);
            } else if (this.weaponType === 'pierce') {
                this.bullets.push(new Projectile(spawnX, this.y + this.height / 2, fireDirection, 'pierce', this.bulletSpeedMultiplier));
            } else {
                this.bullets.push(new Projectile(spawnX, this.y + this.height / 2, fireDirection, 'missile', this.bulletSpeedMultiplier));
            }

            if (this.audio) this.audio.playSFX('assets/audio/shoot.ogg');
        }
    }
}
