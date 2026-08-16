import { motion } from "framer-motion";

export function LinearSpeed() {
  return (
    <section className="py-24 px-6 max-w-[1200px] mx-auto relative z-10 flex flex-col md:flex-row items-center gap-16">
      <div className="flex-1">
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-main)] mb-6">
          Built for speed.
        </h2>
        <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-8">
          Navigate markets, place trades, and switch between tools without ever touching your mouse. The entire terminal is built around an impossibly fast command menu.
        </p>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 bg-white/[0.02] border border-[var(--border-subtle)] rounded-full px-4 py-2">
            <span className="text-slate-300 text-sm font-medium">Search Markets</span>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded-2xl text-xs font-mono text-[var(--text-main)]">Cmd</kbd>
              <span className="text-[var(--text-muted)]">+</span>
              <kbd className="px-2 py-1 bg-white/10 rounded-2xl text-xs font-mono text-[var(--text-main)]">K</kbd>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/[0.02] border border-[var(--border-subtle)] rounded-full px-4 py-2">
            <span className="text-slate-300 text-sm font-medium">Quick Trade</span>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded-2xl text-xs font-mono text-[var(--text-main)]">T</kbd>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/[0.02] border border-[var(--border-subtle)] rounded-full px-4 py-2">
            <span className="text-slate-300 text-sm font-medium">Toggle AI</span>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded-2xl text-xs font-mono text-[var(--text-main)]">A</kbd>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex justify-center">
        {/* Command Palette Mockup */}
        <div className="w-full max-w-sm rounded-3xl border border-[var(--border-base)] bg-[var(--bg-base)] shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="border-b border-[var(--border-base)] p-4 flex items-center gap-3">
            <span className="text-[var(--text-muted)] text-lg">›</span>
            <span className="text-[var(--text-main)] text-sm font-mono animate-pulse">Switch to BTC/USDT_</span>
          </div>
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 bg-white/10 rounded-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-orange-500" />
                <span className="text-[var(--text-main)] text-sm">Bitcoin (BTC)</span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">Market</span>
            </div>
            <div className="px-3 py-2 hover:bg-[var(--border-subtle)] rounded-2xl flex justify-between items-center transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-slate-300 text-sm">Ethereum (ETH)</span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">Market</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
