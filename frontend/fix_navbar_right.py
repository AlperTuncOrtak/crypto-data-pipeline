import re

with open('src/components/layout/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the Theme Toggle block
content = re.sub(r'\{\/\* THEME TOGGLE \*\/.*?\}\s*<\/button>', '', content, flags=re.DOTALL)

# Remove the Language Switcher block
content = re.sub(r'\{\/\* LANGUAGE SWITCHER \*\/.*?(?:<\/div>\s*){2}\)', '', content, flags=re.DOTALL)

with open('src/components/layout/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
