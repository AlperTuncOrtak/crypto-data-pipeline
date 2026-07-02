import re

with open('src/pages/Landing.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace <div with <motion.div for those specific lines
c = re.sub(
    r'<div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center shadow-\[0_0_30px_rgba\(225,29,72,0.4\)\] relative" style=\{\{ background: "radial-gradient\(circle at 30% 30%, #e11d48dd, #e11d4844, rgba\(0,0,0,0.8\)\)" \}\}>',
    r'<motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0 }} className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.4)] relative" style={{ background: "radial-gradient(circle at 30% 30%, #e11d48dd, #e11d4844, rgba(0,0,0,0.8))" }}>',
    c
)

c = re.sub(
    r'<div className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center shadow-\[0_0_40px_rgba\(124,58,237,0.5\)\] relative -mt-8" style=\{\{ background: "radial-gradient\(circle at 30% 30%, #7c3aeddd, #7c3aed44, rgba\(0,0,0,0.8\)\)" \}\}>',
    r'<motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }} className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.5)] relative -mt-8" style={{ background: "radial-gradient(circle at 30% 30%, #7c3aeddd, #7c3aed44, rgba(0,0,0,0.8))" }}>',
    c
)

c = re.sub(
    r'<div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center shadow-\[0_0_20px_rgba\(16,185,129,0.3\)\] relative" style=\{\{ background: "radial-gradient\(circle at 30% 30%, #10b981dd, #10b98144, rgba\(0,0,0,0.8\)\)" \}\}>',
    r'<motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }} className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] relative" style={{ background: "radial-gradient(circle at 30% 30%, #10b981dd, #10b98144, rgba(0,0,0,0.8))" }}>',
    c
)

with open('src/pages/Landing.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
