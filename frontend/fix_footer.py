import re

with open('src/pages/Landing.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

footer_regex = re.compile(r'\{/\*\s*── FOOTER ──\s*\*/\}.*?</footer\>', re.DOTALL)
c = re.sub(footer_regex, '', c)

with open('src/pages/Landing.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
