import re

with open('src/components/layout/WatchlistSidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'background: "#0a0b0d",',
    'background: "transparent",'
)

with open('src/components/layout/WatchlistSidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
