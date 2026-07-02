import re

with open('src/pages/Landing.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

new_card = '''          <FadeIn delay={0.5} whileHover={{ y: -8, transition: { duration: 0.3 } }} className="md:col-span-3 relative group overflow-hidden rounded-[2rem] bg-[#19191c] border border-[var(--accent)]/30 p-6 md:p-10 min-h-[350px] flex flex-col justify-between">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--accent)]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[var(--accent)]/20 transition-colors duration-700"></div>
            
            {/* UI Preview: Orbs */}
            <div className="relative z-10 flex-1 mb-8 w-full rounded-2xl border border-white/5 bg-black/40 overflow-hidden group-hover:border-white/10 transition-colors shadow-2xl flex items-center justify-center p-8">
               <div className="relative w-full h-full min-h-[160px] flex items-center justify-center gap-6">
                 {/* Orb 1 */}
                 <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.4)] relative" style={{ background: "radial-gradient(circle at 30% 30%, #e11d48dd, #e11d4844, rgba(0,0,0,0.8))" }}>
                   <div className="absolute top-[10%] left-[15%] w-[40%] h-[30%] rounded-[100%] bg-white/20 rotate-[-45deg] blur-[2px] pointer-events-none" />
                   <span className="text-white font-black text-xs">Memecoins</span>
                 </div>
                 {/* Orb 2 */}
                 <div className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.5)] relative -mt-8" style={{ background: "radial-gradient(circle at 30% 30%, #7c3aeddd, #7c3aed44, rgba(0,0,0,0.8))" }}>
                   <div className="absolute top-[10%] left-[15%] w-[40%] h-[30%] rounded-[100%] bg-white/20 rotate-[-45deg] blur-[2px] pointer-events-none" />
                   <span className="text-white font-black text-sm">AI</span>
                 </div>
                 {/* Orb 3 */}
                 <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] relative" style={{ background: "radial-gradient(circle at 30% 30%, #10b981dd, #10b98144, rgba(0,0,0,0.8))" }}>
                   <div className="absolute top-[10%] left-[15%] w-[40%] h-[30%] rounded-[100%] bg-white/20 rotate-[-45deg] blur-[2px] pointer-events-none" />
                   <span className="text-white font-black text-[10px]">RWA</span>
                 </div>
               </div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-4">
                  <Brain className="text-[var(--accent)]" size={20} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight text-white">AI Narrative Map <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-[var(--accent)] text-[#111]">New</span></h3>
                <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
                  Stop chasing green candles. Our AI visually maps where the market liquidity and hype are flowing in real-time. Follow the narratives before they break out.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>'''

target = '          </FadeIn>\n        </div>'
if target in c:
    c = c.replace(target, '          </FadeIn>\n\n' + new_card)

with open('src/pages/Landing.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
