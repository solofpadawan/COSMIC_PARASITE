export const Assets = {
    helicopter: new Image(),
    helicopterLeft: new Image(),
    missile: new Image(),
    cave_bg: new Image(),
    cave_bg_play: new Image(),
    mist: new Image(),
    alien_spit: new Image(),
    ground: new Image(),
    groundIntro: new Image(),
    logo: new Image(),
    turn: [], // Array for turn frames
    coin: [], // Array for Coin frames
    enemy01: [], // Array for Enemy 01 frames
    explosionEnemy01: [], // Explosion frames
    audio: {
        shoot: new Audio(),
        explosion: new Audio()
    }
};

export function loadAssets(onProgress) {
    return new Promise((resolve) => {
        let loaded = 0;
        // Base images (11) + Turn (5) + Audio (2) + Enemy (45) + Explosion (28) + Coin (23)
        // 11 + 5 + 2 + 45 + 28 + 23 = 114
        const total = 114;

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

        Assets.cave_bg.src = 'assets/images/cave_bg_v2.png'; // Old for Start
        Assets.cave_bg.onload = onLoad;

        Assets.cave_bg_play.src = 'assets/images/cave_bg_huge.png'; // New for Play
        Assets.cave_bg_play.onload = onLoad;

        Assets.ground.src = 'assets/images/ground_v4.png';
        Assets.ground.onload = onLoad;

        Assets.mist.src = 'assets/images/mist_texture.png';
        Assets.mist.onload = onLoad;

        Assets.alien_spit.src = 'assets/images/alien-spit.png';
        Assets.alien_spit.onload = onLoad;

        Assets.groundIntro.src = 'assets/images/ground_intro.png';
        Assets.groundIntro.onload = onLoad;

        Assets.groundEaster = new Image();
        Assets.groundEaster.src = 'assets/images/ground_easter.png';
        Assets.groundEaster.onload = onLoad;

        Assets.logo.src = 'assets/images/logo_v5.png';
        Assets.logo.onload = onLoad;

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

        // Fallback in case audio fails or formats weirdly
        Assets.audio.shoot.onerror = () => {
            console.warn("Failed to load shoot.ogg");
            onLoad();
        };

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
    });
}
