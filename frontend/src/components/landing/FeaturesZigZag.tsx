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

/* ─── 1. Whale Copy-Trading & Alerts ─── */
const WHALE_DATA = [
  { id: "a1", type: "BUY",      token: "ETH",  amt: "$1.2M", time: "Just now",  cls: { row: "bg-emerald-500/10 border-emerald-500/20", badge: "bg-emerald-500/20 text-emerald-300", val: "text-emerald-400" } },
  { id: "a2", type: "SELL",     token: "WIF",  amt: "$800K",  time: "2m ago",    cls: { row: "bg-rose-500/10 border-rose-500/20",    badge: "bg-rose-500/20 text-rose-300",    val: "text-rose-400" } },
  { id: "a3", type: "BUY",      token: "PEPE", amt: "$3.7M",  time: "15m ago",   cls: { row: "bg-emerald-500/10 border-emerald-500/20", badge: "bg-emerald-500/20 text-emerald-300", val: "text-emerald-400" } },
  { id: "a4", type: "BUY",      token: "BTC",  amt: "$5.1M",  time: "Just now",  cls: { row: "bg-emerald-500/10 border-emerald-500/20", badge: "bg-emerald-500/20 text-emerald-300", val: "text-emerald-400" } },
  { id: "a5", type: "SELL",     token: "SOL",  amt: "$2.1M",  time: "4m ago",    cls: { row: "bg-rose-500/10 border-rose-500/20",    badge: "bg-rose-500/20 text-rose-300",    val: "text-rose-400" } },
];

function CopyTradeDemo() {
  const [feed, setFeed] = useState(() => WHALE_DATA.slice(0, 2));
  const idxRef = useRef(2);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const next = idxRef.current % WHALE_DATA.length;
      idxRef.current = next + 1;
      setFeed(f => [WHALE_DATA[next], ...f].slice(0, 2));
      setCopied(false);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative rounded-[28px] bg-[#020817] border border-white/10 p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/5 p-5 shadow-inner space-y-4 min-h-[240px]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Telegram Bot Active</span>
          </div>
          <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded font-bold">@WhaleAlerts</span>
        </div>
        
        <AnimatePresence initial={false} mode="popLayout">
          {feed.map((row, i) => (
            <motion.div key={row.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`flex flex-col gap-3 px-4 py-3.5 rounded-xl border ${row.cls.row}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${row.cls.badge}`}>{row.type}</span>
                  <span className="font-bold text-white text-sm">{row.token}</span>
                </div>
                <div className={`font-mono text-sm font-black ${row.cls.val}`}>{row.amt}</div>
              </div>
              
              {i === 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-1">
                  <button 
                    onClick={() => setCopied(true)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${copied ? "bg-white/10 text-white cursor-default" : "bg-white text-black hover:bg-white/90"}`}
                  >
                    {copied ? "✓ Copied Trade ($50)" : "1-Click Copy Trade"}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── 2. Token Safety Scanner ─── */
function ScannerDemo() {
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(true);

  const scan = () => {
    if (scanning) return;
    setScanning(true);
    setDone(false);
    setTimeout(() => {
      setScanning(false);
      setDone(true);
    }, 2000);
  };

  return (
    <div className="relative rounded-[28px] bg-[#020817] border border-white/10 p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/5 p-5 shadow-inner space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Smart Contract Audit</span>
          <button onClick={scan} className="text-[9px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded font-bold transition-colors">
            Re-scan Contract
          </button>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <span className="text-emerald-400 font-bold text-xs">PEPE</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">PepeCoin</div>
              <div className="text-[10px] text-slate-500 font-mono">0x6982...193</div>
            </div>
          </div>
          {done ? (
            <div className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              100/100 Safe
            </div>
          ) : (
            <div className="px-2 py-1 rounded bg-white/10 text-white text-[10px] font-bold animate-pulse">
              Scanning...
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Honeypot Risk", val: "Passed", color: "text-emerald-400" },
            { label: "Buy/Sell Tax", val: "0% / 0%", color: "text-emerald-400" },
            { label: "Liquidity", val: "Locked (99%)", color: "text-emerald-400" },
            { label: "Contract", val: "Renounced", color: "text-emerald-400" },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">{item.label}</div>
              {scanning ? (
                <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
              ) : (
                <div className={`text-xs font-black ${item.color}`}>{item.val}</div>
              )}
            </div>
          ))}
        </div>
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

        <div className="relative flex items-end gap-[3px] h-24 w-full">
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
  const circumference = 251.2;
  const offset = circumference - (circumference * fg / 100);

  return (
    <div className="relative rounded-[28px] bg-[#020817] border border-white/10 p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/5 p-6 shadow-inner flex flex-col items-center gap-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Market Sentiment</span>
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white tabular-nums">{fg}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white">{label}</span>
          </div>
        </div>
        <div className="w-full space-y-2.5">
          {[
            { label: "Bullish signals",  val: Math.min(100, fg + 10) },
            { label: "Momentum score",   val: fg },
            { label: "Bearish pressure", val: Math.max(0, 100-fg-10) },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 w-28 shrink-0">{b.label}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${b.val}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-white" />
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
  { id: "btc", pair: "BTC/USDT",  basePrice: 63420.5 },
  { id: "eth", pair: "ETH/USDT",  basePrice: 3451.2 },
  { id: "sol", pair: "SOL/USDT",  basePrice: 142.88 },
  { id: "pepe",pair: "PEPE/USDT", basePrice: 0.00001221 },
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
        return { ...tk, price: newPrice, change };
      }));
    }, 900);
    return () => clearInterval(t);
  }, []);
  const fmt = (p: number) => p > 1 ? p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toFixed(8);

  return (
    <div className="relative rounded-[28px] bg-[#020817] border border-white/10 p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/5 p-5 shadow-inner space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">WebSocket Feed · Live</span>
        </div>
        {tickers.map(tk => (
          <div key={tk.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold text-white text-sm">{tk.pair}</span>
            <div className="text-right">
              <motion.div layout className="font-mono text-sm font-bold text-white tabular-nums">{fmt(tk.price)}</motion.div>
              <div className={`text-[11px] font-bold tabular-nums text-slate-400`}>
                {tk.change >= 0 ? "+" : ""}{tk.change.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 6. AI Auto-Pilot ─── */
function AutoPilotDemo() {
  const [active, setActive] = useState(false);
  const [pnl, setPnl] = useState(0);

  useEffect(() => {
    let t: any;
    if (active) {
      t = setInterval(() => {
        setPnl(prev => prev + (Math.random() * 12 + 2));
      }, 800);
    } else {
      setPnl(0);
    }
    return () => clearInterval(t);
  }, [active]);

  return (
    <div className="relative rounded-[28px] bg-[#020817] border border-white/10 p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/5 p-6 shadow-inner space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Active Strategy</div>
            <div className="text-sm font-bold text-white">AI Trend Following (SOL)</div>
          </div>
          <button 
            onClick={() => setActive(!active)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${active ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            {active ? "ON" : "OFF"}
          </button>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center min-h-[100px] transition-all">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Simulated P&L</span>
          {active ? (
            <motion.div key="active" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-3xl font-black font-mono text-emerald-400 tabular-nums drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
              +${pnl.toFixed(2)}
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-black font-mono text-slate-500">
              $0.00
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>Risk Level</span>
            <span className="text-white">Moderate</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-white/60 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 7. Portfolio Sync ─── */
const PORTFOLIO_ASSETS = [
  { symbol: "BTC", pct: 45, opacity: 1 },
  { symbol: "ETH", pct: 30, opacity: 0.8 },
  { symbol: "SOL", pct: 15, opacity: 0.6 },
  { symbol: "Other", pct: 10, opacity: 0.4 },
];

function PortfolioDemo() {
  const [bal, setBal] = useState(124592.0);
  useEffect(() => {
    const t = setInterval(() => setBal(p => p + (Math.random() - 0.48) * 60), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative rounded-[28px] bg-[#020817] border border-white/10 p-4 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
      <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/5 p-6 shadow-inner space-y-5">
        <div className="text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Portfolio</div>
          <div className="text-2xl font-black font-mono text-white tabular-nums">
            ${bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-white font-bold mt-1">+12.4% this week</div>
        </div>

        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {PORTFOLIO_ASSETS.map(a => (
            <div key={a.symbol} className="bg-white rounded-full" style={{ width: `${a.pct}%`, opacity: a.opacity }} />
          ))}
        </div>

        <div className="space-y-2.5">
          {PORTFOLIO_ASSETS.map(a => (
            <div key={a.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" style={{ opacity: a.opacity }} />
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

/* ─── FEATURES CONFIG ─── */
type Feature = {
  tag: string;
  title: string; desc: string; bullets: string[];
  Demo: React.ComponentType;
  flip: boolean;
};

const FEATURES: Feature[] = [
  { tag: "Copy Trading",          title: "Whale Copy-Trading",      desc: "Don't just watch whales—trade like them. Connect your wallet and automatically copy the exact moves of the most profitable wallets on-chain in real-time. Delivered straight to your Telegram.", bullets: ["1-Click automated copy trading", "Instant Telegram & Discord alerts", "Customizable wallet tracking"], Demo: CopyTradeDemo,  flip: false },
  { tag: "Security",              title: "Token Safety Scanner",    desc: "Never get rugged again. Every token you look at goes through an instant Smart Contract Audit checking for honeypots, locked liquidity, tax rates, and contract ownership.", bullets: ["Honeypot & rug-pull detection", "Real-time liquidity verification", "Buy/Sell tax analysis"], Demo: ScannerDemo,    flip: true  },
  { tag: "AI Vision",             title: "AI Candlestick Vision",   desc: "Tired of drawing lines manually? Toggle AI Vision on your charts and let Deep Learning instantly map support/resistance zones, highlight hidden patterns, and overlay orderbook density right on the candles.", bullets: ["Auto-drawn Support & Resistance", "Pattern recognition (Head & Shoulders, Flags)", "Liquidity heatmaps"], Demo: CandleDemo,     flip: false },
  { tag: "AI Auto-Pilot",         title: "AI Auto-Pilot",           desc: "Stop agonizing over technical indicators. Tell the AI your risk tolerance, and it will backtest thousands of historical scenarios instantly to find and execute the most profitable strategy for you.", bullets: ["Zero-code strategy generation", "Instant historical backtesting", "One-click live deployment"], Demo: AutoPilotDemo,  flip: true  },
  { tag: "AI Powered",            title: "AI Market Analysis",      desc: "Our proprietary AI analyzes sentiment across millions of data points, giving you an edge with real-time Fear & Greed indices, social signals, and predictive modeling before the crowd catches on.", bullets: ["Fear & Greed Index (live)", "Social sentiment scanning", "Predictive pattern modeling"], Demo: AIMarketDemo,   flip: false },
  { tag: "Live Data",             title: "Real-Time Data",          desc: "Millisecond-precision WebSocket feeds straight to your dashboard. No 15-minute delays, no refresh buttons — every tick, every trade, every move, delivered the instant it happens on-chain.", bullets: ["Sub-second WebSocket feeds", "Multi-exchange aggregation", "Order book depth streaming"], Demo: RealTimeDemo,   flip: true  },
  { tag: "Portfolio",             title: "Unified Portfolio Sync",  desc: "Connect your Web3 wallets and Exchange APIs securely. See your full net worth, asset allocation breakdown, and real-time P&L in one beautiful, unified dashboard without manual tracking.", bullets: ["1-Click Web3 Wallet Connect", "Exchange API Synchronization", "Real-time P&L breakdown"], Demo: PortfolioDemo,  flip: false },
];

export function FeaturesZigZag() {
  return (
    <section className="relative z-10 px-6 lg:px-16 max-w-[1300px] mx-auto mb-32 space-y-32">

      <FadeUp className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-white text-xs font-semibold mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          The Arsenal
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

            <SlideIn direction={f.flip ? "left" : "right"} delay={0.2} className={f.flip ? "lg:order-1" : ""}>
              <Demo />
            </SlideIn>
          </div>
        );
      })}
    </section>
  );
}
