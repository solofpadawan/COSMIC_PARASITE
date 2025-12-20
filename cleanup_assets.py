"""
Cleanup unused assets involved in moving non-whitelisted files to _UNUSED folder.
"""
import os
import shutil
from pathlib import Path

ASSETS_DIR = Path("assets/images")
UNUSED_DIR = Path("assets/images_UNUSED")

# Whitelist of files explicitly used in Assets.js
KEEP_FILES = {
    "helicoptero_alpha.png",
    "helicoptero_left_alpha.png",
    "missile.png",
    "cave_bg_v2.png",
    "cave_bg_huge.png",
    "ground_v4.png",
    "mist_texture.png",
    "alien-spit.png",
    "ground_intro.png",
    "logo_v5.png"
}

# Whitelist of directories explicitly used
KEEP_DIRS = {
    "enemy01",
    "explosion-enemy01"
}

def cleanup():
    if not ASSETS_DIR.exists():
        print(f"Directory not found: {ASSETS_DIR}")
        return

    if not UNUSED_DIR.exists():
        UNUSED_DIR.mkdir(parents=True)
        print(f"Created unused directory: {UNUSED_DIR}")

    print(f"Scanning {ASSETS_DIR} for unused files...")
    
    moved_count = 0
    
    # Iterate over immediate children of ASSETS_DIR
    for item in ASSETS_DIR.iterdir():
        # Skip the UNUSED directory itself
        if item == UNUSED_DIR:
            continue
            
        # Skip Backup folders (Safety)
        if "BACKUP" in item.name or "backup" in item.name:
            print(f"Skipping backup: {item.name}")
            continue

        if item.is_file():
            if item.name not in KEEP_FILES and item.suffix.lower() == '.png':
                print(f"Moving UNUSED file to cleanup: {item.name}")
                shutil.move(str(item), str(UNUSED_DIR / item.name))
                moved_count += 1
            elif item.name in KEEP_FILES:
                print(f"Keeping used file: {item.name}")
        
        elif item.is_dir():
            if item.name not in KEEP_DIRS:
                print(f"Moving UNUSED directory to cleanup: {item.name}")
                # Handle directory move - if dest exists, rename?
                dest = UNUSED_DIR / item.name
                if dest.exists():
                    import time
                    dest = UNUSED_DIR / f"{item.name}_{int(time.time())}"
                shutil.move(str(item), str(dest))
                moved_count += 1
            else:
                 print(f"Keeping used directory: {item.name}")

    print(f"\n{'='*70}")
    print(f"CLEANUP COMPLETE")
    print(f"{'='*70}")
    print(f"Items moved to {UNUSED_DIR.name}: {moved_count}")

if __name__ == "__main__":
    cleanup()
