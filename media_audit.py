import os
from PIL import Image
import sys
import subprocess

def get_image_info(path):
    try:
        with Image.open(path) as img:
            dpi = img.info.get('dpi', (72, 72))
            return {
                'type': 'image',
                'path': path,
                'format': img.format,
                'size': img.size,
                'dpi': dpi,
                'mode': img.mode,
                'filesize_kb': os.path.getsize(path) // 1024
            }
    except Exception as e:
        return {'type': 'image', 'path': path, 'error': str(e)}

def get_video_info(path):
    try:
        # ffprobe must be installed
        cmd = [
            'ffprobe', '-v', 'error', '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height,duration',
            '-of', 'default=noprint_wrappers=1', path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        info = {'type': 'video', 'path': path, 'filesize_mb': os.path.getsize(path) // (1024*1024)}
        for line in result.stdout.splitlines():
            if '=' in line:
                k, v = line.split('=')
                info[k] = v
        return info
    except Exception as e:
        return {'type': 'video', 'path': path, 'error': str(e)}

def scan_folder(root):
    report = []
    for dirpath, dirnames, filenames in os.walk(root):
        for f in filenames:
            ext = f.lower().split('.')[-1]
            full = os.path.join(dirpath, f)
            if ext in ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tif', 'tiff']:
                report.append(get_image_info(full))
            elif ext in ['mp4', 'mov', 'avi', 'webm', 'mkv']:
                report.append(get_video_info(full))
    return report

def main():
    root = '.'
    report = scan_folder(root)
    with open('media_audit_report.txt', 'w') as f:
        for item in report:
            f.write(str(item) + '\n')
    print('Audit complete. See media_audit_report.txt for details.')

if __name__ == '__main__':
    main()
