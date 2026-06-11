import re

with open('frontend/src/pages/Landing.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Find the sticky cards section - it starts with the div className
pattern = re.compile(r'<div className="relative mx-auto mt-32 pb-40" style=\{\{ maxWidth: 1[0-9]+ \}\}>.*?(?=\s*\{/\*\s*HOW IT WORKS\s*\*/\})', re.DOTALL)

match = pattern.search(code)
if not match:
    print("Section not found, trying alternate...")
    # Just search for the start
    start_idx = code.find('<div className="relative mx-auto mt-32 pb-40"')
    if start_idx == -1:
        print("Start not found either")
        exit(1)
    end_idx = code.find('{/* HOW IT WORKS */', start_idx)
    if end_idx == -1:
        print("End not found")
        exit(1)
    # Find where the enclosing </section> before HOW IT WORKS ends
    print(f"Found at {start_idx} to {end_idx}")
    print("Context around end:", repr(code[end_idx-100:end_idx+20]))
    exit(0)
else:
    print(f"Found match at {match.start()} to {match.end()}")
    print("Start context:", repr(code[match.start():match.start()+100]))
