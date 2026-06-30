import glob
import re
import codecs

def fix_file(filepath):
    try:
        with codecs.open(filepath, 'r', 'utf-8') as f:
            content = f.read()
    except Exception as e:
        return
        
    original = content
    
    # Regex to find elements with two className attributes:
    # e.g. <div className="reveal" className="linear-card" style=...
    # We will look for className="([^"]*)"\s+className="([^"]*)"
    
    # This might have newlines between them
    pattern = re.compile(r'className="([^"]*)"\s+className="([^"]*)"')
    
    def repl(m):
        return f'className="{m.group(1)} {m.group(2)}"'
        
    content = pattern.sub(repl, content)
    
    if content != original:
        with codecs.open(filepath, 'w', 'utf-8') as f:
            f.write(content)
        print(f"Fixed duplicate className in {filepath}")

for path in glob.glob('src/**/*.tsx', recursive=True):
    fix_file(path)

print("Done fixing classes.")
