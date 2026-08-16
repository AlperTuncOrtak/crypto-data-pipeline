import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

/* ─── Reusable animation wrappers ─── */
function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 40 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["2deg", "-2deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-2deg", "2deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative w-full h-full perspective-1000 group cursor-crosshair"
    >
      {/* Background Spotlight following the mouse inside the card */}
      <motion.div
        className="pointer-events-none absolute -inset-px z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[28px] mix-blend-screen"
        style={{
          background: useTransform(
            [x, y],
            ([xVal, yVal]) => `radial-gradient(circle at ${(xVal as number + 0.5) * 100}% ${(yVal as number + 0.5) * 100}%, rgba(255,255,255,0.06) 0%, transparent 60%)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

/* ─── Reusable animation wrappers ─── */
function PremiumPulse({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex h-2 w-2 items-center justify-center ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75 duration-1000"></span>
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
    </div>
  );
}

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
  { id: "a3", type: "TRANSFER", token: "USDC", amt: "$5.0M",  time: "15m ago",   cls: { row: "bg-white/5 border-[var(--border-base)]",           badge: "bg-white/10 text-slate-300",      val: "text-[var(--text-main)]" } },
  { id: "a4", type: "BUY",      token: "BTC",  amt: "$3.7M",  time: "Just now",  cls: { row: "bg-emerald-500/10 border-emerald-500/20", badge: "bg-emerald-500/20 text-emerald-300", val: "text-emerald-400" } },
  { id: "a5", type: "SELL",     token: "PEPE", amt: "$2.1M",  time: "4m ago",    cls: { row: "bg-rose-500/10 border-rose-500/20",    badge: "bg-rose-500/20 text-rose-300",    val: "text-rose-400" } },
  { id: "a6", type: "TRANSFER", token: "USDT", amt: "$9.4M",  time: "7m ago",    cls: { row: "bg-white/5 border-[var(--border-base)]",           badge: "bg-white/10 text-slate-300",      val: "text-[var(--text-main)]" } },
];

function WhaleDemo() {
  const [feed, setFeed] = useState(() => WHALE_DATA.slice(0, 4));
  const idxRef = useRef(4);
  useEffect(() => {
    const t = setInterval(() => {
      const next = idxRef.current % WHALE_DATA.length;
      idxRef.current = next + 1;
      setFeed(f => [WHALE_DATA[next], ...f].slice(0, 4));
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative rounded-[28px] bg-[var(--bg-base)] border border-[var(--border-base)] p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[var(--bg-base)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-inner flex flex-col h-[280px]">
        <div className="flex items-center gap-2 mb-3">
          <PremiumPulse />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Live Whale Feed · All DEXs</span>
        </div>
        <div className="relative flex-1 overflow-hidden" style={{ maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)" }}>
          <AnimatePresence initial={false}>
            {feed.map((row) => (
              <motion.div key={row.id}
                layout
                initial={{ opacity: 0, scale: 0.96, y: -20, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className={`flex items-center justify-between px-3 py-2.5 mb-2 rounded-3xl border ${row.cls.row}`}>
              <div className="flex items-center gap-2.5">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${row.cls.badge}`}>{row.type}</span>
                <span className="font-bold text-[var(--text-main)] text-sm">{row.token}</span>
              </div>
                <div className="flex items-center gap-2.5">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${row.cls.badge}`}>{row.type}</span>
                  <span className="font-bold text-[var(--text-main)] text-sm">{row.token}</span>
                </div>
                <div className="text-right">
                  <div className={`font-mono text-sm font-black ${row.cls.val}`}>{row.amt}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{row.time}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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

  useEffect(() => {
    let t1: any, t2: any, t3: any, t4: any, t5: any;
    const runCycle = () => {
      setDone(false); setAiIdx(-1); setRunning(true);
      t1 = setTimeout(() => {
        setRunning(false); setDone(true);
        t2 = setTimeout(() => setAiIdx(0), 400);
        t3 = setTimeout(() => setAiIdx(1), 1800);
        t4 = setTimeout(() => setAiIdx(2), 3200);
        t5 = setTimeout(runCycle, 6000);
      }, 2000);
    };
    runCycle();
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  return (
    <div className="relative rounded-[28px] bg-[var(--bg-base)] border border-[var(--border-base)] p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[var(--bg-base)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">SOL/USDT · 2022–2023</span>
          {done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-[var(--text-main)] font-black text-lg font-mono">+4,250%</motion.span>}
        </div>

        {/* Chart bars */}
        <div className="flex items-end gap-1 h-20 w-full overflow-hidden">
          {BT_BARS.map((h, i) => (
            <motion.div key={i}
              initial={{ height: 0, opacity: 0 }}
              animate={running || done ? { height: `${(h / 110) * 100}%`, opacity: 1 } : { height: 0, opacity: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
              className={`flex-1 rounded-t-sm relative ${i < 6 ? "bg-white/20" : "bg-white/60"}`}>
              {i === 5 && done && <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] text-[var(--text-main)] whitespace-nowrap font-bold">BOTTOM</motion.div>}
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
            <span>{done ? "100%" : running ? "Simulating..." : "Ready"}</span>
            <span>RSI + EMA Cross</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: done ? "100%" : running ? "95%" : "0%" }}
              transition={{ duration: running && !done ? 2 : 0.3, ease: running ? "linear" : "easeOut" }}
              className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>
        </div>

        {/* AI message */}
        <AnimatePresence mode="wait">
          {aiIdx >= 0 && (
            <motion.div key={aiIdx}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 p-3 rounded-3xl bg-white/5 border border-[var(--border-base)]">
              <span className="text-[var(--text-main)] text-[10px] font-black shrink-0 mt-0.5">AI</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{AI_MSGS[aiIdx]}</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

/* ─── 3. AI Candlestick Vision ─── */
const CANDLE_BARS = [40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95, 80, 72, 88];

function CandleDemo() {
  const [aiOn, setAiOn] = useState(false);
  return (
    <div className="relative rounded-[28px] bg-[var(--bg-base)] border border-[var(--border-base)] p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[var(--bg-base)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">BTC/USDT · 1H</span>
          <button onClick={() => setAiOn(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-bold border transition-all duration-300 ${aiOn ? "bg-white border-white text-black shadow-[0_0_12px_rgba(255,255,255,0.3)]" : "bg-white/[0.04] border-[var(--border-base)] text-[var(--text-muted)] hover:border-white/20"}`}>
            {aiOn ? <PremiumPulse className="!w-1.5 !h-1.5 [&>span]:bg-black" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
            AI Vision {aiOn ? "ON" : "OFF"}
          </button>
        </div>

        {/* Chart */}
        <div className="relative flex items-end gap-[3px] h-24 w-full">
          {/* Laser Scanner */}
          <AnimatePresence>
            {aiOn && (
              <motion.div
                initial={{ top: 0, opacity: 0 }}
                animate={{ top: ["0%", "100%", "0%"], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                className="absolute left-0 right-0 h-0.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Support line */}
          <AnimatePresence>
            {aiOn && (
              <motion.div key="support"
                initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute left-0 right-0 border-t border-dashed border-white/60 origin-left pointer-events-none"
                style={{ bottom: "28%" }}>
                <span className="absolute right-0 -top-4 text-[8px] text-[var(--text-main)] font-bold bg-white/10 px-1.5 py-0.5 rounded">Support</span>
              </motion.div>
            )}
            {aiOn && (
              <motion.div key="resistance"
                initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute left-0 right-0 border-t border-dashed border-white/60 origin-left pointer-events-none"
                style={{ bottom: "74%" }}>
                <span className="absolute right-0 -top-4 text-[8px] text-[var(--text-main)] font-bold bg-white/10 px-1.5 py-0.5 rounded">Resistance</span>
              </motion.div>
            )}
          </AnimatePresence>

          {CANDLE_BARS.map((h, i) => (
            <div key={i} className="flex-1 relative flex items-end" style={{ height: "100%" }}>
              <div className={`w-full rounded-sm ${h > 80 ? "bg-white/80" : h > 60 ? "bg-white/40" : "bg-white/20"}`}
                style={{ height: `${(h / 95) * 100}%` }} />
              {aiOn && h > 83 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="absolute inset-0 rounded-sm border border-[var(--border-subtle)]0 bg-white/20 pointer-events-none" />
              )}
            </div>
          ))}
        </div>

        {/* AI tags */}
        <AnimatePresence>
          {aiOn && (
            <motion.div key="tags" initial={{ opacity: 0, y: 16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
              className="grid grid-cols-3 gap-2">
              {[
                { l: "Head & Shoulders", c: "bg-white/10 text-[var(--text-main)] border-white/20" },
                { l: "Liquidity Cluster", c: "bg-white/10 text-[var(--text-main)] border-white/20" },
                { l: "Hidden Bull Div",  c: "bg-white/10 text-[var(--text-main)] border-white/20" },
              ].map(t => (
                <div key={t.l} className={`text-center text-[8px] font-bold py-1.5 rounded-2xl uppercase tracking-wide border ${t.c}`}>{t.l}</div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!aiOn && (
          <p className="text-[11px] text-[var(--text-muted)] text-center pt-1">Toggle AI Vision to reveal hidden patterns</p>
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-[var(--text-main)] text-xs font-semibold mb-6 uppercase tracking-widest">
          <PremiumPulse />
          Exclusive Features
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--text-main)] mb-4 tracking-tight leading-[1.1]">
          Tools that give you an{" "}
          <span className="text-[var(--text-main)]">
            unfair advantage
          </span>
        </h2>
        <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg leading-relaxed">
          Features that institutional desks pay six figures for — now in your browser.
        </p>
      </FadeUp>

      {FEATURES.map((f) => {
        const { Demo } = f;
        return (
          <div key={f.title} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <FadeUp delay={0.1} className={f.flip ? "lg:order-2" : ""}>
              <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border mb-6 border-white/20 bg-white/5 text-[var(--text-main)]`}>
                <PremiumPulse />
                {f.tag}
              </span>
              <h3 className="text-3xl md:text-4xl font-black mb-5 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">{f.title}</h3>
              <p className="text-[var(--text-muted)] text-base leading-relaxed mb-8">{f.desc}</p>
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
              <TiltCard>
                <Demo />
              </TiltCard>
            </SlideIn>
          </div>
        );
      })}
    </section>
  );
}
