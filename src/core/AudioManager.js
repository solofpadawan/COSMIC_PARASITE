export class AudioManager {
    constructor() {
        this.music = null;
        this.fadeInterval = null;
        this.muted = false;
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.music) {
            this.music.muted = this.muted;
        }
        console.log("Audio:", this.muted ? "MUTED" : "UNMUTED");
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
        this.music.muted = this.muted; // Respect current muted state
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

    playSFX(audioOrSrc, volume = 0.4) {
        if (this.muted) return;

        let sfx;
        if (typeof audioOrSrc === 'string') {
            sfx = new Audio(audioOrSrc);
        } else if (audioOrSrc instanceof Audio) {
            // Use cloneNode to allow overlapping sound playback
            sfx = audioOrSrc.cloneNode();
        } else {
            return;
        }

        sfx.volume = volume;
        sfx.play().catch(e => {
            // Ignore autoplay errors
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

    playFlickerSound() {
        if (this.muted || this.isLocked) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        try {
            const ctx = new AudioContext();
            const duration = 1.5;

            // 1. High-pitched fluorescent "whine" with erratic pitch fluctuations
            const whineOsc = ctx.createOscillator();
            whineOsc.type = 'sine'; // Thin, pure tone
            const baseFreq = 2500 + Math.random() * 1500; // Between 2500 and 4000Hz (random pitch each time)
            whineOsc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

            // Add chaotic pitch jumps to simulate failing ballast
            let nextTime = 0.1;
            while (nextTime < duration) {
                const pitchShift = baseFreq + (Math.random() * 800 - 400);
                whineOsc.frequency.linearRampToValueAtTime(pitchShift, ctx.currentTime + nextTime);
                nextTime += 0.1 + Math.random() * 0.3;
            }

            const whineGain = ctx.createGain();
            whineGain.gain.value = 0.005 + Math.random() * 0.01; // Extremely quiet background ringing

            whineOsc.connect(whineGain);
            whineGain.connect(ctx.destination);

            // 2. Electrical Sparks / Crackling (Completely procedural randomness)
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            // State machine to generate truly random electric burst clusters
            let inBurst = false;
            let samplesLeftInState = 0;

            for (let i = 0; i < bufferSize; i++) {
                if (samplesLeftInState <= 0) {
                    // Randomly decide whether to crackle or be silent
                    inBurst = Math.random() > 0.5; // 50% chance of quick crackle
                    if (inBurst) {
                        samplesLeftInState = Math.floor(Math.random() * ctx.sampleRate * 0.08); // Burst up to 80ms
                    } else {
                        samplesLeftInState = Math.floor(Math.random() * ctx.sampleRate * 0.15); // Silence up to 150ms
                    }
                }
                samplesLeftInState--;

                if (inBurst) {
                    // Sparse hash noise
                    if (Math.random() > 0.5) {
                        data[i] = (Math.random() * 2 - 1) * Math.random();
                    } else {
                        data[i] = 0;
                    }
                } else {
                    // Occasional stray micro-spark during "silence" to maintain tension
                    if (Math.random() > 0.995) {
                        data[i] = (Math.random() * 2 - 1) * 0.5;
                    } else {
                        data[i] = 0;
                    }
                }
            }

            const sparkSource = ctx.createBufferSource();
            sparkSource.buffer = buffer;

            // CRITICAL: Highpass filter removes ALL low frequencies so it doesn't sound like a drum
            const sparkFilter = ctx.createBiquadFilter();
            sparkFilter.type = 'highpass';
            sparkFilter.frequency.value = 5000; // Only extremely thin, crispy high frequencies pass

            const sparkGain = ctx.createGain();
            sparkGain.gain.value = 0.4; // Soft zaps, no longer overpowering

            sparkSource.connect(sparkFilter);
            sparkFilter.connect(sparkGain);
            sparkGain.connect(ctx.destination);

            // Start & Stop 
            whineOsc.start(ctx.currentTime);
            whineOsc.stop(ctx.currentTime + duration);
            sparkSource.start(ctx.currentTime);
            sparkSource.stop(ctx.currentTime + duration);

            // Cleanup context to avoid memory leak
            setTimeout(() => {
                if (ctx.state !== 'closed') ctx.close();
            }, duration * 1000 + 100);
        } catch (e) {
            console.error("Flicker sound failed:", e);
        }
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
