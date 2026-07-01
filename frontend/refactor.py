import re

with open('src/pages/AIAnalysis.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace main cards
c = re.sub(
    r'style=\{\{\s*background:\s*"rgba\(255,\s*255,\s*255,\s*0\.02\)",\s*border:\s*"1px solid rgba\(255,\s*255,\s*255,\s*0\.06\)",\s*borderRadius:\s*24,\s*padding:\s*"24px",?\s*\}\}',
    r'className="bg-[#19191c]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[1.5rem] p-6"',
    c
)

# Replace the inner panels
c = re.sub(
    r'style=\{\{\s*padding:\s*"24px",\s*borderRadius:\s*20,\s*backgroundColor:\s*"rgba\(255, 255, 255, 0\.02\)",\s*border:\s*"1px solid rgba\(255, 255, 255, 0\.05\)",?\s*\}\}',
    r'className="bg-[#19191c]/50 backdrop-blur-md border border-white/5 shadow-inner rounded-3xl p-6"',
    c
)

with open('src/pages/AIAnalysis.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
