
from PIL import Image
import os

filepath = "assets/images/logo_v5.png"
outpath = "assets/images/logo_v5_test.png"

try:
    with Image.open(filepath) as img:
        print(f"Original Mode: {img.mode}")
        
        # Quantize
        # Trying to maintain transparency if RGBA
        if img.mode == 'RGBA':
            # Quantize usually converts to P mode. 
            # Pillow's default quantize might handle alpha but let's see.
            q_img = img.quantize(colors=256, method=Image.Resampling.LANCZOS, kmeans=0, dither=Image.Dither.FLOYDSTEINBERG)
        else:
            q_img = img.quantize(colors=256)
            
        q_img.save(outpath, "PNG", optimize=True)
        
        orig_size = os.path.getsize(filepath)
        new_size = os.path.getsize(outpath)
        
        print(f"Original: {orig_size/1024:.2f} KB")
        print(f"New: {new_size/1024:.2f} KB")
        print(f"Reduction: {100 - (new_size/orig_size*100):.1f}%")
        print(f"New Mode: {q_img.mode}")

except Exception as e:
    print(e)
