import pygame
import math

def create_spiked_intro(input_path, output_path):
    try:
        pygame.init()
        pygame.display.set_mode((1, 1), pygame.NOFRAME)
        
        # Load the base ground image
        original = pygame.image.load(input_path).convert_alpha()
        width, height = original.get_size()
        
        # Create a new surface for the intro
        intro = pygame.Surface((width, height), pygame.SRCALPHA)
        
        # Blit the original image onto the intro surface
        # keeping the right side intact ensures seamless connection
        intro.blit(original, (0, 0))
        
        # Create a mask to carve out the "spikes" on the left
        # We want the ground to "grow" from left to right.
        # So X=0 is empty, X=Width is full.
        # But we want spikes, not a gradient.
        
        # We'll iterate pixels on the left half and modify alpha
        spike_width = width // 2 # Spikes affect first half
        
        for x in range(spike_width):
            for y in range(height):
                # Normalized positions
                nx = x / spike_width 
                # Create a jagged threshold
                # A sine wave + noise or simple saw tooth?
                # User wants "pointy and with spikes".
                
                # Big spike shape: Triangle pointed left?
                # Let's make it look like a floating island start.
                # Center Y is solid, edges are empty?
                # Or Ground comes from bottom? 
                # Assuming top is surface.
                
                # Let's use a simple linear ramp modulated by a jagged function for the "Start" edge
                # We want transparency at x=0.
                
                # Function defining the "solid" edge opacity
                # x > threshold?
                
                # Jagged edge pattern
                freq = 0.1
                amp = 30
                offset = math.sin(y * freq) * amp
                
                # Define x-limit for this row where solid starts
                # We want spikes sticking OUT to the left.
                # So the "solid" starts further right for "valleys" and further left for "tips"
                
                # Let's say basic edge is at x = 50.
                # Tip of spike at x = 10.
                
                # Let's try to erase pixels based on a mask
                # Mask: 0 = Clear, 1 = Keep
                
                # We simply Clear the left side manually?
                pass

        # Easier approach: Create a polygon mask for the spikes and blit with SUBTRACT or use masking
        mask = pygame.Surface((width, height), pygame.SRCALPHA)
        mask.fill((0,0,0,0)) # Transparent
        
        # Draw "Solid" area we want to KEEP in white
        # We want to keep the right side 100%
        # The left side will have a jagged polygon edge
        
        points = []
        # Start top-right
        points.append((width, 0))
        # Top-left-ish (Jagged)
        
        # Generate jagged points for the left edge
        # We move from Top to Bottom
        segments = 10
        seg_h = height / segments
        base_x = 50 # Start of solid ground
        
        for i in range(segments + 1):
            y = i * seg_h
            # Randomize X to make spikes
            # Even i = sticking out (low x), Odd i = indented (high x)
            if i % 2 == 0:
                x = 0 # Tip of spike
            else:
                x = 100 # Valley
            
            # Make the very first point (top) indented so it's not a square corner
            if i == 0: x = 100
            
            points.append((x, y))
            
        # Bottom-Right
        points.append((width, height))
        
        # Draw the polygon on mask (White)
        pygame.draw.polygon(mask, (255, 255, 255, 255), points)
        
        # Apply mask to intro
        # Iterate and set alpha based on mask?
        # Or just clear where mask is transparent.
        
        # Actually easier: Start with empty, Draw original, then "erase" the complement of the polygon?
        # Even easier: Draw logic.
        
        final_surf = pygame.Surface((width, height), pygame.SRCALPHA)
        
        # Lock surfaces for pixel access
        # This is slow in python but fine for 1 asset
        
        # Actually, let's just do pixel manipulation, it's safer for "erasing"
        for x in range(width):
            for y in range(height):
                # Simple jagged formula
                # x < (something dependent on y) -> Transparent
                
                # Sawtooth:
                cycle = 60 # Pixel height of one spike
                phase = (y % cycle) / cycle # 0.0 to 1.0
                
                # Triangle wave 0 -> 1 -> 0
                if phase < 0.5:
                    val = phase * 2 # 0 to 1
                else:
                    val = 2 - (phase * 2) # 1 to 0
                
                # val is 0 at peaks, 1 at center.
                # We want spike TIP at X=0.
                # So if val is 0 (tip), we explicitly keep pixels starting at X=0?
                # No, we want "Spike" means solid sticks out left.
                
                # Let's say max spike length is 150px.
                # Solid starts at x = 150.
                # Spike tip reaches x = 0.
                
                threshold = 150 - (val * 150) 
                
                # If x is less than threshold, it's transparent (air).
                # If x >= threshold, it's ground.
                
                if x < threshold:
                    final_surf.set_at((x,y), (0,0,0,0))
                else:
                    final_surf.set_at((x,y), original.get_at((x,y)))
                    
        pygame.image.save(final_surf, output_path)
        print(f"Created spiked intro: {output_path}")

    except Exception as e:
        print(e)
    finally:
        pygame.quit()

if __name__ == "__main__":
    create_spiked_intro(
        "c:/xampp/htdocs/heli/assets/images/ground_v4.png", 
        "c:/xampp/htdocs/heli/assets/images/ground_intro.png"
    )
