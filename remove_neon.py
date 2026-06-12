import os, glob, re

files = glob.glob('frontend/src/**/*.tsx', recursive=True)
count = 0

neon_colors = [
    '0,240,255', '0, 240, 255', '#00f0ff', '#00c6ff', 
    '0,ff,80', '#00ff80', '2dd4bf', '#2dd4bf',
    'f43f5e', '#f43f5e', '#e74c3c', '231,76,60', '231, 76, 60',
    'f59e0b', '#f59e0b', '245,166,35', '245, 166, 35',
    '#ffd700'
]

# Build regex pattern for these colors
color_pattern = '|'.join([re.escape(c) for c in neon_colors])
regex_glow = re.compile(rf'(boxShadow|textShadow):\s*[`\'"][^`\'"]*(?:{color_pattern})[^`\'"]*[`\'"]')
regex_ternary = re.compile(rf'(boxShadow|textShadow):\s*[^?:]+\s*\?\s*[`\'"][^`\'"]*(?:{color_pattern})[^`\'"]*[`\'"]\s*:\s*[`\'"]none[`\'"]')

# Also check drop-shadow in filter
regex_drop = re.compile(rf'drop-shadow\([^)]*(?:{color_pattern})[^)]*\)')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    original = content
    
    # 1. Replace ternary condition first
    # e.g. boxShadow: hov ? "0 0 40px rgba(0,240,255,0.12)" : "none"
    # -> boxShadow: "none"
    content = regex_ternary.sub(r'\1: "none"', content)
    
    # 2. Replace static assignments
    # e.g. textShadow: "0 0 10px rgba(0,240,255,0.5)" -> textShadow: "none"
    content = regex_glow.sub(r'\1: "none"', content)
    
    # 3. Replace drop-shadow filters
    content = regex_drop.sub(r'drop-shadow(0 0 0 transparent)', content)
    
    # 4. Also catch JS style manipulations: e.currentTarget.style.boxShadow = "..."
    content = re.sub(rf'style\.(boxShadow|textShadow)\s*=\s*[`\'"][^`\'"]*(?:{color_pattern})[^`\'"]*[`\'"]', r'style.\1 = "none"', content)
    
    if content != original:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        count += 1
        print(f'Updated {f}')

print(f'Total files updated: {count}')
