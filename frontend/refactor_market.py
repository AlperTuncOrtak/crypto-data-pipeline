import re

with open('src/pages/Market.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add cinematic glow to Market.tsx
old_main_div = '<div className="max-w-[1320px] mx-auto px-8 py-10 font-sans text-white min-h-screen">'
new_main_div = '''<div className="relative min-h-screen bg-[#0d0d0f] text-white pt-24 pb-32 px-6 lg:px-12 overflow-x-hidden font-sans">
      {/* ── CINEMATIC GLOW BACKGROUND ── */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-[100%] blur-[150px] opacity-[0.25] mix-blend-screen transition-colors duration-1000"
          style={{ background: adial-gradient(ellipse at top, var(--accent), transparent 70%) }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d0f]/90 to-[#0d0d0f] z-10" />
      </div>

      <div className="max-w-[1320px] mx-auto relative z-20">'''
c = c.replace(old_main_div, new_main_div)

# Fix the end of the file
old_end = '''      </FadeIn>
    </div>
  );
}'''
new_end = '''      </FadeIn>
      </div>
    </div>
  );
}'''
c = c.replace(old_end, new_end)

# 2. Add Bento Box to Main Table
old_table_box = '<div className="bg-[#19191c] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">'
new_table_box = '<div className="bg-[#19191c]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[1.5rem] overflow-hidden">'
c = c.replace(old_table_box, new_table_box)

# 3. Update Toolbar bg
old_toolbar = '<div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-white/5 bg-black/20">'
new_toolbar = '<div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-white/5 bg-white/[0.02]">'
c = c.replace(old_toolbar, new_toolbar)

# 4. Search input
old_search = 'className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm font-medium text-white placeholder-gray-500 outline-none focus:border-white/20 focus:bg-white/10 transition-all"'
new_search = 'className="w-full bg-[#111113] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[13px] font-medium text-white placeholder-white/30 outline-none focus:border-[var(--accent)] transition-all"'
c = c.replace(old_search, new_search)

# 5. Row class
old_row_class = 'className={grid grid-cols-[36px_44px_2.2fr_130px_110px_140px_130px_90px_70px] px-5 py-3 items-center gap-2 group transition-colors }'
new_row_class = 'className={grid grid-cols-[36px_44px_2.2fr_130px_110px_140px_130px_90px_70px] px-5 py-3 items-center gap-2 group transition-colors }'
c = c.replace(old_row_class, new_row_class)

with open('src/pages/Market.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
