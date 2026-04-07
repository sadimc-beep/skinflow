import os
import glob
import re

patterns = [
    (r'className="text-2xl font-bold tracking-tight text-slate-900"', r'className="font-display text-3xl text-[#1C1917] tracking-tight"'),
    (r'className="text-2xl font-bold tracking-tight"', r'className="font-display text-3xl text-[#1C1917] tracking-tight"'),
    (r'className="text-2xl font-bold"', r'className="font-display text-3xl text-[#1C1917] tracking-tight"')
]

def process_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    original_content = content
    for old, new in patterns:
        content = content.replace(old, new)
        
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Updated {file_path}")

base_dir = '/Users/minhazuddinchowdhury/Documents/Dev/skinflow-emr-v4/apps/web/src/app/(app)'
for root, dirs, files in os.walk(base_dir):
    for fn in files:
        if fn.endswith('.tsx') and fn != 'page.tsx' and fn != 'layout.tsx':
             process_file(os.path.join(root, fn))
        if fn == 'page.tsx':
             process_file(os.path.join(root, fn))

