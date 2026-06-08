import re
with open('frontend/src/index.css', 'r') as f:
    content = f.read()

content = re.sub(r'<<<<<<< HEAD\n(.*?)=======\n(.*?)\n>>>>>>> [a-f0-9]+\n', r'\1\n\2', content, flags=re.DOTALL)

with open('frontend/src/index.css', 'w') as f:
    f.write(content)
