import { Keys } from '../utils/Constants.js';

let gamepadIndex = null;

export class InputHandler {
    constructor() {
        this.keyboardState = {};
        this.keyBuffer = "";
        this.cheatGodEntered = false;
        this.initKeyboard();
        this.initGamepad();
        this.gamepadActive = false;
    }

    initKeyboard() {
        window.addEventListener('keydown', e => {
            // Prevent default scrolling for arrow keys and space
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].indexOf(e.key) > -1) {
                e.preventDefault();
            }

            const key = e.key === ' ' ? 'Space' : e.key;
            this.keyboardState[key] = true;

            // Cheat Code Logic
            // Only letter keys
            if (e.key.length === 1) {
                this.keyBuffer += e.key.toLowerCase();
                if (this.keyBuffer.length > 10) {
                    this.keyBuffer = this.keyBuffer.slice(-10);
                }

                if (this.keyBuffer.endsWith("god")) {
                    this.cheatGodEntered = true;
                    this.keyBuffer = ""; // Reset buffer
                }
            }
        });

        window.addEventListener('keyup', e => {
            const key = e.key === ' ' ? 'Space' : e.key;
            this.keyboardState[key] = false;
        });
    }

    initGamepad() {
        window.addEventListener("gamepadconnected", (e) => {
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                e.gamepad.index, e.gamepad.id,
                e.gamepad.buttons.length, e.gamepad.axes.length);
            gamepadIndex = e.gamepad.index;
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("Gamepad disconnected from index %d: %s",
                e.gamepad.index, e.gamepad.id);
            if (gamepadIndex === e.gamepad.index) {
                gamepadIndex = null;
            }
        });
    }

    update() {
        let gpLeft = false, gpRight = false, gpUp = false, gpDown = false, gpSpace = false, gpPause = false;

        if (gamepadIndex !== null) {
            const gamepad = navigator.getGamepads()[gamepadIndex];
            if (gamepad) {
                const threshold = 0.2;

                gpLeft = gamepad.axes[0] < -threshold || (gamepad.buttons[14] && gamepad.buttons[14].pressed);
                gpRight = gamepad.axes[0] > threshold || (gamepad.buttons[15] && gamepad.buttons[15].pressed);
                gpUp = gamepad.axes[1] < -threshold || (gamepad.buttons[12] && gamepad.buttons[12].pressed);
                gpDown = gamepad.axes[1] > threshold || (gamepad.buttons[13] && gamepad.buttons[13].pressed);

                gpSpace = gamepad.buttons[0].pressed || gamepad.buttons[2].pressed; // Button 0 (A) or 2 (X)
                gpPause = gamepad.buttons[9].pressed; // Button 9 (Start usually)

                // Check for ANY button press or axis movement for audio unlock
                this.gamepadActive = gamepad.buttons.some(b => b.pressed) ||
                    gamepad.axes.some(axis => Math.abs(axis) > threshold);
            }
        }

        // Merge States into Global Keys
        Keys.ArrowLeft = this.keyboardState.ArrowLeft || this.keyboardState.a || gpLeft;
        Keys.ArrowRight = this.keyboardState.ArrowRight || this.keyboardState.d || gpRight;
        Keys.ArrowUp = this.keyboardState.ArrowUp || this.keyboardState.w || gpUp;
        Keys.ArrowDown = this.keyboardState.ArrowDown || this.keyboardState.s || gpDown;
        Keys.Space = this.keyboardState.Space || gpSpace;
        Keys.Pause = this.keyboardState.p || this.keyboardState.P || gpPause;
        Keys.FastForward = this.keyboardState.f || this.keyboardState.F;

        this.anyKeyPressed = Object.values(this.keyboardState).some(k => k) || this.gamepadActive;
    }
}
