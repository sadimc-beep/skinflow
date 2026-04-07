import os
import re

directories_to_check = [
    '/Users/minhazuddinchowdhury/Documents/Dev/skinflow-emr-v4/apps/web/src/components/accounting',
    '/Users/minhazuddinchowdhury/Documents/Dev/skinflow-emr-v4/apps/web/src/components/inventory',
    '/Users/minhazuddinchowdhury/Documents/Dev/skinflow-emr-v4/apps/web/src/components/clinical'
]

def process_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    original_content = content
    
    # We want to replace text-base and text-lg inside TableCell or general classNames in these components,
    # specifically targeting recent "larger typography" additions.
    # A safe replacement is to replace `text-lg px-6 py-4` with normal padding and `text-sm`.
    
    content = re.sub(r'text-lg py-4 px-6|text-base py-4 px-6|text-lg px-6 py-4|text-base px-6 py-4', 'text-sm px-4 py-3', content)
    content = content.replace('text-base', 'text-sm')
    content = content.replace('text-lg', 'text-sm')
    
    # Revert uppercase tracking-wider text-sm to just text-sm font-medium for headers
    content = content.replace('text-sm uppercase tracking-wider text-[#A0978D] font-bold', 'text-sm font-medium text-muted-foreground')
    content = content.replace('uppercase tracking-wider text-[10px] sm:text-xs', 'text-xs')
    content = content.replace('uppercase tracking-wider', '')
        
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Updated {file_path}")

for d in directories_to_check:
    for root, dirs, files in os.walk(d):
        for fn in files:
            if fn.endswith('.tsx'):
                 process_file(os.path.join(root, fn))

