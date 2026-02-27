> 🇧🇷 *Read this in [Portuguese](ENVIRONMENT-ptBR.md)*

# Environment and Scenery

Cosmic Parasite uses a heavy 2D optical illusion system called **Parallax Effect** to simulate depth and movement without ever needing a gigantic static map.

The main file responsible for this magic is `src/environment/Environment.js`.

## ParallaxLayer

The base class `ParallaxLayer` takes an image (Texture) and repeats it indefinitely on the screen.
It has the `speed` property that determines "how slowly" this specific layer should move in relation to the global game speed.
- **Distant layers** (like the stars and the background cave): Rotate very slowly and smoothly.
- **Intermediate layers** (mist): Move with a certain translucency.
- **Ground (GroundLayer)**: The layer closest to the player, moving at the same speed felt by the instantiated Entities of the enemy and the player.

## Ground Control and Introductions

The game is not just an infinite continuous loop. The `Environment` class injects cinematic moments and unique elements into the scenery according to the distance (meters) covered by the player in `Game.js`.

### Unique Pieces and the Loop
When the game actually starts (The state hits `PLAYING`), there is a specific waiting time limit and then the introductory terrain spawns in (The image of the base entrance, which does not have an infinite texture overlapping itself!).

As soon as this initial image passes, what is known as the **LoopLayer** enters. Which is basically a ground image projected in a "tileable" way, so to stitch the end of its sprite to the beginning of it without causing strangeness, making the game infinitely progressive laterally from the player's perspective.

## Unique Events

As the game advances in the `Game.js` distance score, triggers based on `this.distance >= X_METERS` fire spawn calls injected into the middle of the continuous background loop.

- `spawnEasterEgg()`: Jumps out of the regular cave ground imposingly after certain distances and overlaps its pixels over the regular floor.
- `spawnShop()`: Is triggered shortly after the EasterEgg based on a collision engine trigger and drawn with an offset `(offsetY)` in relation to the looped `ParallaxLayer`.

## Scenery Collision System (Pixel-Perfect)

The player can literally "crash the helicopter and die" against the ground if they fly too low, or bump head-on into the statue (Easter Egg).

The classic rectangular BoundingBox works very poorly for this (it would close the "curves" of the relief and cause unfair collisions to the player). Therefore:
- The `Environment` creates an Invisible Canvas on its initialization and individually processes all images susceptible to contact.
- A "map", a Unidimensional Binary Array (`1` for wall and `0` for empty) is created by checking the opacity (Alpha Channel / Transparency).
- When the player bounding boxes approach these global hitboxes (Static broad phase vs Player Bounding Box), the Narrow phase based on `getImageData()` checks if the X,Y offset of the player point crosses against any solid pixel. If it falls into a logical 1 = Immediate Collision (Game Over).
