> 🇧🇷 *Read this in [Portuguese](ARCHITECTURE-ptBR.md)*

# Cosmic Parasite Architecture

This document describes the general architecture of the game, the main loop, state management, and how instances communicate.

## Overview

Cosmic Parasite is built using **HTML5 Canvas** and **Vanilla JavaScript** (ES6 modules). All drawing on the screen and update logic occurs in a continuous loop synchronized with the player's monitor refresh rate through `requestAnimationFrame`.

The architecture follows the principles of separation of concerns, dividing the code into submodules within the `src/` folder:
- `core/`: Main managers (Game, Input, Audio, Assets, Score).
- `entities/`: Dynamic game objects (Player, Enemies, Items).
- `environment/`: Non-dynamic visual elements or scenery.

## Entry Point: `main.js`

The `main.js` file is the entry point of the application. Its main responsibilities are:
1. Setup the Canvas and get its context (`ctx`).
2. Attempt to responsively restore the Canvas to the screen size.
3. Call the Assets manager (`Assets.js`) to load all images and sounds in the background.
4. Initialize essential instances (`ScoreManager`, and the main `Game` class).
5. Start and maintain the game loop (`animate(currentTime)`).

## The Main Class: `core/Game.js`

The `Game` class is the great orchestrator of the game. It initializes subsystems and stores the global state.

### State Management
The `this.state` property controls what screen the player is on:
- `START`: The title screen and leaderboard. The game waits for an input to start. The background moves slowly.
- `PLAYING`: The game itself. The player has full control of the helicopter. Enemy generation, waves, and items are activated.
- `GAME_OVER`: The helicopter was destroyed. The game stops entity updates, plays explosion effects, and displays the form screen to enter the name for the High Score.

### The Loop: `update()` and `draw()`
Inside the loop started by `main.js`, the `Game.update(dt)` method is called passing the **delta time** (`dt`), followed by `Game.draw()`.
- Delta time is crucial because it ensures that entity movement speeds do not vary abruptly with normal variations in the browser's framerate (FPS). Movement is calculated based on time and not on *raw frames*.
- In `update()`, all inputs are checked, and update calls are passed down in cascade to the entities (`player.update(dt)`, `enemies.forEach(i => i.update(dt))`, etc).
- Collisions and object deletion detections (`markedForDeletion`) are also centralized in the `update()` of `Game.js`.
- In `draw()`, the screen is completely cleared (`ctx.clearRect()`) and everything is redrawn from background to foreground in the order: Background -> Player -> Enemies -> Projectiles -> Coins -> Explosions -> UI.

## Collision System

Collision checking is done by the `checkCollisions()` method in `Game.js`.
Generally, classical **Bounding Box** detection (AABB - Axis-Aligned Bounding Box) is used, measuring the overlap of rectangles (x, y, width, and height) of the sprites.

However, for complex elements like the ground and Easter Eggs (which demand more fidelity due to empty areas in their sprite), the `Environment.js` class generates a 1-bit pixel-perfect "Collision Map" based on the images' Alpha channel.
