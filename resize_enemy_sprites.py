"""
Resize enemy sprite images to 25% of original size for performance optimization.
Creates backup of originals before modifying.
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
ENEMY_FOLDER = Path("assets/images/enemy01")
BACKUP_FOLDER = Path("assets/images/enemy01_ORIGINAL_BACKUP")
SCALE_PERCENT = 25  # Resize to 25% of original

def get_image_size_kb(filepath):
    """Get file size in KB"""
    return os.path.getsize(filepath) / 1024

def resize_images():
    """Main function to resize all enemy sprite images"""
    
    # Ensure folders exist
    if not ENEMY_FOLDER.exists():
        print(f"ERROR: Folder {ENEMY_FOLDER} not found!")
        return
    
    # Get list of PNG files
    png_files = sorted(list(ENEMY_FOLDER.glob("*.png")))
    if not png_files:
        print(f"ERROR: No PNG files found in {ENEMY_FOLDER}")
        return
    
    print(f"Found {len(png_files)} PNG files to process")
    print(f"Target size: {SCALE_PERCENT}% of original\n")
    
    # Create backup folder
    if not BACKUP_FOLDER.exists():
        print(f"Creating backup folder: {BACKUP_FOLDER}")
        BACKUP_FOLDER.mkdir(parents=True)
    else:
        print(f"Backup folder already exists: {BACKUP_FOLDER}")
    
    # Check if backup already has files
    existing_backups = list(BACKUP_FOLDER.glob("*.png"))
    if existing_backups:
        response = input(f"Backup folder already contains {len(existing_backups)} files. Skip backup? (y/n): ")
        skip_backup = response.lower() == 'y'
    else:
        skip_backup = False
    
    total_original_size = 0
    total_new_size = 0
    
    # Process each image
    for i, image_path in enumerate(png_files, 1):
        print(f"[{i}/{len(png_files)}] Processing {image_path.name}...", end=" ")
        
        # Backup original (if not skipped)
        if not skip_backup:
            backup_path = BACKUP_FOLDER / image_path.name
            if not backup_path.exists():
                shutil.copy2(image_path, backup_path)
        
        # Get original size
        original_size_kb = get_image_size_kb(image_path)
        total_original_size += original_size_kb
        
        # Open and resize
        with Image.open(image_path) as img:
            original_width, original_height = img.size
            
            # Calculate new dimensions
            new_width = int(original_width * SCALE_PERCENT / 100)
            new_height = int(original_height * SCALE_PERCENT / 100)
            
            # Resize using high-quality Lanczos filter
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save with optimization
            resized_img.save(image_path, "PNG", optimize=True)
        
        # Get new size
        new_size_kb = get_image_size_kb(image_path)
        total_new_size += new_size_kb
        
        reduction = 100 - (new_size_kb / original_size_kb * 100)
        print(f"{original_width}x{original_height} → {new_width}x{new_height} | "
              f"{original_size_kb:.1f}KB → {new_size_kb:.1f}KB ({reduction:.1f}% reduction)")
    
    # Summary
    print("\n" + "="*70)
    print("OPTIMIZATION COMPLETE!")
    print("="*70)
    print(f"Total images processed: {len(png_files)}")
    print(f"Original total size: {total_original_size:.1f} KB ({total_original_size/1024:.2f} MB)")
    print(f"New total size: {total_new_size:.1f} KB ({total_new_size/1024:.2f} MB)")
    print(f"Total space saved: {total_original_size - total_new_size:.1f} KB ({(total_original_size - total_new_size)/1024:.2f} MB)")
    print(f"Reduction: {100 - (total_new_size/total_original_size*100):.1f}%")
    print(f"\nBackup location: {BACKUP_FOLDER.absolute()}")
    print("\nNOTE: You need to update Enemy.js scale from 0.12 to 0.48 to maintain visual size!")

if __name__ == "__main__":
    try:
        resize_images()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
