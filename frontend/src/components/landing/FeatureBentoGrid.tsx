import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────
   WHALE X-RAY LIVE DEMO
──────────────────────────────── */
const WHALE_EVENTS = [
  { type: "BUY",      token: "ETH",  amount: "$1.2M", time: "Just now",  color: "emerald" },
  { type: "SELL",     token: "WIF",  amount: "$800K",  time: "2m ago",    color: "rose" },
  { type: "TRANSFER", token: "USDC", amount: "$5.0M",  time: "15m ago",   color: "cyan" },
  { type: "BUY",      token: "BTC",  amount: "$3.7M",  time: "Just now",  color: "emerald" },
  { type: "SELL",     token: "PEPE", amount: "$2.1M",  time: "4m ago",    color: "rose" },
  { type: "TRANSFER", token: "USDT", amount: "$9.4M",  time: "7m ago",    color: "cyan" },
];

function WhaleXRayDemo() {
  const [feed, setFeed] = useState(WHALE_EVENTS.slice(0, 3));
  const [idx, setIdx] = useState(3);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(prev => {
        const next = prev % WHALE_EVENTS.length;
        setFeed(f => [WHALE_EVENTS[next], ...f].slice(0, 4));
        return next + 1;
      });
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
    rose:    "bg-rose-500/10 border-rose-500/25 text-rose-400",
    cyan:    "bg-cyan-500/10 border-cyan-500/25 text-cyan-400",
  };
  const badgeMap: Record<string, string> = {
    emerald: "bg-emerald-500/20 text-emerald-300",
    rose:    "bg-rose-500/20 text-rose-300",
    cyan:    "bg-cyan-500/20 text-cyan-300",
  };

  return (
    <div className="relative w-full h-full rounded-[24px] bg-[var(--bg-base)] border border-white/[0.06] overflow-hidden p-5 flex flex-col gap-3 min-h-[320px]">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Live Whale Feed</span>
        </div>
        <span className="text-[10px] font-mono text-slate-600">All DEXs</span>
      </div>

      <AnimatePresence initial={false}>
        {feed.map((w, i) => (
          <motion.div
            key={`${w.token}-${w.time}-${i}`}
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`flex items-center justify-between px-4 py-3 rounded-3xl border ${colorMap[w.color]}`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-2xl uppercase tracking-widest ${badgeMap[w.color]}`}>
                {w.type}
              </span>
              <span className="font-bold text-[var(--text-main)] text-sm">{w.token}</span>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-[var(--text-main)] font-mono">{w.amount}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{w.time}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────
   TIME-MACHINE BACKTESTING DEMO
──────────────────────────────── */
const CANDLES = [28, 42, 35, 55, 48, 72, 60, 85, 70, 95, 80, 110];

function BacktestingDemo() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [aiMsg, setAiMsg] = useState("");

  const AI_MSGS = [
    "Strong buy at the 0.618 Fibonacci level. Textbook accumulation pattern.",
    "SOL entry timing was near-perfect. Risk/reward ratio: 42x.",
    "Would recommend scaling into position over 3 tranches next time.",
  ];

  const run = () => {
    if (running || done) {
      setProgress(0); setDone(false); setAiMsg("");
      return;
    }
    setRunning(true);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 8 + 4;
      if (p >= 100) {
        clearInterval(t);
        setProgress(100);
        setRunning(false);
        setDone(true);
        let i = 0;
        const msgT = setInterval(() => {
          setAiMsg(AI_MSGS[i]);
          i++;
          if (i >= AI_MSGS.length) clearInterval(msgT);
        }, 1200);
      } else {
        setProgress(p);
      }
    }, 80);
  };

  return (
    <div className="relative w-full h-full rounded-[24px] bg-[var(--bg-base)] border border-white/[0.06] overflow-hidden p-5 flex flex-col gap-4 min-h-[320px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">SOL/USDT · 2022–2023</span>
        {done && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-400 font-black text-lg font-mono">
            +4,250%
          </motion.span>
        )}
      </div>

      {/* Simulated candlestick chart */}
      <div className="flex items-end gap-1 h-24 w-full px-1">
        {CANDLES.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(h / 110) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
            className={`flex-1 rounded-sm ${i < 6 ? "bg-rose-500/40" : "bg-emerald-400/50"} relative`}
          >
            {i === 5 && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-amber-400 whitespace-nowrap font-bold">BOTTOM</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
          <span>Simulating {Math.min(100, Math.round(progress))}%</span>
          <span>Strategy: RSI + EMA Cross</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
          />
        </div>
      </div>

      {/* AI message */}
      <AnimatePresence mode="wait">
        {aiMsg && (
          <motion.div
            key={aiMsg}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-3xl bg-cyan-500/5 border border-cyan-500/20"
          >
            <span className="text-cyan-400 text-xs font-black shrink-0">AI</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">{aiMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={run}
        className={`mt-auto py-2.5 rounded-3xl text-sm font-bold transition-all ${
          running
            ? "bg-white/5 text-[var(--text-muted)] cursor-not-allowed"
            : done
              ? "bg-white/[0.04] border border-[var(--border-base)] text-[var(--text-muted)] hover:bg-[var(--border-base)]"
              : "bg-gradient-to-r from-purple-600 to-cyan-500 text-[var(--text-main)] hover:opacity-90 shadow-[0_0_20px_var(--accent)]"
        }`}
      >
        {running ? "Simulating..." : done ? "↩ Reset & Run Again" : "▶  Run Time-Machine"}
      </button>
    </div>
  );
}

/* ────────────────────────────────
   AI CANDLESTICK VISION DEMO
──────────────────────────────── */
const CHART_BARS = [40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95, 80, 72, 88];

function CandlestickVisionDemo() {
  const [aiOn, setAiOn] = useState(false);

  return (
    <div className="relative w-full h-full rounded-[24px] bg-[var(--bg-base)] border border-white/[0.06] overflow-hidden p-5 flex flex-col gap-4 min-h-[320px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">BTC/USDT · 1H</span>
        <button
          onClick={() => setAiOn(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-3xl text-xs font-bold transition-all border ${
            aiOn
              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.2)]"
              : "bg-white/[0.04] border-[var(--border-base)] text-[var(--text-muted)] hover:border-white/20"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${aiOn ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`} />
          AI Vision {aiOn ? "ON" : "OFF"}
        </button>
      </div>

      {/* Chart */}
      <div className="relative flex items-end gap-[3px] h-28 w-full px-1">
        {/* Support / Resistance lines */}
        <AnimatePresence>
          {aiOn && (
            <>
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400/60 origin-left"
                style={{ bottom: "28%" }}
              >
                <span className="absolute right-0 -top-4 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-2xl">Support</span>
              </motion.div>
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="absolute left-0 right-0 border-t-2 border-dashed border-rose-400/60 origin-left"
                style={{ bottom: "72%" }}
              >
                <span className="absolute right-0 -top-4 text-[9px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-2xl">Resistance</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {CHART_BARS.map((h, i) => (
          <div key={i} className="flex-1 relative flex flex-col items-center justify-end" style={{ height: "100%" }}>
            <div
              className={`w-full rounded-sm transition-all duration-500 ${
                h > 80 ? "bg-emerald-400/60" : h > 60 ? "bg-cyan-400/40" : "bg-rose-400/50"
              }`}
              style={{ height: `${(h / 95) * 100}%` }}
            />
            {/* Liquidity heatmap overlay */}
            {aiOn && h > 82 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-sm bg-yellow-400/20 border border-yellow-400/30"
              />
            )}
          </div>
        ))}
      </div>

      {/* AI tags */}
      <AnimatePresence>
        {aiOn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="grid grid-cols-3 gap-2"
          >
            {[
              { label: "Head & Shoulders", color: "purple" },
              { label: "Liquidity Cluster ×3", color: "amber" },
              { label: "Hidden Bull Div", color: "cyan" },
            ].map(tag => (
              <div
                key={tag.label}
                className={`text-center text-[9px] font-bold py-1.5 rounded-2xl uppercase tracking-wider ${
                  tag.color === "purple" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                  tag.color === "amber" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                }`}
              >
                {tag.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!aiOn && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] text-slate-600 text-center">Toggle AI Vision to reveal hidden patterns</p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────
   MAIN EXPORT
──────────────────────────────── */
const FEATURES = [
  {
    tag: "On-Chain Intelligence",
    tagColor: "emerald",
    title: "Whale X-Ray",
    description: "See exactly where the smart money is flowing. Our on-chain analysis engine tracks massive wallet movements across multiple DEXs in real-time. Don't be the exit liquidity; trade alongside the whales.",
    bullets: ["Live large transfer alerts", "DEX activity monitoring", "Wallet tagging and profiling"],
    demo: <WhaleXRayDemo />,
    flip: false,
  },
  {
    tag: "Strategy Lab",
    tagColor: "purple",
    title: "Time-Machine Backtesting",
    description: "What if you had bought Solana at the bottom of the bear market? Stop wondering. Simulate past market conditions, backtest your strategies, and receive an AI-generated analysis of your hypothetical portfolio performance.",
    bullets: ["Historical price replay", "P&L Simulation", "AI-driven critique of your entries"],
    demo: <BacktestingDemo />,
    flip: true,
  },
  {
    tag: "AI Vision",
    tagColor: "cyan",
    title: "AI Candlestick Vision",
    description: "Tired of drawing lines manually? Toggle AI Vision on your charts and let Deep Learning instantly map support/resistance zones, highlight hidden patterns, and overlay orderbook density right on the candles.",
    bullets: ["Auto-drawn Support & Resistance", "Pattern recognition (Head & Shoulders, Flags)", "Liquidity heatmaps"],
    demo: <CandlestickVisionDemo />,
    flip: false,
  },
];

const TAG_COLORS: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-400",
  purple:  "border-purple-500/30 bg-purple-500/[0.07] text-purple-400",
  cyan:    "border-cyan-500/30 bg-cyan-500/[0.07] text-cyan-400",
};

const BULLET_COLORS: Record<string, string> = {
  emerald: "text-emerald-400",
  purple:  "text-purple-400",
  cyan:    "text-cyan-400",
};

export function FeatureBentoGrid() {
  return (
    <section className="relative z-10 px-6 lg:px-16 max-w-[1300px] mx-auto mb-32 space-y-32">

      {/* Section Header */}
      <FadeIn className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-base)] bg-white/[0.03] text-[var(--text-muted)] text-xs font-semibold mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          Exclusive Features
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--text-main)] mb-4 tracking-tight leading-[1.1]">
          Tools that give you an{" "}
          <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            unfair advantage
          </span>
        </h2>
        <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg leading-relaxed">
          Features that institutional desks pay six figures for — now in your browser.
        </p>
      </FadeIn>

      {FEATURES.map((f, i) => (
        <div
          key={f.title}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${f.flip ? "lg:[direction:rtl]" : ""}`}
        >
          {/* Text Side */}
          <FadeIn delay={0.1} className={f.flip ? "lg:[direction:ltr]" : ""}>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-6 ${TAG_COLORS[f.tagColor]}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
              {f.tag}
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-[var(--text-main)] mb-5 tracking-tight leading-tight">{f.title}</h3>
            <p className="text-[var(--text-muted)] text-base leading-relaxed mb-8">{f.description}</p>
            <ul className="space-y-3">
              {f.bullets.map(b => (
                <li key={b} className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className={`shrink-0 text-lg ${BULLET_COLORS[f.tagColor]}`}>→</span>
                  {b}
                </li>
              ))}
            </ul>
          </FadeIn>

          {/* Demo Side */}
          <FadeIn delay={0.25} className={f.flip ? "lg:[direction:ltr]" : ""}>
            {f.demo}
          </FadeIn>
        </div>
      ))}

    </section>
  );
}
