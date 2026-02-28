import { getCurrentLanguage } from '../utils/Language.js';

export const Assets = {
    helicopter: new Image(),
    helicopterLeft: new Image(),
    missile: new Image(),
    cave_bg: new Image(),
    cave_bg_play: new Image(),
    cave_bg_rusty_part1: new Image(),
    cave_bg_rusty_part2: new Image(),
    cave_bg_rusty_part3: new Image(),
    cave_bg_rusty_full: new Image(),
    mist: new Image(),
    alien_spit: new Image(),
    ground: new Image(),
    groundIntro: new Image(),
    logo: new Image(),
    groundShop: new Image(),
    groundShopClosed: new Image(),
    turn: [], // Array for turn frames
    coin: [], // Array for Coin frames
    speedUp: [], // Speed-up powerup frames
    enemy01: [], // Array for Enemy 01 frames
    enemy02: [], // Array for Enemy 02 frames
    explosionEnemy01: [], // Explosion frames
    alienHand: new Image(), // Shop selector hand
    floatingIsland: new Image(), // Floating island obstacle
    audio: {
        shoot: new Audio(),
        explosion: new Audio()
    }
};

export function loadAssets(onProgress) {
    return new Promise((resolve) => {
        let loaded = 0;
        // Base images (19) + Turn (5) + Audio (4+6) + Enemy (45) + Explosion (28) + Coin (23) + Enemy02 (48) + SpeedUp (47)
        // 19 + 5 + 10 + 45 + 28 + 23 + 48 + 47 = 225
        const total = 225;

        const onLoad = () => {
            loaded++;
            if (onProgress) {
                const percent = Math.floor((loaded / total) * 100);
                onProgress(percent);
            }
            if (loaded >= total) resolve();
        };

        Assets.helicopter.src = 'assets/images/helicoptero_alpha.png';
        Assets.helicopter.onload = onLoad;

        Assets.helicopterLeft.src = 'assets/images/helicoptero_left_alpha.png';
        Assets.helicopterLeft.onload = onLoad;

        Assets.missile.src = 'assets/images/missile_fixed.png';
        Assets.missile.onload = onLoad;

        Assets.cave_bg.src = 'assets/images/cave_bg_intro_v3.png'; // New background for Start
        Assets.cave_bg.onload = onLoad;

        Assets.cave_bg_play.src = 'assets/images/cave_bg_huge.png'; // New for Play
        Assets.cave_bg_play.onload = onLoad;

        Assets.cave_bg_rusty_part1.src = 'assets/images/cave_bg_rusty_part1_v2.png';
        Assets.cave_bg_rusty_part1.onload = onLoad;
        Assets.cave_bg_rusty_part2.src = 'assets/images/cave_bg_rusty_part2_v2.png';
        Assets.cave_bg_rusty_part2.onload = onLoad;
        Assets.cave_bg_rusty_part3.src = 'assets/images/cave_bg_rusty_part3_v2.png';
        Assets.cave_bg_rusty_part3.onload = onLoad;

        Assets.cave_bg_rusty_full.src = 'assets/images/cave_bg_rusty.png';
        Assets.cave_bg_rusty_full.onload = onLoad;

        Assets.ground.src = 'assets/images/ground_v4.png';
        Assets.ground.onload = onLoad;

        const langStr = getCurrentLanguage() === 'pt' ? 'portuguese' : 'english';

        Assets.groundShop.src = `assets/images/ground_v4_shop_open(${langStr}).png`;
        Assets.groundShop.onload = onLoad;

        Assets.groundShopClosed.src = `assets/images/ground_v4_shop_close(${langStr}).png`;
        Assets.groundShopClosed.onload = onLoad;

        Assets.mist.src = 'assets/images/mist_texture.png';
        Assets.mist.onload = onLoad;

        Assets.alien_spit.src = 'assets/images/alien-spit.png';
        Assets.alien_spit.onload = onLoad;

        Assets.groundIntro.src = 'assets/images/ground_intro.png';
        Assets.groundIntro.onload = onLoad;

        Assets.groundEaster = new Image();
        Assets.groundEaster.src = 'assets/images/ground_easter.png';
        Assets.groundEaster.onload = onLoad;

        Assets.logo.src = 'assets/images/logo_v7.png';
        Assets.logo.onload = onLoad;

        Assets.alienHand.src = 'assets/images/alien_hand.png';
        Assets.alienHand.onload = onLoad;

        Assets.floatingIsland.src = 'assets/images/floating_island01.png';
        Assets.floatingIsland.onload = onLoad;

        // Load Turn Frames (01.png to 05.png)
        for (let i = 1; i <= 5; i++) {
            const img = new Image();
            img.src = `assets/images/turn/0${i}.png`; // e.g., assets/images/turn/01.png
            img.onload = onLoad;
            Assets.turn.push(img);
        }

        // Audio Preload
        // Audio Preload
        Assets.audio.shoot.src = 'assets/audio/shoot.ogg';
        Assets.audio.shoot.oncanplaythrough = onLoad;

        Assets.audio.explosion.src = 'assets/audio/explosion-enemy01.ogg';
        Assets.audio.explosion.oncanplaythrough = onLoad;

        Assets.audio.speedUpVoice = new Audio();
        Assets.audio.speedUpVoice.src = 'assets/audio/speed_up-voice.ogg';
        Assets.audio.speedUpVoice.oncanplaythrough = onLoad;

        Assets.audio.speedUpSound = new Audio();
        Assets.audio.speedUpSound.src = 'assets/audio/speed-up-sound.ogg';
        Assets.audio.speedUpSound.oncanplaythrough = onLoad;

        // Fallback in case audio fails or formats weirdly
        const audioErrorFallback = (name) => {
            console.warn(`Failed to load ${name}`);
            onLoad();
        };

        Assets.audio.shoot.onerror = () => audioErrorFallback("shoot.ogg");
        Assets.audio.explosion.onerror = () => audioErrorFallback("explosion-enemy01.ogg");
        Assets.audio.speedUpVoice.onerror = () => audioErrorFallback("speed_up-voice.ogg");
        Assets.audio.speedUpSound.onerror = () => audioErrorFallback("speed-up-sound.ogg");

        // Shop Purchase Audio Preload
        Assets.audio.chaChing = new Audio();
        Assets.audio.chaChing.src = 'assets/audio/register-cha-ching.ogg';
        Assets.audio.chaChing.oncanplaythrough = onLoad;
        Assets.audio.chaChing.onerror = () => audioErrorFallback("register-cha-ching.ogg");

        Assets.audio.tripleShot = new Audio();
        Assets.audio.tripleShot.src = 'assets/audio/triple_shot.ogg';
        Assets.audio.tripleShot.oncanplaythrough = onLoad;
        Assets.audio.tripleShot.onerror = () => audioErrorFallback("triple_shot.ogg");

        Assets.audio.cadence = new Audio();
        Assets.audio.cadence.src = 'assets/audio/cadence.ogg';
        Assets.audio.cadence.oncanplaythrough = onLoad;
        Assets.audio.cadence.onerror = () => audioErrorFallback("cadence.ogg");

        Assets.audio.extraShield = new Audio();
        Assets.audio.extraShield.src = 'assets/audio/extra-shield.ogg';
        Assets.audio.extraShield.oncanplaythrough = onLoad;
        Assets.audio.extraShield.onerror = () => audioErrorFallback("extra-shield.ogg");

        Assets.audio.piercingMissile = new Audio();
        Assets.audio.piercingMissile.src = 'assets/audio/piercing_missile.ogg';
        Assets.audio.piercingMissile.oncanplaythrough = onLoad;
        Assets.audio.piercingMissile.onerror = () => audioErrorFallback("piercing_missile.ogg");

        Assets.audio.coinMagnet = new Audio();
        Assets.audio.coinMagnet.src = 'assets/audio/coin-magnet.ogg';
        Assets.audio.coinMagnet.oncanplaythrough = onLoad;
        Assets.audio.coinMagnet.onerror = () => audioErrorFallback("coin-magnet.ogg");

        // Load Enemy 01 Frames (000000.png to 000044.png)
        for (let i = 0; i <= 44; i++) {
            const img = new Image();
            // Pad start with zeros to 6 digits
            const num = i.toString().padStart(6, '0');
            img.src = `assets/images/enemy01/${num}.png`;
            img.onload = onLoad;
            img.onerror = () => {
                console.warn(`Failed to load enemy frame ${num}`);
                onLoad(); // Proceed anyway
            };
            Assets.enemy01.push(img);
        }

        // Load Enemy 02 Frames (000000.png to 000047.png)
        for (let i = 0; i <= 47; i++) {
            const img = new Image();
            // Pad start with zeros to 6 digits
            const num = i.toString().padStart(6, '0');
            img.src = `assets/images/enemy02/${num}.png`;
            img.onload = onLoad;
            img.onerror = () => {
                console.warn(`Failed to load enemy02 frame ${num}`);
                onLoad(); // Proceed anyway
            };
            Assets.enemy02.push(img);
        }

        // Load Explosion Frames (0001.png to 0028.png)
        for (let i = 1; i <= 28; i++) {
            const img = new Image();
            const num = i.toString().padStart(4, '0');
            img.src = `assets/images/explosion-enemy01/${num}.png`;
            img.onload = onLoad;
            img.onerror = () => {
                console.warn(`Failed to load explosion frame ${num}`);
                onLoad();
            };
            Assets.explosionEnemy01.push(img);
        }

        // Load Coin Frames (000000.png to 000022.png)
        // 23 frames
        for (let i = 0; i <= 22; i++) {
            const img = new Image();
            const num = i.toString().padStart(6, '0');
            img.src = `assets/images/coin/coin_${num}.png`; // CHECK NAME FORMAT
            img.onload = onLoad;
            img.onerror = () => {
                console.warn(`Failed to load coin frame ${num}`);
                onLoad();
            };
            Assets.coin.push(img);
        }

        // Load Speed-Up Frames (000000.png to 000046.png)
        for (let i = 0; i <= 46; i++) {
            const img = new Image();
            const num = i.toString().padStart(6, '0');
            img.src = `assets/images/speed-up/speed-up_${num}.png`;
            img.onload = onLoad;
            img.onerror = () => {
                console.warn(`Failed to load speed-up frame ${num}`);
                onLoad();
            };
            Assets.speedUp.push(img);
        }
    });
}
