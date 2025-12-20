export class AudioManager {
    constructor() {
        this.music = null;
        this.fadeInterval = null;
    }

    playMusic(src) {
        // Stop previous fade if running
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }

        this.music = new Audio(src);
        this.music.loop = true;
        this.music.volume = 0.5; // Default volume
        this.isLocked = true;

        // Handling autoplay policies
        this.nextUnlockAttempt = 0;

        this.unlock = () => {
            const now = Date.now();
            if (now < this.nextUnlockAttempt) return;

            this.music.play().then(() => {
                this.isLocked = false;
                window.removeEventListener('keydown', this.unlock);
                window.removeEventListener('click', this.unlock);
            }).catch(e => {
                if (e.name === 'NotAllowedError') {
                    this.nextUnlockAttempt = now + 1000;
                } else {
                    console.log("Unlock failed", e);
                }
            });
        };

        const tryPlay = () => {
            this.music.play().then(() => {
                this.isLocked = false;
            }).catch(e => {
                console.log("Audio autoplay blocked, waiting for interaction", e);
                window.addEventListener('keydown', this.unlock, { once: true });
                window.addEventListener('click', this.unlock, { once: true });
            });
        };

        tryPlay();
    }

    playSFX(src) {
        const sfx = new Audio(src);
        sfx.volume = 0.4;
        sfx.play().catch(e => {
            // Ignore autoplay errors for rapid fire sfx usually
        });
    }

    playCoinSound() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext(); // Ideally reuse a global context, but disjointed logic implies local for now or shared.
        // Actually, creating contexts repeatedly is bad. We should have a shared one if possible, but for specific synth sfx:

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.1); // Ding up

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);

        // Cleanup
        setTimeout(() => {
            ctx.close();
        }, 200);
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    fadeOut(duration = 1.0) {
        if (!this.music) return;

        // Clear any existing fade
        if (this.fadeInterval) clearInterval(this.fadeInterval);

        const startVolume = this.music.volume;
        const fadeStep = 0.05;
        const intervalTime = (duration * 1000) / (startVolume / fadeStep);

        this.fadeInterval = setInterval(() => {
            if (this.music.volume > fadeStep) {
                if (this.music) {
                    this.music.volume -= fadeStep;
                }
            } else {
                if (this.music) this.music.volume = 0;
                this.stopMusic();
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
            }
        }, intervalTime);
    }

    pause() {
        if (this.music) {
            this.music.pause();
        }
    }

    resume() {
        if (this.music) {
            this.music.play();
        }
    }
}
