"""
Optimize logo image to 50% of original size for better performance.
"""
import os
import shutil
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: PIL/Pillow not found. Installing...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'pillow'])
    from PIL import Image

# Configuration
IMAGES_FOLDER = Path("assets/images")
BACKUP_FOLDER = Path("assets/images_BACKUP_LOGO")
LOGO_FILE = "logo_v5.png"
SCALE_PERCENT = 50

def get_image_size_kb(filepath):
    """Get file size in KB"""
    return os.path.getsize(filepath) / 1024

def resize_logo():
    """Resize logo to 50%"""
    
    filepath = IMAGES_FOLDER / LOGO_FILE
    
    if not filepath.exists():
        print(f"ERROR: {LOGO_FILE} not found!")
        return
    
    # Create backup folder
    if not BACKUP_FOLDER.exists():
        print(f"Creating backup folder: {BACKUP_FOLDER}")
        BACKUP_FOLDER.mkdir(parents=True)
    else:
        print(f"Backup folder already exists: {BACKUP_FOLDER}")
    
    print(f"\n{'='*70}")
    print(f"OPTIMIZING LOGO TO {SCALE_PERCENT}%")
    print(f"{'='*70}\n")
    
    # Backup
    backup_path = BACKUP_FOLDER / LOGO_FILE
    if not backup_path.exists():
        shutil.copy2(filepath, backup_path)
        print(f"Backup created: {backup_path}")
    
    # Get original size
    original_size_kb = get_image_size_kb(filepath)
    
    # Open and resize
    with Image.open(filepath) as img:
        original_width, original_height = img.size
        
        print(f"Original: {original_width}x{original_height} ({original_size_kb:.1f}KB)")
        
        # Calculate new dimensions
        new_width = int(original_width * SCALE_PERCENT / 100)
        new_height = int(original_height * SCALE_PERCENT / 100)
        
        # Resize using high-quality Lanczos filter
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save with optimization
        resized_img.save(filepath, "PNG", optimize=True)
    
    # Get new size
    new_size_kb = get_image_size_kb(filepath)
    
    reduction = 100 - (new_size_kb / original_size_kb * 100)
    print(f"Optimized: {new_width}x{new_height} ({new_size_kb:.1f}KB)")
    print(f"\nReduction: {reduction:.1f}%")
    print(f"Space saved: {original_size_kb - new_size_kb:.1f} KB")
    
    print(f"\n{'='*70}")
    print("LOGO OPTIMIZATION COMPLETE!")
    print(f"{'='*70}")
    print(f"\nBackup location: {BACKUP_FOLDER.absolute()}")
    print(f"\nNOTE: Update Game.js logoScale from 0.66 to 1.32 (double) to maintain visual size!")

if __name__ == "__main__":
    try:
        resize_logo()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
