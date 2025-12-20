"""
Comprehensive image optimization script for COSMIC_PARASITE game.
Optimizes multiple asset types with different scaling factors.
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

# Configuration for different asset types
OPTIMIZATIONS = {
    "helicopter_sprites": {
        "folder": Path("assets/images"),
        "files": ["helicoptero_alpha.png", "helicoptero_left_alpha.png"],
        "scale_percent": 25,
        "backup_suffix": "_BACKUP_HELICOPTER"
    },
    "turn_frames": {
        "folder": Path("assets/turn"),
        "files": "*.png",  # All PNG files
        "scale_percent": 25,
        "backup_suffix": "_BACKUP"
    },
    "backgrounds": {
        "folder": Path("assets/images"),
        "files": ["cave_bg_huge.png", "cave_bg_v2.png"],
        "scale_percent": 50,
        "backup_suffix": "_BACKUP_BACKGROUNDS"
    }
}

def get_image_size_kb(filepath):
    """Get file size in KB"""
    return os.path.getsize(filepath) / 1024

def create_backup(file_path, backup_folder):
    """Create backup of a file"""
    backup_path = backup_folder / file_path.name
    if not backup_path.exists():
        shutil.copy2(file_path, backup_path)
        return True
    return False

def resize_image(image_path, scale_percent):
    """Resize a single image file"""
    original_size_kb = get_image_size_kb(image_path)
    
    with Image.open(image_path) as img:
        original_width, original_height = img.size
        
        # Calculate new dimensions
        new_width = int(original_width * scale_percent / 100)
        new_height = int(original_height * scale_percent / 100)
        
        # Resize using high-quality Lanczos filter
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save with optimization
        resized_img.save(image_path, "PNG", optimize=True)
    
    new_size_kb = get_image_size_kb(image_path)
    reduction = 100 - (new_size_kb / original_size_kb * 100)
    
    return {
        "original_size": (original_width, original_height),
        "new_size": (new_width, new_height),
        "original_kb": original_size_kb,
        "new_kb": new_size_kb,
        "reduction": reduction
    }

def optimize_asset_group(group_name, config):
    """Optimize a group of assets"""
    print(f"\n{'='*70}")
    print(f"OPTIMIZING: {group_name.upper().replace('_', ' ')}")
    print(f"{'='*70}")
    print(f"Scale: {config['scale_percent']}% of original\n")
    
    folder = config['folder']
    if not folder.exists():
        print(f"ERROR: Folder {folder} not found!")
        return
    
    # Get list of files to process
    if config['files'] == "*.png":
        files_to_process = sorted(list(folder.glob("*.png")))
    else:
        files_to_process = [folder / f for f in config['files'] if (folder / f).exists()]
    
    if not files_to_process:
        print(f"ERROR: No files found to process in {folder}")
        return
    
    print(f"Found {len(files_to_process)} file(s) to process")
    
    # Create backup folder
    backup_folder = folder.parent / (folder.name + config['backup_suffix'])
    if not backup_folder.exists():
        print(f"Creating backup folder: {backup_folder}")
        backup_folder.mkdir(parents=True)
    else:
        print(f"Backup folder already exists: {backup_folder}")
    
    # Check if backup already has files
    existing_backups = list(backup_folder.glob("*.png"))
    if existing_backups:
        print(f"Backup folder already contains {len(existing_backups)} files")
        skip_backup = True
    else:
        skip_backup = False
    
    total_original_size = 0
    total_new_size = 0
    
    # Process each file
    for i, file_path in enumerate(files_to_process, 1):
        print(f"[{i}/{len(files_to_process)}] Processing {file_path.name}...", end=" ")
        
        # Backup original (if not skipped)
        if not skip_backup:
            create_backup(file_path, backup_folder)
        
        # Resize
        result = resize_image(file_path, config['scale_percent'])
        
        total_original_size += result['original_kb']
        total_new_size += result['new_kb']
        
        print(f"{result['original_size'][0]}x{result['original_size'][1]} → "
              f"{result['new_size'][0]}x{result['new_size'][1]} | "
              f"{result['original_kb']:.1f}KB → {result['new_kb']:.1f}KB "
              f"({result['reduction']:.1f}% reduction)")
    
    # Summary for this group
    print(f"\n{group_name.upper()} Summary:")
    print(f"  Files processed: {len(files_to_process)}")
    print(f"  Original size: {total_original_size:.1f} KB ({total_original_size/1024:.2f} MB)")
    print(f"  New size: {total_new_size:.1f} KB ({total_new_size/1024:.2f} MB)")
    print(f"  Space saved: {total_original_size - total_new_size:.1f} KB ({(total_original_size - total_new_size)/1024:.2f} MB)")
    print(f"  Reduction: {100 - (total_new_size/total_original_size*100):.1f}%")
    print(f"  Backup: {backup_folder.absolute()}")
    
    return total_original_size, total_new_size

def main():
    """Main optimization function"""
    print("="*70)
    print("COSMIC PARASITE - COMPREHENSIVE IMAGE OPTIMIZATION")
    print("="*70)
    
    grand_total_original = 0
    grand_total_new = 0
    
    # Process each optimization group
    for group_name, config in OPTIMIZATIONS.items():
        orig, new = optimize_asset_group(group_name, config)
        grand_total_original += orig
        grand_total_new += new
    
    # Grand total summary
    print(f"\n{'='*70}")
    print("OVERALL OPTIMIZATION COMPLETE!")
    print(f"{'='*70}")
    print(f"Grand Total Original Size: {grand_total_original:.1f} KB ({grand_total_original/1024:.2f} MB)")
    print(f"Grand Total New Size: {grand_total_new:.1f} KB ({grand_total_new/1024:.2f} MB)")
    print(f"Total Space Saved: {grand_total_original - grand_total_new:.1f} KB ({(grand_total_original - grand_total_new)/1024:.2f} MB)")
    print(f"Overall Reduction: {100 - (grand_total_new/grand_total_original*100):.1f}%")
    print("\nNOTE: Remember to update code scale factors if needed:")
    print("  - Player.js: helicopter scale adjustments (if applicable)")
    print("  - Environment.js: background scale adjustments (if applicable)")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
