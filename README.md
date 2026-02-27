> 🇧🇷 *Read this in [Portuguese](README-ptBR.md)*

# 🚀 COSMIC PARASITE

**Cosmic Parasite** is a retro space shooter game developed with HTML5 Canvas and pure JavaScript (Vanilla JS), focused on fast action and arcade style.

## 🎮 How to Play

Pilot your space helicopter, destroy alien enemies, and survive as long as you can to reach the top of the leaderboard!

### Controls

| Action | Keyboard / Mouse |
| :--- | :--- |
| **Move** | `Arrow Keys` or `WASD` |
| **Shoot** | `Spacebar` (Semi-automatic) |
| **Start/Restart** | `Click`, `Enter` or `Touch` the screen |

*The game also has basic Gamepad support (detected on the start menu).*

### 🛒 Weapon Shop (Web Shop)

Throughout your journey, you will find a Shop to upgrade your helicopter. After passing the mysterious monolith, keep an eye on the background!
Approach the shop entrance to activate it. The shop will pause the game and allow you to buy upgrades using your accumulated **CASH** (score).

**Available Upgrades:**
*   **Triple Shot:** $ 500.00 - Fires three simultaneous missiles increasing the hit area.
*   **Fire Rate +:** $ 300.00 - Increases the maximum firing speed (cumulative up to 3 levels).
*   **Extra Shield:** $ 800.00 - An energy protection that absorbs **1 fatal hit** from enemies or scenery collisions.
*   **Piercing Missile:** $ 1000.00 - Replaces your shot with a giant missile (1.8x larger) that passes through and destroys multiple enemies at once.
*   **Coin Magnet:** $ 700.00 - Passive upgrade. Activates artificial gravity on the helicopter automatically pulling all nearby coins to the ship.

## 🛠️ Used Technologies

This project was built using modern web technologies with no heavy frontend framework dependencies:

- **Frontend:**
  - HTML5 Canvas (Graphical rendering)
  - JavaScript (ES6 Modules - Game logic)
  - CSS3 (Interface styling)
- **Backend (Scoring):**
  - PHP (Simple API to save scores)
  - SQLite (Local database `scores_cosmic.db`)
- **Assets:**
  - Python (Auxiliary scripts for image optimization and compression)

## ⚙️ Installation and Setup

To run the game locally with the **High Scores** system working, you will need a web server with PHP support.

### Prerequisites
- Web Server (Apache, Nginx, or PHP Built-in Server).
- PHP installed and configured.
- `pdo_sqlite` extension enabled in `php.ini`.

### Step by Step

1. **Clone or download the repository** to your web server's public folder (e.g., `htdocs` in XAMPP or `/var/www/html` in Linux).
   ```bash
   git clone https://github.com/solofpadawan/COSMIC_PARASITE.git
   ```

2. **Write Permissions:**
   For the game to save scores, PHP needs write permission on the database file and the directory where it's located.
   - Ensure the `scores_cosmic.db` file (if it exists) and the project's root folder have write permissions.

3. **Access the Game:**
   Open your browser and access:
   ```
   http://localhost/COSMIC_PARASITE
   ```

### Running Frontend Only
If you just want to test gameplay without saving scores, you can open the `index.html` file directly or use an extension like "Live Server" in VS Code, but the leaderboard won't work correctly.

## 📂 Project Structure

*   **`index.html`**: Main file, contains the page structure and the Canvas.
*   **`style.css`**: User interface styles (menus, overlays).
*   **`src/`**: Game source code.
    *   `core/`: Game management, main loop, asset loading.
    *   `entities/`: Player, Enemies, and Projectiles logic.
    *   `environment/`: Visual effects like the Starfield.
    *   `utils/`: Constants and utility functions.
*   **`scores_cosmic.php`**: Backend script to manage the scores database.
*   **`scores_cosmic.db`**: SQLite database containing the records.
*   **`*.py`**: Python scripts in the root used to process and optimize graphic assets.

## 📚 Technical Documentation

To understand deeper how the game works under the hood (ideal for developers and AI studying the *Codebase*), consult the detailed documentation:

- [General Architecture (`ARCHITECTURE.md`)](docs/ARCHITECTURE.md): Details the Main Loop, State separation, Managers and how mechanics converge.
- [Entities Logic (`ENTITIES.md`)](docs/ENTITIES.md): Covers instances of enemies, shots, players and how states act in their lifecycles (Drawing, Interaction, Garbage).
- [Environment System (`ENVIRONMENT.md`)](docs/ENVIRONMENT.md): How continuous stage scrolling works, Parallax, independent spawnings (Statues and Shops) and Pixel-perfect collisions with terrain.

---
*Have fun and good luck, pilot!*
