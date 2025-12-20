import { loadAssets } from './core/Assets.js';
import { Game } from './core/Game.js';
import { Starfield } from './environment/Starfield.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/Constants.js';
import { ScoreManager } from './core/ScoreManager.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreManager = new ScoreManager();

async function init() {
    // 1. Setup Elements & Variables declaration
    const introScreen = document.getElementById('intro-screen');
    const loadingText = document.getElementById('loading-text');
    const startText = document.getElementById('start-text');
    const highScoresDiv = document.querySelector('.high-scores');

    let assetsLoaded = false;
    let gameHasStarted = false;
    let preloaderReqId;

    // 2. Setup Intro Loop (Starfield)
    const starfield = new Starfield();

    function preloaderLoop() {
        if (gameHasStarted) return;

        // Check for Gamepad Input ONLY if assets are loaded
        if (assetsLoaded) {
            const gamepads = navigator.getGamepads();
            for (const gp of gamepads) {
                if (gp) {
                    if (gp.buttons.some(b => b.pressed)) {
                        startGame();
                        return;
                    }
                }
            }
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Clear
        starfield.update();
        starfield.draw(ctx);
        preloaderReqId = requestAnimationFrame(preloaderLoop);
    }

    // Start the Preloader Loop immediately (Visuals first)
    preloaderLoop();

    // 3. Start Asset Loading
    await loadAssets((percent) => {
        loadingText.innerText = `LOADING ${percent}%`;
    });

    // 4. Load High Scores
    const scores = await scoreManager.loadHighScores();
    updateHighScoreBoard(scores);

    // 5. Loading Complete
    assetsLoaded = true;
    loadingText.style.display = 'none';
    startText.style.display = 'block';
    // High scores now handled by Canvas in Game.js, keep DOM version hidden

    // 6. Start Game Logic
    function startGame() {
        if (!assetsLoaded || gameHasStarted) return;
        gameHasStarted = true;

        // Visual Fade Out (Intro Disappearing)
        const fadeOverlay = document.getElementById('fade-overlay');
        fadeOverlay.style.opacity = 1;

        // Wait for Fade to Black (500ms match css)
        setTimeout(() => {
            cancelAnimationFrame(preloaderReqId);
            introScreen.style.display = 'none';

            const game = new Game(ctx, scoreManager);

            function animate() {
                game.update();
                game.draw();
                requestAnimationFrame(animate);
            }

            animate();

            // Fade In (Game Appearing)
            // Small delay to ensure render is ready?
            setTimeout(() => {
                fadeOverlay.style.opacity = 0;
            }, 100);

        }, 500);
    }

    // 7. Listeners (Any Key/Click)
    window.addEventListener('keydown', startGame);
    window.addEventListener('mousedown', startGame);
    window.addEventListener('touchstart', startGame);
}

function updateHighScoreBoard(scores) {
    const list = document.querySelector('.score-list');
    ScoreManager.render(scores, list);
}

init();
