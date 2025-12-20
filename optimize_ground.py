"""
Optimize ground images to 50% of original size for better performance.
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
BACKUP_FOLDER = Path("assets/images_BACKUP_GROUND")
GROUND_FILES = ["ground_intro.png", "ground_v4.png"]
SCALE_PERCENT = 50

def get_image_size_kb(filepath):
    """Get file size in KB"""
    return os.path.getsize(filepath) / 1024

def resize_ground_images():
    """Resize ground images to 50%"""
    
    if not IMAGES_FOLDER.exists():
        print(f"ERROR: Folder {IMAGES_FOLDER} not found!")
        return
    
    # Create backup folder
    if not BACKUP_FOLDER.exists():
        print(f"Creating backup folder: {BACKUP_FOLDER}")
        BACKUP_FOLDER.mkdir(parents=True)
    else:
        print(f"Backup folder already exists: {BACKUP_FOLDER}")
    
    print(f"\n{'='*70}")
    print(f"OPTIMIZING GROUND IMAGES TO {SCALE_PERCENT}%")
    print(f"{'='*70}\n")
    
    total_original_size = 0
    total_new_size = 0
    
    for i, filename in enumerate(GROUND_FILES, 1):
        filepath = IMAGES_FOLDER / filename
        
        if not filepath.exists():
            print(f"WARNING: {filename} not found, skipping...")
            continue
        
        print(f"[{i}/{len(GROUND_FILES)}] Processing {filename}...", end=" ")
        
        # Backup
        backup_path = BACKUP_FOLDER / filename
        if not backup_path.exists():
            shutil.copy2(filepath, backup_path)
        
        # Get original size
        original_size_kb = get_image_size_kb(filepath)
        total_original_size += original_size_kb
        
        # Open and resize
        with Image.open(filepath) as img:
            original_width, original_height = img.size
            
            # Calculate new dimensions
            new_width = int(original_width * SCALE_PERCENT / 100)
            new_height = int(original_height * SCALE_PERCENT / 100)
            
            # Resize using high-quality Lanczos filter
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save with optimization
            resized_img.save(filepath, "PNG", optimize=True)
        
        # Get new size
        new_size_kb = get_image_size_kb(filepath)
        total_new_size += new_size_kb
        
        reduction = 100 - (new_size_kb / original_size_kb * 100)
        print(f"{original_width}x{original_height} → {new_width}x{new_height} | "
              f"{original_size_kb:.1f}KB → {new_size_kb:.1f}KB ({reduction:.1f}% reduction)")
    
    # Summary
    print(f"\n{'='*70}")
    print("GROUND OPTIMIZATION COMPLETE!")
    print(f"{'='*70}")
    print(f"Files processed: {len(GROUND_FILES)}")
    print(f"Original total size: {total_original_size:.1f} KB ({total_original_size/1024:.2f} MB)")
    print(f"New total size: {total_new_size:.1f} KB ({total_new_size/1024:.2f} MB)")
    print(f"Total space saved: {total_original_size - total_new_size:.1f} KB ({(total_original_size - total_new_size)/1024:.2f} MB)")
    print(f"Reduction: {100 - (total_new_size/total_original_size*100):.1f}%")
    print(f"\nBackup location: {BACKUP_FOLDER.absolute()}")
    print("\nNOTE: You need to update Environment.js groundScale from 0.25 to 0.5 to maintain visual size!")

if __name__ == "__main__":
    try:
        resize_ground_images()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
