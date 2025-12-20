from PIL import Image
import os

def analyze_sprites():
    try:
        input_path = 'assets/images/missile.png'
        if not os.path.exists(input_path): return

        img = Image.open(input_path)
        cols = 2
        rows = 5
        frame_width = 215
        frame_height_float = 424 / 5 # 84.8
        
        print(f"Frame | BBox (L, T, R, B) | Width | Right Edge Offset")
        print("-" * 50)

        for r in range(rows):
            for c in range(cols):
                frame_idx = r * cols + c
                src_y_start = int(r * frame_height_float)
                src_y_end = int((r + 1) * frame_height_float)
                src_x_start = c * frame_width
                src_x_end = (c + 1) * frame_width
                
                frame = img.crop((src_x_start, src_y_start, src_x_end, src_y_end))
                bbox = frame.getbbox()
                
                # Find Visual Nose X (Scan Right to Left)
                rgba_frame = frame.convert("RGBA")
                nose_x = -1
                width, height = rgba_frame.size
                
                found = False
                for x in range(width - 1, -1, -1):
                    for y in range(height):
                        if rgba_frame.getpixel((x, y))[3] > 200: # Threshold
                            nose_x = x
                            found = True
                            break
                    if found: break
                
                print(f"{frame_idx:02d}    | Nose X: {nose_x}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    analyze_sprites()
