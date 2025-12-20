"""
Apply PNG compression (lossy quantization) to all assets using Pillow,
excluding the explosion folder as requested.
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
ASSETS_DIR = Path("assets/images")
BACKUP_DIR = Path("assets/images_BACKUP_COMPRESSION")
EXCLUDED_DIRS = ["explosion-enemy01", "_BACKUP", "backup"] 

def get_dir_size(path):
    total = 0
    for root, dirs, files in os.walk(path):
        for f in files:
            fp = os.path.join(root, f)
            if os.path.exists(fp):
                total += os.path.getsize(fp)
    return total

def compress_all_assets():
    if not ASSETS_DIR.exists():
        print(f"ERROR: {ASSETS_DIR} not found!")
        return

    # 1. Create Backup
    if not BACKUP_DIR.exists():
        print(f"Creating backup at {BACKUP_DIR}...")
        # Ignore BACKUP folders during copy to avoid recursion if they are inside
        shutil.copytree(ASSETS_DIR, BACKUP_DIR, ignore=shutil.ignore_patterns('*BACKUP*', '*backup*'))
    else:
        print(f"Backup already exists at {BACKUP_DIR}")

    print(f"\n{'='*70}")
    print(f"STARTING COMPRESSION (Pillow Quantize 256 Colors)")
    print(f"{'='*70}\n")

    files_processed = 0
    files_skipped = 0
    bytes_saved = 0
    
    total_original = 0
    total_new = 0

    for root, dirs, files in os.walk(ASSETS_DIR):
        # Filter excluded dirs
        dirs[:] = [d for d in dirs if not any(exc in d for exc in EXCLUDED_DIRS) and "BACKUP" not in d]
        
        # Check if current root is excluded (safety)
        if any(exc in str(root) for exc in EXCLUDED_DIRS) or "BACKUP" in str(root):
            continue

        for filename in files:
            if not filename.lower().endswith('.png'):
                continue
                
            filepath = Path(root) / filename
             
            # Double check exclude path
            if any(exc in str(filepath) for exc in EXCLUDED_DIRS):
                continue
            
            try:
                original_size = os.path.getsize(filepath)
                total_original += original_size
                
                with Image.open(filepath) as img:
                    # Skip if already P mode (might be already optimized)
                    # But actually we can re-optimize if needed, but risky.
                    # Let's verify mode.
                    # if img.mode == 'P': ...
                    
                    # Convert/Quantize
                    # method=2 (FastOctree) supports RGBA
                    q_img = img.quantize(colors=256, method=2, dither=1)
                    
                    # Save
                    q_img.save(filepath, "PNG", optimize=True)
                
                new_size = os.path.getsize(filepath)
                total_new += new_size
                
                saved = original_size - new_size
                bytes_saved += saved
                files_processed += 1
                
                # print(f"Compressed {filename}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB")
                
            except Exception as e:
                print(f"Failed to compress {filename}: {e}")
                files_skipped += 1

    print(f"\n{'='*70}")
    print("COMPRESSION COMPLETE!")
    print(f"{'='*70}")
    print(f"Files processed: {files_processed}")
    print(f"Files skipped/excluded: {files_skipped}")
    print(f"Total space saved: {bytes_saved/1024:.1f} KB ({bytes_saved/1024/1024:.2f} MB)")
    print(f"Reduction: {100 - (total_new/total_original*100) if total_original > 0 else 0:.1f}%")
    print(f"Backup location: {BACKUP_DIR.absolute()}")

if __name__ == "__main__":
    compress_all_assets()
