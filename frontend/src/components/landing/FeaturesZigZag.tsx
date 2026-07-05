import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

function SlideIn({ children, direction = "right", delay = 0, className = "" }: {
  children: React.ReactNode; direction?: "left" | "right"; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction === "right" ? 60 : -60, filter: "blur(8px)" }}
      animate={isInView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── FEATURE MOCKUPS ─── */

// 1. Whale X-Ray
const WHALE_EVENTS = [
  { type: "BUY",      token: "ETH",  amt: "$1.2M", time: "Just now",  color: "emerald" },
  { type: "SELL",     token: "WIF",  amt: "$800K",  time: "2m ago",    color: "rose" },
  { type: "TRANSFER", token: "USDC", amt: "$5.0M",  time: "15m ago",   color: "cyan" },
  { type: "BUY",      token: "BTC",  amt: "$3.7M",  time: "Just now",  color: "emerald" },
  { type: "SELL",     token: "PEPE", amt: "$2.1M",  time: "4m ago",    color: "rose" },
];

function WhaleDemo() {
  const [feed, setFeed] = useState(WHALE_EVENTS.slice(0, 3));
  const [idx, setIdx] = useState(3);
  useEffect(() => {
    const t = setInterval(() => {
      setIdx(prev => {
        const next = prev % WHALE_EVENTS.length;
        setFeed(f => [WHALE_EVENTS[next], ...f].slice(0, 3));
        return next + 1;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);
  const cMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  };
  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/15 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/25 transition-colors" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-5 shadow-inner space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Whale Feed · All DEXs</span>
        </div>
        <AnimatePresence initial={false}>
          {feed.map((row, i) => (
            <motion.div
              key={row.token + row.time + i}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.35 }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${cMap[row.color]}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest bg-current/10`}>{row.type}</span>
                <span className="font-bold text-white">{row.token}</span>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-white">{row.amt}</div>
                <div className="text-[10px] text-slate-500">{row.time}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 2. Time-Machine Backtesting
function BacktestDemo() {
  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/15 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/25 transition-colors" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-6 shadow-inner flex flex-col items-center justify-center min-h-[220px]">
        <svg viewBox="0 0 200 100" className="w-full drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          <defs>
            <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M0,90 Q25,75 40,80 T80,55 T110,60 T140,30 T180,15 T200,5" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
          <path d="M0,100 L0,90 Q25,75 40,80 T80,55 T110,60 T140,30 T180,15 T200,5 L200,100 Z" fill="url(#gp)" opacity="0.25" />
          {/* Bear zone */}
          <rect x="0" y="0" width="68" height="100" fill="rgba(244,63,94,0.04)" />
          <text x="8" y="95" fill="#f43f5e" fontSize="7" fontWeight="bold" opacity="0.6">BEAR</text>
          <text x="72" y="95" fill="#10b981" fontSize="7" fontWeight="bold" opacity="0.6">BULL RUN →</text>
        </svg>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="mt-4 bg-[#020817]/90 border border-purple-500/30 px-5 py-3 rounded-xl text-center shadow-[0_0_20px_rgba(168,85,247,0.2)]"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Simulated P&L</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">+4,250%</div>
        </motion.div>
      </div>
    </div>
  );
}

// 3. AI Candlestick Vision
function CandleDemo() {
  const [aiOn, setAiOn] = useState(false);
  const bars = [40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95, 80, 72, 88];
  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/15 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/25 transition-colors" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-5 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">BTC/USDT · 1H</span>
          <button
            onClick={() => setAiOn(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${aiOn ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-white/[0.04] border-white/10 text-slate-400"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${aiOn ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            AI Vision {aiOn ? "ON" : "OFF"}
          </button>
        </div>
        <div className="relative flex items-end gap-[3px] h-24 w-full">
          <AnimatePresence>
            {aiOn && (
              <>
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }} transition={{ duration: 0.5 }} className="absolute left-0 right-0 border-t border-dashed border-emerald-400/60 origin-left" style={{ bottom: "28%" }}>
                  <span className="absolute right-0 -top-4 text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">Support</span>
                </motion.div>
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="absolute left-0 right-0 border-t border-dashed border-rose-400/60 origin-left" style={{ bottom: "75%" }}>
                  <span className="absolute right-0 -top-4 text-[8px] text-rose-400 font-bold bg-rose-500/10 px-1 rounded">Resistance</span>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          {bars.map((h, i) => (
            <div key={i} className="flex-1 relative flex items-end" style={{ height: "100%" }}>
              <div className={`w-full rounded-sm transition-all duration-500 ${h > 80 ? "bg-emerald-400/60" : h > 60 ? "bg-cyan-400/40" : "bg-rose-400/50"}`} style={{ height: `${(h / 95) * 100}%` }} />
              {aiOn && h > 83 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-sm border border-yellow-400/50 bg-yellow-400/10" />}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {aiOn && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-3 gap-2 mt-4">
              {[
                { l: "Head & Shoulders", c: "purple" },
                { l: "Liquidity Cluster", c: "amber" },
                { l: "Hidden Bull Div", c: "cyan" },
              ].map(t => (
                <div key={t.l} className={`text-center text-[8px] font-bold py-1.5 rounded-lg uppercase tracking-wide border ${t.c === "purple" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : t.c === "amber" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"}`}>{t.l}</div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 4. AI Market Analysis
function AIMarketDemo() {
  const [fearGreed, setFearGreed] = useState(74);
  useEffect(() => {
    const t = setInterval(() => setFearGreed(p => Math.max(10, Math.min(95, p + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3)))), 1800);
    return () => clearInterval(t);
  }, []);
  const label = fearGreed > 75 ? "Extreme Greed" : fearGreed > 55 ? "Greed" : fearGreed > 45 ? "Neutral" : "Fear";
  const gColor = fearGreed > 55 ? "#10b981" : fearGreed > 45 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/15 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/25 transition-colors" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-6 shadow-inner flex flex-col items-center gap-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Market Sentiment</span>
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={gColor} strokeWidth="8"
              strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * fearGreed / 100)}
              strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{fearGreed}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: gColor }}>{label}</span>
          </div>
        </div>
        <div className="w-full space-y-2">
          {[
            { label: "Bullish signals", val: Math.min(100, fearGreed + 10), color: "#10b981" },
            { label: "Momentum score", val: fearGreed, color: "#22d3ee" },
            { label: "Bearish pressure", val: Math.max(0, 100 - fearGreed - 10), color: "#f43f5e" },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 w-28">{b.label}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${b.val}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{b.val}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 5. Real-Time Data
function RealTimeDemo() {
  const [tickers, setTickers] = useState([
    { pair: "BTC/USDT", price: "63,420.5", change: "+2.4%", color: "emerald" },
    { pair: "ETH/USDT", price: "3,451.2",  change: "-1.2%", color: "rose" },
    { pair: "SOL/USDT", price: "142.88",   change: "+5.8%", color: "emerald" },
    { pair: "PEPE/USDT",price: "0.00001221",change:"+12.3%",color: "emerald" },
  ]);
  useEffect(() => {
    const t = setInterval(() => {
      setTickers(prev => prev.map(tk => {
        const delta = (Math.random() - 0.48) * 0.5;
        const price = parseFloat(tk.price.replace(/,/g, "")) * (1 + delta / 100);
        const changeVal = parseFloat(tk.change) + delta;
        return { ...tk, price: price > 1 ? price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : price.toFixed(8), change: (changeVal > 0 ? "+" : "") + changeVal.toFixed(1) + "%", color: changeVal >= 0 ? "emerald" : "rose" };
      }));
    }, 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/15 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/25 transition-colors" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-5 shadow-inner space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Websocket Feed · Live</span>
        </div>
        {tickers.map(tk => (
          <div key={tk.pair} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="font-bold text-white text-sm">{tk.pair}</span>
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-white">{tk.price}</div>
              <div className={`text-[11px] font-bold ${tk.color === "emerald" ? "text-emerald-400" : "text-rose-400"}`}>{tk.change}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. Portfolio Sync
function PortfolioDemo() {
  const [bal, setBal] = useState(124592.00);
  useEffect(() => {
    const t = setInterval(() => setBal(p => p + (Math.random() - 0.48) * 80), 1500);
    return () => clearInterval(t);
  }, []);
  const assets = [
    { name: "Bitcoin", symbol: "BTC", pct: 45, val: bal * 0.45, color: "#f59e0b" },
    { name: "Ethereum", symbol: "ETH", pct: 30, val: bal * 0.30, color: "#818cf8" },
    { name: "Solana", symbol: "SOL", pct: 15, val: bal * 0.15, color: "#34d399" },
    { name: "Other", symbol: "...", pct: 10, val: bal * 0.10, color: "#94a3b8" },
  ];
  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/15 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/25 transition-colors" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-6 shadow-inner space-y-4">
        <div className="text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Portfolio</div>
          <motion.div animate={{ opacity: 1 }} key={Math.round(bal)} className="text-2xl font-black font-mono text-white">
            ${bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.div>
          <div className="text-xs text-emerald-400 font-bold mt-0.5">+12.4% this week</div>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {assets.map(a => <div key={a.symbol} className="rounded-full transition-all duration-700" style={{ width: `${a.pct}%`, background: a.color }} />)}
        </div>
        <div className="space-y-2">
          {assets.map(a => (
            <div key={a.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                <span className="text-xs font-bold text-slate-300">{a.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500">{a.pct}%</span>
                <span className="text-xs font-mono text-slate-400">${a.val.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 7. Algorithmic Edge
function AlgoDemo() {
  const [lines, setLines] = useState<string[]>([]);
  const CODE = [
    { text: `import { MarketMaker } from '@crypto/algo';`, color: "text-slate-400" },
    { text: ``, color: "" },
    { text: `const strategy = new MarketMaker({`, color: "text-slate-300" },
    { text: `  pair: 'BTC/USDT',`, color: "text-emerald-400" },
    { text: `  riskFactor: 0.05,`, color: "text-amber-400" },
    { text: `  leverage: 10,`, color: "text-amber-400" },
    { text: `  aiSignals: true,`, color: "text-cyan-400" },
    { text: `});`, color: "text-slate-300" },
    { text: ``, color: "" },
    { text: `strategy.execute(); // ✅ Running...`, color: "text-emerald-400" },
  ];
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < CODE.length) { setLines(prev => [...prev, `${i}`]); i++; }
      else clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative rounded-[28px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/15 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/25 transition-colors" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-5 shadow-inner font-mono text-xs">
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[10px] text-slate-600">algo-strategy.ts</span>
        </div>
        {CODE.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: lines.includes(`${i}`) ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className={`leading-relaxed ${line.color}`}
          >
            {line.text || <br />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── ALL FEATURES DATA ─── */
const FEATURES = [
  {
    tag: "On-Chain Intelligence", tagColor: "cyan",
    title: "Whale X-Ray",
    desc: "See exactly where the smart money is flowing. Our on-chain analysis engine tracks massive wallet movements across multiple DEXs in real-time. Don't be the exit liquidity; trade alongside the whales.",
    bullets: ["Live large transfer alerts", "DEX activity monitoring", "Wallet tagging and profiling"],
    demo: <WhaleDemo />, flip: false,
  },
  {
    tag: "Strategy Lab", tagColor: "purple",
    title: "Time-Machine Backtesting",
    desc: "What if you had bought Solana at the bottom of the bear market? Stop wondering. Simulate past market conditions, backtest your strategies, and receive an AI-generated analysis of your hypothetical portfolio performance.",
    bullets: ["Historical price replay", "P&L Simulation", "AI-driven critique of your entries"],
    demo: <BacktestDemo />, flip: true,
  },
  {
    tag: "AI Vision", tagColor: "emerald",
    title: "AI Candlestick Vision",
    desc: "Tired of drawing lines manually? Toggle AI Vision on your charts and let Deep Learning instantly map support/resistance zones, highlight hidden patterns, and overlay orderbook density right on the candles.",
    bullets: ["Auto-drawn Support & Resistance", "Pattern recognition (Head & Shoulders, Flags)", "Liquidity heatmaps"],
    demo: <CandleDemo />, flip: false,
  },
  {
    tag: "AI Powered", tagColor: "cyan",
    title: "AI Market Analysis",
    desc: "Our proprietary AI analyzes sentiment across millions of data points, giving you an edge with real-time Fear & Greed indices, social signals, and predictive modeling before the crowd catches on.",
    bullets: ["Fear & Greed Index (live)", "Social sentiment scanning", "Predictive pattern modeling"],
    demo: <AIMarketDemo />, flip: true,
  },
  {
    tag: "Live Data", tagColor: "blue",
    title: "Real-Time Data",
    desc: "Millisecond-precision WebSocket feeds straight to your dashboard. No 15-minute delays, no refresh buttons — every tick, every trade, every move, delivered the instant it happens on-chain.",
    bullets: ["Sub-second WebSocket feeds", "Multi-exchange aggregation", "Order book depth streaming"],
    demo: <RealTimeDemo />, flip: false,
  },
  {
    tag: "Portfolio", tagColor: "emerald",
    title: "Portfolio Sync",
    desc: "Automatically import trades via CSV or connect on-chain wallets for unified tracking across every chain. See your full net worth, allocation breakdown, and weekly P&L in one beautiful dashboard.",
    bullets: ["Multi-chain wallet tracking", "CSV & exchange API import", "Real-time P&L breakdown"],
    demo: <PortfolioDemo />, flip: true,
  },
  {
    tag: "Quantitative", tagColor: "purple",
    title: "Algorithmic Edge",
    desc: "Utilize advanced quantitative metrics typically reserved for institutional trading desks — now simplified into an elegant UI. Build, test, and deploy automated strategies without writing a single line of code.",
    bullets: ["Visual strategy builder", "Backtested signal triggers", "One-click automation deploy"],
    demo: <AlgoDemo />, flip: false,
  },
];

const TAG_COLORS: Record<string, string> = {
  cyan:    "border-cyan-500/30 bg-cyan-500/[0.07] text-cyan-400",
  purple:  "border-purple-500/30 bg-purple-500/[0.07] text-purple-400",
  emerald: "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-400",
  blue:    "border-blue-500/30 bg-blue-500/[0.07] text-blue-400",
};

const BULLET_DOT: Record<string, string> = {
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

      {FEATURES.map((f, i) => (
        <div key={f.title} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center`}>
          {/* Text */}
          <FadeUp delay={0.1} className={f.flip ? "lg:order-2" : ""}>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-6 ${TAG_COLORS[f.tagColor]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {f.tag}
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-white mb-5 tracking-tight leading-tight">{f.title}</h3>
            <p className="text-slate-400 text-base leading-relaxed mb-8">{f.desc}</p>
            <ul className="space-y-3">
              {f.bullets.map(b => (
                <li key={b} className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${BULLET_DOT[f.tagColor]}`} />
                  {b}
                </li>
              ))}
            </ul>
          </FadeUp>

          {/* Demo */}
          <SlideIn direction={f.flip ? "left" : "right"} delay={0.2} className={f.flip ? "lg:order-1" : ""}>
            {f.demo}
          </SlideIn>
        </div>
      ))}
    </section>
  );
}
