import pygame
import os

def process_logo(input_path, output_path):
    try:
        pygame.init()
        # Hidden display
        pygame.display.set_mode((1, 1), pygame.NOFRAME)

        if not os.path.exists(input_path):
            print(f"Error: Input file not found: {input_path}")
            return

        image = pygame.image.load(input_path).convert() 
        width, height = image.get_size()
        
        # Create output surface with Alpha
        final_image = pygame.Surface((width, height), pygame.SRCALPHA)
        
        # Sample Top-Left pixel as Background Color
        bg_r, bg_g, bg_b, _ = image.get_at((0, 0))
        print(f"Detected Background Color at (0,0): ({bg_r}, {bg_g}, {bg_b})")

        count_removed = 0

        for x in range(width):
            for y in range(height):
                r, g, b, _ = image.get_at((x, y))
                
                # Improved Heuristic:
                # The logo is Bone/Metal (Greys/Browns) + Green Glow.
                # The Background is Magenta (High Red/Blue, Low Green).
                # Anti-aliased edges will also have High Red/Blue relative to Green.
                
                # Check if pixel is "Purple-ish"
                # If Red and Blue are both significantly higher than Green
                
                # Standard Grey/Bone: R~G~B
                # Green Glow: G > R and G > B
                # Magenta: R >> G and B >> G
                
                is_purple = (r > g + 40) and (b > g + 40)
                
                # Also check original exact match or close match for safety
                diff = abs(r - bg_r) + abs(g - bg_g) + abs(b - bg_b)
                
                if is_purple or diff < 100:
                    # Make Transparent
                    final_image.set_at((x, y), (0, 0, 0, 0))
                    count_removed += 1
                else:
                    # Copy Original
                    final_image.set_at((x, y), (r, g, b, 255))
        
        print(f"Removed {count_removed} pixels.")

        # Crop to bounding box
        rect = final_image.get_bounding_rect()
        cropped = final_image.subsurface(rect).copy()
        
        print(f"Original Size: {width}x{height}")
        print(f"Cropped to: {cropped.get_size()}")
        
        pygame.image.save(cropped, output_path)
        print(f"Saved processed logo to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        pygame.quit()

if __name__ == "__main__":
    # Input: The generated magenta artifact
    # Output: The game asset
    
    process_logo(
        "c:/xampp/htdocs/heli/assets/images/logo_magenta.png", 
        "c:/xampp/htdocs/heli/assets/images/logo_v5.png"
    )
