import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ─── Reusable animation wrappers ─── */
function SlideIn({ children, direction = "right", delay = 0, className = "" }: {
  children: React.ReactNode; direction?: "left" | "right"; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: direction === "right" ? 60 : -60 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

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

/* ─── 1. Whale X-Ray ─── */
const WHALE_DATA = [
  { id: "a1", type: "BUY",      token: "ETH",  amt: "$1.2M", time: "Just now",  cls: { row: "bg-emerald-500/10 border-emerald-500/20", badge: "bg-emerald-500/20 text-emerald-300", val: "text-emerald-400" } },
  { id: "a2", type: "SELL",     token: "WIF",  amt: "$800K",  time: "2m ago",    cls: { row: "bg-rose-500/10 border-rose-500/20",    badge: "bg-rose-500/20 text-rose-300",    val: "text-rose-400" } },
  { id: "a3", type: "TRANSFER", token: "USDC", amt: "$5.0M",  time: "15m ago",   cls: { row: "bg-white/5 border-white/10",           badge: "bg-white/10 text-slate-300",      val: "text-white" } },
  { id: "a4", type: "BUY",      token: "BTC",  amt: "$3.7M",  time: "Just now",  cls: { row: "bg-emerald-500/10 border-emerald-500/20", badge: "bg-emerald-500/20 text-emerald-300", val: "text-emerald-400" } },
  { id: "a5", type: "SELL",     token: "PEPE", amt: "$2.1M",  time: "4m ago",    cls: { row: "bg-rose-500/10 border-rose-500/20",    badge: "bg-rose-500/20 text-rose-300",    val: "text-rose-400" } },
  { id: "a6", type: "TRANSFER", token: "USDT", amt: "$9.4M",  time: "7m ago",    cls: { row: "bg-white/5 border-white/10",           badge: "bg-white/10 text-slate-300",      val: "text-white" } },
];

function WhaleDemo() {
  const [feed, setFeed] = useState(() => WHALE_DATA.slice(0, 3));
  const idxRef = useRef(3);
  useEffect(() => {
    const t = setInterval(() => {
      const next = idxRef.current % WHALE_DATA.length;
      idxRef.current = next + 1;
      setFeed(f => [WHALE_DATA[next], ...f].slice(0, 3));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative rounded-[28px] bg-[#020817] border border-white/10 p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/5 p-5 shadow-inner space-y-3 min-h-[240px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Whale Feed · All DEXs</span>
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          {feed.map((row) => (
            <motion.div key={row.id}
              layout
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${row.cls.row}`}>
              <div className="flex items-center gap-2.5">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${row.cls.badge}`}>{row.type}</span>
                <span className="font-bold text-white text-sm">{row.token}</span>
              </div>
              <div className="text-right">
                <div className={`font-mono text-sm font-black ${row.cls.val}`}>{row.amt}</div>
                <div className="text-[10px] text-slate-500">{row.time}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── 2. Time-Machine Backtesting ─── */
const BT_BARS = [28, 38, 30, 50, 42, 38, 45, 62, 70, 82, 76, 90, 80, 110];

function BacktestDemo() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [aiIdx, setAiIdx] = useState(-1);
  const AI_MSGS = [
    "Strong buy at the 0.618 Fibonacci level. Textbook accumulation pattern.",
    "SOL entry timing was near-perfect. Risk/reward ratio: 42x.",
    "Would recommend scaling into position over 3 tranches next time.",
  ];

  const run = useCallback(() => {
    if (running) return;
    setProgress(0); setDone(false); setAiIdx(-1); setRunning(true);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 10 + 5;
      if (p >= 100) {
        clearInterval(t);
        setProgress(100); setRunning(false); setDone(true);
        let i = 0;
        const m = setInterval(() => {
          setAiIdx(i);
          i++;
          if (i >= AI_MSGS.length) clearInterval(m);
        }, 1400);
      } else {
        setProgress(p);
      }
    }, 80);
  }, [running]);

  return (
    <div className="relative rounded-[28px] bg-[#020817] border border-white/10 p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/5 p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SOL/USDT · 2022–2023</span>
          {done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-white font-black text-lg font-mono">+4,250%</motion.span>}
        </div>

        {/* Chart bars */}
        <div className="flex items-end gap-1 h-20 w-full">
          {BT_BARS.map((h, i) => (
            <motion.div key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(h / 110) * 100}%` }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
              className={`flex-1 rounded-t-sm relative ${i < 6 ? "bg-white/20" : "bg-white/60"}`}>
              {i === 5 && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] text-white whitespace-nowrap font-bold">BOTTOM</div>}
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>{Math.min(100, Math.round(progress))}%</span>
            <span>RSI + EMA Cross</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
              className="h-full rounded-full bg-white" />
          </div>
        </div>

        {/* AI message */}
        <AnimatePresence mode="wait">
          {aiIdx >= 0 && (
            <motion.div key={aiIdx}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-white text-[10px] font-black shrink-0 mt-0.5">AI</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{AI_MSGS[aiIdx]}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={run}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${running ? "bg-white/5 text-slate-500 cursor-not-allowed" : done ? "bg-white/[0.04] border border-white/10 text-slate-400 hover:bg-white/10" : "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]"}`}>
          {running ? "Simulating..." : done ? "↩ Reset & Run Again" : "▶  Run Time-Machine"}
        </button>
      </div>
    </div>
  );
}

/* ─── 3. AI Candlestick Vision ─── */
const CANDLE_BARS = [40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95, 80, 72, 88];

function CandleDemo() {
  const [aiOn, setAiOn] = useState(false);
  return (
    <div className="relative rounded-[28px] bg-[#020817] border border-white/10 p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/5 p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">BTC/USDT · 1H</span>
          <button onClick={() => setAiOn(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-300 ${aiOn ? "bg-white border-white text-black shadow-[0_0_12px_rgba(255,255,255,0.3)]" : "bg-white/[0.04] border-white/10 text-slate-400 hover:border-white/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${aiOn ? "bg-black animate-pulse" : "bg-slate-600"}`} />
            AI Vision {aiOn ? "ON" : "OFF"}
          </button>
        </div>

        {/* Chart */}
        <div className="relative flex items-end gap-[3px] h-24 w-full">
          {/* Support line */}
          <AnimatePresence>
            {aiOn && (
              <motion.div key="support"
                initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute left-0 right-0 border-t border-dashed border-white/60 origin-left pointer-events-none"
                style={{ bottom: "28%" }}>
                <span className="absolute right-0 -top-4 text-[8px] text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">Support</span>
              </motion.div>
            )}
            {aiOn && (
              <motion.div key="resistance"
                initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute left-0 right-0 border-t border-dashed border-white/60 origin-left pointer-events-none"
                style={{ bottom: "74%" }}>
                <span className="absolute right-0 -top-4 text-[8px] text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">Resistance</span>
              </motion.div>
            )}
          </AnimatePresence>

          {CANDLE_BARS.map((h, i) => (
            <div key={i} className="flex-1 relative flex items-end" style={{ height: "100%" }}>
              <div className={`w-full rounded-sm ${h > 80 ? "bg-white/80" : h > 60 ? "bg-white/40" : "bg-white/20"}`}
                style={{ height: `${(h / 95) * 100}%` }} />
              {aiOn && h > 83 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="absolute inset-0 rounded-sm border border-white/50 bg-white/20 pointer-events-none" />
              )}
            </div>
          ))}
        </div>

        {/* AI tags */}
        <AnimatePresence>
          {aiOn && (
            <motion.div key="tags" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-2">
              {[
                { l: "Head & Shoulders", c: "bg-white/10 text-white border-white/20" },
                { l: "Liquidity Cluster", c: "bg-white/10 text-white border-white/20" },
                { l: "Hidden Bull Div",  c: "bg-white/10 text-white border-white/20" },
              ].map(t => (
                <div key={t.l} className={`text-center text-[8px] font-bold py-1.5 rounded-lg uppercase tracking-wide border ${t.c}`}>{t.l}</div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!aiOn && (
          <p className="text-[11px] text-slate-500 text-center pt-1">Toggle AI Vision to reveal hidden patterns</p>
        )}
      </div>
    </div>
  );
}

/* ─── FEATURES CONFIG ─── */
type Feature = {
  tag: string;
  title: string; desc: string; bullets: string[];
  Demo: React.ComponentType;
  flip: boolean;
};

const FEATURES: Feature[] = [
  { tag: "On-Chain Intelligence", title: "Whale X-Ray",            desc: "See exactly where the smart money is flowing. Our on-chain analysis engine tracks massive wallet movements across multiple DEXs in real-time. Don't be the exit liquidity; trade alongside the whales.",                                                                                                bullets: ["Live large transfer alerts", "DEX activity monitoring", "Wallet tagging and profiling"],             Demo: WhaleDemo,      flip: false },
  { tag: "Strategy Lab",          title: "Time-Machine Backtesting",desc: "What if you had bought Solana at the bottom of the bear market? Stop wondering. Simulate past market conditions, backtest your strategies, and receive an AI-generated analysis of your hypothetical portfolio performance.",                                                                          bullets: ["Historical price replay", "P&L Simulation", "AI-driven critique of your entries"],                  Demo: BacktestDemo,   flip: true  },
  { tag: "AI Vision",             title: "AI Candlestick Vision",   desc: "Tired of drawing lines manually? Toggle AI Vision on your charts and let Deep Learning instantly map support/resistance zones, highlight hidden patterns, and overlay orderbook density right on the candles.",                                                                                          bullets: ["Auto-drawn Support & Resistance", "Pattern recognition (Head & Shoulders, Flags)", "Liquidity heatmaps"], Demo: CandleDemo,  flip: false },
];

export function FeaturesZigZag() {
  return (
    <section className="relative z-10 px-6 lg:px-16 max-w-[1300px] mx-auto mb-32 space-y-32">

      {/* Section Header */}
      <FadeUp className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-white text-xs font-semibold mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Exclusive Features
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight leading-[1.1]">
          Tools that give you an{" "}
          <span className="text-white">
            unfair advantage
          </span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
          Features that institutional desks pay six figures for — now in your browser.
        </p>
      </FadeUp>

      {FEATURES.map((f) => {
        const { Demo } = f;
        return (
          <div key={f.title} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <FadeUp delay={0.1} className={f.flip ? "lg:order-2" : ""}>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-6 border-white/20 bg-white/5 text-white`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {f.tag}
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-5 tracking-tight leading-tight">{f.title}</h3>
              <p className="text-slate-400 text-base leading-relaxed mb-8">{f.desc}</p>
              <ul className="space-y-3">
                {f.bullets.map(b => (
                  <li key={b} className="flex items-center gap-3 text-slate-300 text-sm">
                    <span className={`w-1.5 h-1.5 shrink-0 rounded-full bg-white`} />
                    {b}
                  </li>
                ))}
              </ul>
            </FadeUp>

            {/* Demo — rendered as component, not pre-created JSX */}
            <SlideIn direction={f.flip ? "left" : "right"} delay={0.2} className={f.flip ? "lg:order-1" : ""}>
              <Demo />
            </SlideIn>
          </div>
        );
      })}
    </section>
  );
}
