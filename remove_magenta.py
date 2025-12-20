import pygame

def remove_magenta(input_path, output_path):
    try:
        pygame.init()
        # Create a dummy display to allow convert() if needed, or just skip it
        # but for image manipulation, we often don't need a display if we don't use convert()
        # However, to be safe:
        pygame.display.set_mode((1, 1), pygame.NOFRAME)

        # Load the image
        image = pygame.image.load(input_path).convert()
        
        # Set magenta (255, 0, 255) as colorkey (transparent)
        image.set_colorkey((255, 0, 255))
        
        # Create a new surface with alpha channel
        final_image = pygame.Surface(image.get_size(), pygame.SRCALPHA)
        final_image.blit(image, (0, 0))
        
        # Save the result
        pygame.image.save(final_image, output_path)
        print(f"Successfully saved transparent image to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        pygame.quit()

if __name__ == "__main__":
    # Adjust paths as needed
    input_file = "c:/xampp/htdocs/heli/assets/images/ground.png"
    output_file = "c:/xampp/htdocs/heli/assets/images/ground_v2.png"
    remove_magenta(input_file, output_file)
