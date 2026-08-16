import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Minus } from "lucide-react";

const COMPARISON_FEATURES = [
  { id: "dex", name: "Live DEX Tracking", us: true, screener: true, analytics: true, charting: false },
  { id: "copy", name: "1-Click Copy Trading", us: true, screener: false, analytics: false, charting: false },
  { id: "security", name: "Smart Contract Audit", us: true, screener: true, analytics: false, charting: false },
  { id: "ai", name: "AI Candlestick Vision", us: true, screener: false, analytics: false, charting: "partial" },
  { id: "autopilot", name: "AI Auto-Pilot", us: true, screener: false, analytics: false, charting: "code" },
  { id: "telegram", name: "Telegram Alert Bot", us: true, screener: false, analytics: "partial", charting: false },
  { id: "portfolio", name: "Unified Portfolio Sync", us: true, screener: false, analytics: false, charting: false },
];

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

export function Comparison() {
  const renderIcon = (status: boolean | "partial" | "code") => {
    if (status === true) {
      return (
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            <Check size={14} strokeWidth={3} />
          </div>
        </div>
      );
    }
    if (status === false) {
      return (
        <div className="flex justify-center">
          <Minus size={20} className="text-slate-700" />
        </div>
      );
    }
    if (status === "partial") {
      return (
        <div className="flex justify-center flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-white/20 text-[var(--text-main)] flex items-center justify-center">
            <Check size={14} strokeWidth={2} />
          </div>
          <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Partial</span>
        </div>
      );
    }
    if (status === "code") {
      return (
        <div className="flex justify-center flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-white/20 text-[var(--text-main)] flex items-center justify-center">
            <Check size={14} strokeWidth={2} />
          </div>
          <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Code Req.</span>
        </div>
      );
    }
  };

  return (
    <section className="relative z-10 px-6 lg:px-16 max-w-[1200px] mx-auto mb-32 space-y-16">
      <FadeUp className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-[var(--text-main)] text-xs font-semibold mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          The Ultimate Edge
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-main)] mb-4 tracking-tight leading-[1.1]">
          Why use five apps when you can use <span className="text-[var(--text-main)] underline decoration-white/30 underline-offset-8">one</span>?
        </h2>
        <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg leading-relaxed">
          Stop paying for multiple subscriptions and constantly switching tabs. We unified the fragmented crypto tooling ecosystem.
        </p>
      </FadeUp>

      <FadeUp delay={0.2}>
        <div className="relative rounded-[32px] bg-[var(--bg-base)] border border-[var(--border-base)] p-2 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-white/5 blur-[120px] rounded-full pointer-events-none opacity-20" />
          
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-6 font-semibold text-[var(--text-muted)] text-sm tracking-wider uppercase border-b border-[var(--border-subtle)]">
                    Features
                  </th>
                  <th className="p-6 text-center border-b border-[var(--border-subtle)] w-[160px]">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full mb-2">
                        CryptoNeko
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Our Platform</span>
                    </div>
                  </th>
                  <th className="p-6 text-center border-b border-[var(--border-subtle)] w-[140px]">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                        Screener
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">DEX Monitors</span>
                    </div>
                  </th>
                  <th className="p-6 text-center border-b border-[var(--border-subtle)] w-[140px]">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                        Analytics
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">On-Chain Giants</span>
                    </div>
                  </th>
                  <th className="p-6 text-center border-b border-[var(--border-subtle)] w-[140px]">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                        Charting
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Legacy Charts</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_FEATURES.map((feature) => (
                  <tr key={feature.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <span className="font-medium text-slate-200 group-hover:text-[var(--text-main)] transition-colors">{feature.name}</span>
                    </td>
                    <td className="p-6 bg-white/[0.02]">
                      {renderIcon(feature.us)}
                    </td>
                    <td className="p-6">
                      {renderIcon(feature.screener)}
                    </td>
                    <td className="p-6">
                      {renderIcon(feature.analytics)}
                    </td>
                    <td className="p-6">
                      {renderIcon(feature.charting)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="p-6 font-medium text-slate-200">
                    Monthly Cost (Est.)
                  </td>
                  <td className="p-6 text-center font-black text-[var(--text-main)] text-xl bg-white/[0.02]">
                    Free / $29
                  </td>
                  <td className="p-6 text-center font-mono text-[var(--text-muted)]">
                    Free / $10
                  </td>
                  <td className="p-6 text-center font-mono text-[var(--text-muted)]">
                    $1k+
                  </td>
                  <td className="p-6 text-center font-mono text-[var(--text-muted)]">
                    $60
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
