"""
Optimize alien spit sprite to 25% and apply compression.
"""
import os
import shutil
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'pillow'])
    from PIL import Image

# Configuration
IMAGES_FOLDER = Path("assets/images")
BACKUP_FOLDER = Path("assets/images_BACKUP_ALIEN_SPIT")
FILE_NAME = "alien-spit.png"
SCALE_PERCENT = 25

def resize_and_compress():
    filepath = IMAGES_FOLDER / FILE_NAME
    
    if not filepath.exists():
        print(f"ERROR: {FILE_NAME} not found!")
        return
    
    # Create backup folder
    if not BACKUP_FOLDER.exists():
        BACKUP_FOLDER.mkdir(parents=True)
    
    # Backup
    backup_path = BACKUP_FOLDER / FILE_NAME
    if not backup_path.exists():
        shutil.copy2(filepath, backup_path)
        print(f"Backup created: {backup_path}")
    
    original_size = os.path.getsize(filepath)
    
    with Image.open(filepath) as img:
        print(f"Original Dimensions: {img.size}")
        print(f"Original Size: {original_size/1024:.2f} KB")
        
        # Resize
        new_w = int(img.width * SCALE_PERCENT / 100)
        new_h = int(img.height * SCALE_PERCENT / 100)
        
        # Ensure at least 1px
        new_w = max(1, new_w)
        new_h = max(1, new_h)
        
        # Resize (Lanczos)
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Quantize (Compression)
        # Using method=2 (FastOctree) for RGBA support
        compressed = resized.quantize(colors=256, method=2, dither=1)
        
        # Save
        compressed.save(filepath, "PNG", optimize=True)
        
    new_size = os.path.getsize(filepath)
    print(f"New Dimensions: {new_w}x{new_h}")
    print(f"New Size: {new_size/1024:.2f} KB")
    print(f"Reduction: {100 - (new_size/original_size*100):.1f}%")

if __name__ == "__main__":
    resize_and_compress()
