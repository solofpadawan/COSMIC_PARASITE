from PIL import Image
import os

def align_sprites():
    try:
        input_path = 'assets/images/missile.png'
        output_path = 'assets/images/missile_fixed.png'
        
        if not os.path.exists(input_path):
            print(f"Error: {input_path} not found.")
            return

        img = Image.open(input_path)
        
        # Original logic: 2 cols, 5 rows. Total size 430x424
        # We will iterate and extract each frame logic
        # But wait, original height 424 / 5 = 84.8
        # We want to force new height of 85.
        
        cols = 2
        rows = 5
        frame_width = 215
        frame_height_float = 424 / 5 # 84.8
        
        new_frame_height = 85
        total_width = cols * frame_width
        total_height = rows * new_frame_height
        
        new_img = Image.new("RGBA", (total_width, total_height), (0, 0, 0, 0))
        
        frame_count = 0
        for r in range(rows):
            for c in range(cols):
                # Calculate source rect (floating point precision logic simulated)
                # We used integer math in game before, which caused drift.
                # Let's try to grab approximately where it was?
                # Actually, better: Scan the whole area for content?
                
                # Approximate source Y
                src_y_start = int(r * frame_height_float)
                src_y_end = int((r + 1) * frame_height_float)
                # Height is roughly 84 or 85 pixels.
                
                src_x_start = c * frame_width
                src_x_end = (c + 1) * frame_width
                
                # Crop the potential frame area
                frame = img.crop((src_x_start, src_y_start, src_x_end, src_y_end))
                
                # Get bounding box of content
                bbox = frame.getbbox()
                
                # Create a new perfectly sized frame
                clean_frame = Image.new("RGBA", (frame_width, new_frame_height), (0, 0, 0, 0))
                
                if bbox:
                    content = frame.crop(bbox)
                    content_w, content_h = content.size
                    
                    # 1. Find Visual Nose X and Y within the CONTENT image
                    # Scan right to left
                    content_nose_x = content_w - 1 
                    content_nose_y = 0 # Default
                    
                    rgba_content = content.convert("RGBA")
                    found = False
                    for x in range(content_w - 1, -1, -1):
                        for y in range(content_h):
                            if rgba_content.getpixel((x, y))[3] > 200:
                                content_nose_x = x
                                content_nose_y = y
                                found = True
                                break
                        if found: break
                    
                    # 2. Align this pixel to Fixed Target X (e.g. 195)
                    target_visual_nose_x = 195
                    dest_x = target_visual_nose_x - content_nose_x
                    
                    # 3. Align Nose Y to Fixed Target Y (Center of new frame = 42)
                    target_visual_nose_y = 42
                    dest_y = target_visual_nose_y - content_nose_y
                    
                    clean_frame.paste(content, (dest_x, dest_y))
                
                # Paste into new sheet
                new_img.paste(clean_frame, (c * frame_width, r * new_frame_height))
                
                frame_count += 1
                
        new_img.save(output_path)
        print(f"Success: Created {output_path} with integer dimensions ({total_width}x{total_height}).")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    align_sprites()
