
try:
    import pngquant
    print("pngquant import successful")
except ImportError:
    print("pngquant import failed")

import shutil
from pathlib import Path

# Verify if we can run it
print("Checking execution...")
try:
    # Most python pngquant libs enable running it command line or via function
    # Let's try to see if we can find where it is or use it
    pass
except Exception as e:
    print(e)
