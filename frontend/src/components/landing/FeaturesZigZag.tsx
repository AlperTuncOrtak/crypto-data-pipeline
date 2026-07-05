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
  { id: "a3", type: "TRANSFER", token: "USDC", amt: "$5.0M",  time: "15m ago",   cls: { row: "bg-cyan-500/10 border-cyan-500/20",    badge: "bg-cyan-500/20 text-cyan-300",    val: "text-cyan-400" } },
  { id: "a4", type: "BUY",      token: "BTC",  amt: "$3.7M",  time: "Just now",  cls: { row: "bg-emerald-500/10 border-emerald-500/20", badge: "bg-emerald-500/20 text-emerald-300", val: "text-emerald-400" } },
  { id: "a5", type: "SELL",     token: "PEPE", amt: "$2.1M",  time: "4m ago",    cls: { row: "bg-rose-500/10 border-rose-500/20",    badge: "bg-rose-500/20 text-rose-300",    val: "text-rose-400" } },
  { id: "a6", type: "TRANSFER", token: "USDT", amt: "$9.4M",  time: "7m ago",    cls: { row: "bg-cyan-500/10 border-cyan-500/20",    badge: "bg-cyan-500/20 text-cyan-300",    val: "text-cyan-400" } },
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
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-5 shadow-inner space-y-3 min-h-[240px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Whale Feed · All DEXs</span>
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
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">SOL/USDT · 2022–2023</span>
          {done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-emerald-400 font-black text-lg font-mono">+4,250%</motion.span>}
        </div>

        {/* Chart bars */}
        <div className="flex items-end gap-1 h-20 w-full">
          {BT_BARS.map((h, i) => (
            <motion.div key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(h / 110) * 100}%` }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
              className={`flex-1 rounded-t-sm relative ${i < 6 ? "bg-rose-500/40" : "bg-emerald-400/50"}`}>
              {i === 5 && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] text-amber-400 whitespace-nowrap font-bold">BOTTOM</div>}
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>{Math.min(100, Math.round(progress))}%</span>
            <span>RSI + EMA Cross</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" />
          </div>
        </div>

        {/* AI message */}
        <AnimatePresence mode="wait">
          {aiIdx >= 0 && (
            <motion.div key={aiIdx}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <span className="text-cyan-400 text-[10px] font-black shrink-0 mt-0.5">AI</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{AI_MSGS[aiIdx]}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={run}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${running ? "bg-white/5 text-slate-500 cursor-not-allowed" : done ? "bg-white/[0.04] border border-white/10 text-slate-400 hover:bg-white/10" : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-90 shadow-[0_0_20px_rgba(168,85,247,0.25)]"}`}>
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
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">BTC/USDT · 1H</span>
          <button onClick={() => setAiOn(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-300 ${aiOn ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]" : "bg-white/[0.04] border-white/10 text-slate-400 hover:border-white/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${aiOn ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
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
                className="absolute left-0 right-0 border-t border-dashed border-emerald-400/70 origin-left pointer-events-none"
                style={{ bottom: "28%" }}>
                <span className="absolute right-0 -top-4 text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Support</span>
              </motion.div>
            )}
            {aiOn && (
              <motion.div key="resistance"
                initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute left-0 right-0 border-t border-dashed border-rose-400/70 origin-left pointer-events-none"
                style={{ bottom: "74%" }}>
                <span className="absolute right-0 -top-4 text-[8px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">Resistance</span>
              </motion.div>
            )}
          </AnimatePresence>

          {CANDLE_BARS.map((h, i) => (
            <div key={i} className="flex-1 relative flex items-end" style={{ height: "100%" }}>
              <div className={`w-full rounded-sm ${h > 80 ? "bg-emerald-400/60" : h > 60 ? "bg-cyan-400/40" : "bg-rose-400/50"}`}
                style={{ height: `${(h / 95) * 100}%` }} />
              {aiOn && h > 83 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="absolute inset-0 rounded-sm border border-yellow-400/50 bg-yellow-400/10 pointer-events-none" />
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
                { l: "Head & Shoulders", c: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
                { l: "Liquidity Cluster", c: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
                { l: "Hidden Bull Div",  c: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
              ].map(t => (
                <div key={t.l} className={`text-center text-[8px] font-bold py-1.5 rounded-lg uppercase tracking-wide border ${t.c}`}>{t.l}</div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!aiOn && (
          <p className="text-[11px] text-slate-600 text-center pt-1">Toggle AI Vision to reveal hidden patterns</p>
        )}
      </div>
    </div>
  );
}

/* ─── 4. AI Market Analysis ─── */
function AIMarketDemo() {
  const [fg, setFg] = useState(74);
  useEffect(() => {
    const t = setInterval(() => setFg(p => Math.max(15, Math.min(92, p + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3 + 1)))), 1800);
    return () => clearInterval(t);
  }, []);
  const label = fg > 75 ? "Extreme Greed" : fg > 55 ? "Greed" : fg > 45 ? "Neutral" : "Fear";
  const gColor = fg > 55 ? "#10b981" : fg > 45 ? "#f59e0b" : "#f43f5e";
  const circumference = 251.2;
  const offset = circumference - (circumference * fg / 100);

  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-6 shadow-inner flex flex-col items-center gap-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Market Sentiment</span>

        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={gColor} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease, stroke 0.8s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white tabular-nums">{fg}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest transition-colors" style={{ color: gColor }}>{label}</span>
          </div>
        </div>

        <div className="w-full space-y-2.5">
          {[
            { label: "Bullish signals",  val: Math.min(100, fg + 10), color: "#10b981" },
            { label: "Momentum score",   val: fg,                     color: "#22d3ee" },
            { label: "Bearish pressure", val: Math.max(0, 100-fg-10), color: "#f43f5e" },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 w-28 shrink-0">{b.label}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${b.val}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full" style={{ background: b.color }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-7 text-right tabular-nums">{b.val}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 5. Real-Time Data ─── */
const INITIAL_TICKERS = [
  { id: "btc", pair: "BTC/USDT",  basePrice: 63420.5,    color: "emerald" },
  { id: "eth", pair: "ETH/USDT",  basePrice: 3451.2,     color: "emerald" },
  { id: "sol", pair: "SOL/USDT",  basePrice: 142.88,     color: "emerald" },
  { id: "pepe",pair: "PEPE/USDT", basePrice: 0.00001221, color: "emerald" },
];

function RealTimeDemo() {
  const [tickers, setTickers] = useState(() =>
    INITIAL_TICKERS.map(t => ({ ...t, price: t.basePrice, change: 0 }))
  );
  useEffect(() => {
    const t = setInterval(() => {
      setTickers(prev => prev.map(tk => {
        const delta = (Math.random() - 0.48) * 0.004;
        const newPrice = tk.price * (1 + delta);
        const change = ((newPrice - tk.basePrice) / tk.basePrice) * 100;
        return { ...tk, price: newPrice, change, color: change >= 0 ? "emerald" : "rose" };
      }));
    }, 900);
    return () => clearInterval(t);
  }, []);

  const fmt = (p: number) => p > 1 ? p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toFixed(8);

  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-5 shadow-inner space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">WebSocket Feed · Live</span>
        </div>
        {tickers.map(tk => (
          <div key={tk.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="font-bold text-white text-sm">{tk.pair}</span>
            <div className="text-right">
              <motion.div layout className="font-mono text-sm font-bold text-white tabular-nums">{fmt(tk.price)}</motion.div>
              <div className={`text-[11px] font-bold tabular-nums ${tk.color === "emerald" ? "text-emerald-400" : "text-rose-400"}`}>
                {tk.change >= 0 ? "+" : ""}{tk.change.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 6. Portfolio Sync ─── */
const PORTFOLIO_ASSETS = [
  { symbol: "BTC", pct: 45, color: "#f59e0b", tw: "bg-amber-400" },
  { symbol: "ETH", pct: 30, color: "#818cf8", tw: "bg-indigo-400" },
  { symbol: "SOL", pct: 15, color: "#34d399", tw: "bg-emerald-400" },
  { symbol: "Other", pct: 10, color: "#94a3b8", tw: "bg-slate-400" },
];

function PortfolioDemo() {
  const [bal, setBal] = useState(124592.0);
  useEffect(() => {
    const t = setInterval(() => setBal(p => p + (Math.random() - 0.48) * 60), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-6 shadow-inner space-y-5">
        <div className="text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Portfolio</div>
          {/* No `key` here — just animate the text naturally */}
          <div className="text-2xl font-black font-mono text-white tabular-nums">
            ${bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400 font-bold mt-1">+12.4% this week</div>
        </div>

        {/* Color bar */}
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {PORTFOLIO_ASSETS.map(a => (
            <div key={a.symbol} className="rounded-full" style={{ width: `${a.pct}%`, background: a.color }} />
          ))}
        </div>

        {/* Asset rows */}
        <div className="space-y-2.5">
          {PORTFOLIO_ASSETS.map(a => (
            <div key={a.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                <span className="text-xs font-bold text-slate-300">{a.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500">{a.pct}%</span>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  ${(bal * a.pct / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 7. Algorithmic Edge ─── */
const CODE_LINES = [
  { text: "import { MarketMaker } from '@crypto/algo';", cls: "text-slate-400" },
  { text: "", cls: "" },
  { text: "const strategy = new MarketMaker({",         cls: "text-slate-300" },
  { text: "  pair: 'BTC/USDT',",                        cls: "text-emerald-400" },
  { text: "  riskFactor: 0.05,",                         cls: "text-amber-400" },
  { text: "  leverage: 10,",                             cls: "text-amber-400" },
  { text: "  aiSignals: true,",                          cls: "text-cyan-400" },
  { text: "});",                                         cls: "text-slate-300" },
  { text: "",                                            cls: "" },
  { text: "strategy.execute(); // ✅ Running...",        cls: "text-emerald-400" },
];

function AlgoDemo() {
  const [visible, setVisible] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVisible(i);
      if (i >= CODE_LINES.length) clearInterval(t);
    }, 220);
    return () => clearInterval(t);
  }, [isInView]);

  return (
    <div ref={ref} className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-5 shadow-inner">
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[10px] text-slate-600 font-mono">algo-strategy.ts</span>
        </div>
        <div className="font-mono text-xs space-y-0.5 min-h-[160px]">
          {CODE_LINES.map((line, i) => (
            <motion.div key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: i < visible ? 1 : 0 }}
              transition={{ duration: 0.15 }}
              className={`leading-relaxed ${line.cls}`}>
              {line.text || <span>&nbsp;</span>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── FEATURES CONFIG ─── */
type Feature = {
  tag: string; tagColor: string;
  title: string; desc: string; bullets: string[];
  Demo: React.ComponentType;
  flip: boolean;
};

const FEATURES: Feature[] = [
  { tag: "On-Chain Intelligence", tagColor: "cyan",    title: "Whale X-Ray",            desc: "See exactly where the smart money is flowing. Our on-chain analysis engine tracks massive wallet movements across multiple DEXs in real-time. Don't be the exit liquidity; trade alongside the whales.",                                                                                                bullets: ["Live large transfer alerts", "DEX activity monitoring", "Wallet tagging and profiling"],             Demo: WhaleDemo,      flip: false },
  { tag: "Strategy Lab",          tagColor: "purple",  title: "Time-Machine Backtesting",desc: "What if you had bought Solana at the bottom of the bear market? Stop wondering. Simulate past market conditions, backtest your strategies, and receive an AI-generated analysis of your hypothetical portfolio performance.",                                                                          bullets: ["Historical price replay", "P&L Simulation", "AI-driven critique of your entries"],                  Demo: BacktestDemo,   flip: true  },
  { tag: "AI Vision",             tagColor: "emerald", title: "AI Candlestick Vision",   desc: "Tired of drawing lines manually? Toggle AI Vision on your charts and let Deep Learning instantly map support/resistance zones, highlight hidden patterns, and overlay orderbook density right on the candles.",                                                                                          bullets: ["Auto-drawn Support & Resistance", "Pattern recognition (Head & Shoulders, Flags)", "Liquidity heatmaps"], Demo: CandleDemo,  flip: false },
  { tag: "AI Powered",            tagColor: "cyan",    title: "AI Market Analysis",      desc: "Our proprietary AI analyzes sentiment across millions of data points, giving you an edge with real-time Fear & Greed indices, social signals, and predictive modeling before the crowd catches on.",                                                                                                    bullets: ["Fear & Greed Index (live)", "Social sentiment scanning", "Predictive pattern modeling"],            Demo: AIMarketDemo,   flip: true  },
  { tag: "Live Data",             tagColor: "blue",    title: "Real-Time Data",          desc: "Millisecond-precision WebSocket feeds straight to your dashboard. No 15-minute delays, no refresh buttons — every tick, every trade, every move, delivered the instant it happens on-chain.",                                                                                                          bullets: ["Sub-second WebSocket feeds", "Multi-exchange aggregation", "Order book depth streaming"],          Demo: RealTimeDemo,   flip: false },
  { tag: "Portfolio",             tagColor: "emerald", title: "Portfolio Sync",          desc: "Automatically import trades via CSV or connect on-chain wallets for unified tracking across every chain. See your full net worth, allocation breakdown, and weekly P&L in one beautiful dashboard.",                                                                                                    bullets: ["Multi-chain wallet tracking", "CSV & exchange API import", "Real-time P&L breakdown"],             Demo: PortfolioDemo,  flip: true  },
  { tag: "Quantitative",          tagColor: "purple",  title: "Algorithmic Edge",        desc: "Utilize advanced quantitative metrics typically reserved for institutional trading desks — now simplified into an elegant UI. Build, test, and deploy automated strategies without writing a single line of code.",                                                                                     bullets: ["Visual strategy builder", "Backtested signal triggers", "One-click automation deploy"],            Demo: AlgoDemo,       flip: false },
];

const TAG_CLS: Record<string, string> = {
  cyan:    "border-cyan-500/30 bg-cyan-500/[0.07] text-cyan-400",
  purple:  "border-purple-500/30 bg-purple-500/[0.07] text-purple-400",
  emerald: "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-400",
  blue:    "border-blue-500/30 bg-blue-500/[0.07] text-blue-400",
};
const DOT_CLS: Record<string, string> = {
  cyan: "bg-cyan-400", purple: "bg-purple-400", emerald: "bg-emerald-400", blue: "bg-blue-400",
};

export function FeaturesZigZag() {
  return (
    <section className="relative z-10 px-6 lg:px-16 max-w-[1300px] mx-auto mb-32 space-y-32">

      {/* Section Header */}
      <FadeUp className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-slate-400 text-xs font-semibold mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          Exclusive Features
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight leading-[1.1]">
          Tools that give you an{" "}
          <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
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
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-6 ${TAG_CLS[f.tagColor]}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {f.tag}
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-5 tracking-tight leading-tight">{f.title}</h3>
              <p className="text-slate-400 text-base leading-relaxed mb-8">{f.desc}</p>
              <ul className="space-y-3">
                {f.bullets.map(b => (
                  <li key={b} className="flex items-center gap-3 text-slate-300 text-sm">
                    <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${DOT_CLS[f.tagColor]}`} />
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
