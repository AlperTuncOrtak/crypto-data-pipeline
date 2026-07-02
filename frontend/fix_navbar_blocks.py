import re

with open('src/components/layout/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove THEME TOGGLE block exactly by finding its start and end
start_theme = content.find('{/* THEME TOGGLE */}')
end_theme = content.find('</button>', start_theme) + len('</button>')
if start_theme != -1 and end_theme != -1:
    content = content[:start_theme] + content[end_theme:]

# Remove LANGUAGE SWITCHER block exactly
start_lang = content.find('{/* LANGUAGE SWITCHER */}')
# The language switcher ends right before {/* AUTH */}
end_lang = content.find('{/* AUTH */}', start_lang)
if start_lang != -1 and end_lang != -1:
    content = content[:start_lang] + content[end_lang:]

with open('src/components/layout/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
