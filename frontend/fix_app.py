import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Import Narratives
if 'import Narratives' not in c:
    c = c.replace('import Analysis from "./pages/Analysis";', 'import Analysis from "./pages/Analysis";\nimport Narratives from "./pages/Narratives";')

# 2. Add Route
if '<Route path="/narratives"' not in c:
    c = c.replace('<Route path="/heatmap" element={<Heatmap />} />', '<Route path="/heatmap" element={<Heatmap />} />\n          <Route path="/narratives" element={<Narratives />} />')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
