import os
import re

def new_name(path):
    # Remove everything after the first hyphen (and the hyphen itself)
    dirname, filename = os.path.split(path)
    base, ext = os.path.splitext(filename)
    if '-' in base:
        base = base.split('-')[0].strip()
    return os.path.join(dirname, base + ext)

def batch_rename(root_dirs):
    rename_map = {}
    for root in root_dirs:
        for dirpath, dirnames, filenames in os.walk(root):
            for f in filenames:
                if '-' in f:
                    old_path = os.path.join(dirpath, f)
                    new_path = new_name(old_path)
                    if old_path != new_path and not os.path.exists(new_path):
                        os.rename(old_path, new_path)
                        rename_map[old_path] = new_path
    return rename_map

def main():
    roots = ['images', 'thumbnails']
    rename_map = batch_rename(roots)
    with open('renamed_images.txt', 'w') as f:
        for old, new in rename_map.items():
            f.write(f'{old} -> {new}\n')
    print(f'Renamed {len(rename_map)} files.')

if __name__ == '__main__':
    main()
