import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Backgrounds
    content = re.sub(r'bg-\[\#(0a0b0d|0B0E14|000000|030303|050505|060606|0a0a0a|080b10|020817|111111|121212|0d0d0d|101111)\]', 'bg-[var(--bg-base)]', content, flags=re.IGNORECASE)
    content = re.sub(r'bg-\[\#(111214|16181c|09090b|18181b|1a1c23)\]', 'bg-[var(--bg-subtle)]', content, flags=re.IGNORECASE)
    content = re.sub(r'bg-\[\#(13151a|15181e|1a1d21|1e1e1e|22262b|1a1a1a|19191c|27272a|2a2d31|272727|1e2227|242728)\]', 'bg-[var(--bg-elevated)]', content, flags=re.IGNORECASE)

    # Accent (Coinbase Blue -> Electric Indigo var)
    content = re.sub(r'bg-\[\#(0052ff)\]', 'bg-[var(--accent)]', content, flags=re.IGNORECASE)
    content = re.sub(r'text-\[\#(0052ff)\]', 'text-[var(--accent)]', content, flags=re.IGNORECASE)
    content = re.sub(r'border-\[\#(0052ff)\]', 'border-[var(--accent)]', content, flags=re.IGNORECASE)
    content = re.sub(r'bg-\[\#(0045d8|003ecc)\]', 'bg-[var(--accent-hover)]', content, flags=re.IGNORECASE)
    
    # Borders
    content = re.sub(r'border-white/5', 'border-[var(--border-subtle)]', content)
    content = re.sub(r'border-white/10', 'border-[var(--border-base)]', content)
    content = re.sub(r'border-\[\#(1e1e1e|2a2d31|1a1d21|3a3d41|273951|242728)\](/50|/30)?', 'border-[var(--border-base)]', content, flags=re.IGNORECASE)

    # Text Colors
    content = re.sub(r'text-\[\#(8b909a|6b707a|a8acb3|4a4d51)\]', 'text-[var(--text-muted)]', content, flags=re.IGNORECASE)
    content = re.sub(r'text-gray-(400|500)', 'text-[var(--text-muted)]', content)
    content = re.sub(r'text-slate-(400|500)', 'text-[var(--text-muted)]', content)
    
    # We will replace text-white only if it's not part of a button or something explicitly colored? 
    # Actually, replacing text-white with text-[var(--text-main)] is usually safe for general text.
    # Let's replace text-white only if it's NOT followed by a slash (like text-white/50)
    content = re.sub(r'\btext-white(?!\/)', 'text-[var(--text-main)]', content)

    # Radii
    content = re.sub(r'\brounded-lg\b', 'rounded-2xl', content)
    content = re.sub(r'\brounded-md\b', 'rounded-2xl', content)
    content = re.sub(r'\brounded-xl\b', 'rounded-3xl', content)

    # Interactive States (Hover/Focus)
    # Convert hover:bg-white/5 to hover:bg-[var(--border-subtle)] or hover:bg-[var(--bg-elevated)]
    content = re.sub(r'hover:bg-white/10', 'hover:bg-[var(--border-base)]', content)
    content = re.sub(r'hover:bg-white/5', 'hover:bg-[var(--border-subtle)]', content)

    # Shadows
    # Add a subtle shadow where rounded-2xl is used if not already shadowed
    # We will leave this for manual review, but we can replace hardcoded shadows
    content = re.sub(r'shadow-\[0_0_20px_rgba.*?\]', 'shadow-[0_0_20px_var(--accent)]', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    src_dir = os.path.join(os.path.dirname(__file__), 'src')
    
    # Process all tsx files
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                process_file(filepath)
                print(f"Processed: {filepath}")

if __name__ == '__main__':
    main()
