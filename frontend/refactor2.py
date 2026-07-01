import re

with open('src/pages/AIAnalysis.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add framer motion import if not there
if "import { motion }" not in c:
    c = c.replace('import { useScrollReveal } from "../hooks/useScrollReveal";', 'import { useScrollReveal } from "../hooks/useScrollReveal";\nimport { motion } from "framer-motion";')

# Inject cinematic glow background
old_return = '''
  return (
    <div
      ref={revealRef}
      style={{ color: "var(--text-primary)", maxWidth: 1100, margin: "0 auto" }}
    >
'''

glow_color = "\"

new_return = f'''
  return (
    <div
      ref={{revealRef}}
      className="relative min-h-screen text-white pt-24 pb-32 px-6"
    >
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-[100%] blur-[150px] opacity-[0.25] mix-blend-screen transition-colors duration-1000"
          style={{{{ background: adial-gradient(ellipse at top, {glow_color}, transparent 70%) }}}}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d0f]/90 to-[#0d0d0f] z-10" />
      </div>

      <div className="max-w-[1200px] mx-auto relative z-20">
'''

c = c.replace(old_return, new_return)

# Close the new div at the very bottom
# We know the file ends with:
#     </div>
#   );
# }
c = re.sub(r'    </div>\s*\);\s*\}\s*$', '      </div>\n    </div>\n  );\n}', c)

with open('src/pages/AIAnalysis.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
