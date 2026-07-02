import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = [
    'Dashboard', 'Market', 'Alerts', 'Analysis', 'Narratives', 'WhaleXRay', 
    'TimeMachine', 'Leaderboard', 'CoinDetail', 'Heatmap', 'AIAnalysis', 
    'Pricing', 'Pro', 'Portfolio', 'Onboarding', 'CreateAlert', 'Settings', 'Landing', 'Login'
]

for imp in imports:
    content = re.sub(f'import {imp} from \"\./pages/{imp}\";', f'const {imp} = lazy(() => import(\"./pages/{imp}\"));', content)

if '<Suspense fallback' not in content:
    content = content.replace('<Routes>', '<Suspense fallback={<div className=\"h-screen flex items-center justify-center bg-[#0a0b0d]\"><div className=\"w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin\"></div></div>}><Routes>')
    content = content.replace('</Routes>', '</Routes></Suspense>')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
