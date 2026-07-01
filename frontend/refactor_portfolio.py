import re

with open('src/pages/Portfolio.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old_return = '''  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white pt-24 pb-32 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">'''

new_return = '''  return (
    <div className="relative min-h-screen bg-[#0d0d0f] text-white pt-24 pb-32 px-6 lg:px-12 overflow-x-hidden">
      {/* ── CINEMATIC GLOW BACKGROUND ── */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-[100%] blur-[150px] opacity-[0.25] mix-blend-screen transition-colors duration-1000"
          style={{ background: adial-gradient(ellipse at top, #627EEA, transparent 70%) }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d0f]/90 to-[#0d0d0f] z-10" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-20">'''

c = c.replace(old_return, new_return)

c = re.sub(
    r'className="bg-\[#19191c\] border border-white/5 rounded-\[2rem\]([^"]*)"',
    r'className="bg-[#19191c]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[1.5rem]\1"',
    c
)

c = re.sub(
    r'className="bg-\[#19191c\] border border-white/5 rounded-3xl([^"]*)"',
    r'className="bg-[#19191c]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl\1"',
    c
)

c = re.sub(
    r'\{fmtUSD\(([^)]+)\)\}',
    r'<NumberFlow value={Number(\1) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} />',
    c
)

c = re.sub(
    r'\{fmtNum\(([^)]+)\)\}',
    r'<NumberFlow value={Number(\1) || 0} format={{ maximumFractionDigits: 6 }} />',
    c
)

with open('src/pages/Portfolio.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
