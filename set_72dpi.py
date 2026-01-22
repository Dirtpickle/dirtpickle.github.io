import os
from PIL import Image

def set_72dpi_image(path):
    try:
        with Image.open(path) as img:
            dpi = img.info.get('dpi', (72, 72))
            if dpi == (72, 72):
                return False  # Already 72 DPI
            # Save with 72 DPI, preserve format and mode
            img.save(path, dpi=(72, 72))
            return True
    except Exception as e:
        print(f"Error processing {path}: {e}")
        return False

def batch_set_72dpi(root):
    changed = []
    for dirpath, dirnames, filenames in os.walk(root):
        for f in filenames:
            ext = f.lower().split('.')[-1]
            if ext in ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tif', 'tiff']:
                full = os.path.join(dirpath, f)
                if set_72dpi_image(full):
                    changed.append(full)
    return changed

def main():
    root = '.'
    changed = batch_set_72dpi(root)
    print(f"Updated {len(changed)} images to 72 DPI.")
    if changed:
        with open('images_72dpi.txt', 'w') as f:
            for path in changed:
                f.write(path + '\n')

if __name__ == '__main__':
    main()
