import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 30, filter: "blur(8px)" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Whale X-Ray Mini UI ── */
const FAKE_WHALES = [
  { addr: "0x8a4f...d9c2", action: "BUY", token: "ETH", amount: "1,420", usd: "$4.9M", color: "emerald" },
  { addr: "0x1b7e...aa01", action: "SELL", token: "PEPE", amount: "400M", usd: "$2.1M", color: "rose" },
  { addr: "0xd33f...8811", action: "BUY", token: "BTC", amount: "18.4", usd: "$63M", color: "emerald" },
  { addr: "0xfe9a...2299", action: "SELL", token: "LINK", amount: "88,000", usd: "$1.2M", color: "rose" },
  { addr: "0x33bc...770e", action: "BUY", token: "USDC", amount: "5M", usd: "$5M", color: "cyan" },
];

function WhaleXRayDemo() {
  const [visible, setVisible] = useState<typeof FAKE_WHALES>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(prev => {
        const next = (prev + 1) % FAKE_WHALES.length;
        setVisible(v => [FAKE_WHALES[next], ...v].slice(0, 3));
        return next;
      });
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-full">
      <AnimatePresence>
        {visible.map((w, i) => (
          <motion.div
            key={w.addr + i}
            initial={{ opacity: 0, x: -20, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
              w.color === "emerald" ? "bg-emerald-500/5 border-emerald-500/20" :
              w.color === "rose" ? "bg-rose-500/5 border-rose-500/20" :
              "bg-cyan-500/5 border-cyan-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                w.color === "emerald" ? "bg-emerald-500/20 text-emerald-400" :
                w.color === "rose" ? "bg-rose-500/20 text-rose-400" :
                "bg-cyan-500/20 text-cyan-400"
              }`}>{w.action}</span>
              <span className="font-mono text-[10px] text-slate-500">{w.addr}</span>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold text-white">{w.amount} <span className="text-slate-400">{w.token}</span></div>
              <div className={`text-[10px] font-mono ${
                w.color === "emerald" ? "text-emerald-400" : w.color === "rose" ? "text-rose-400" : "text-cyan-400"
              }`}>{w.usd}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── Time-Machine Backtesting Mini UI ── */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const BARS = [42, 58, 35, 72, 61, 88, 52, 95, 78];

function BacktestingDemo() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runBacktest = () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    setResult(null);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 12 + 5;
      if (p >= 100) {
        clearInterval(t);
        setProgress(100);
        setRunning(false);
        setResult("+127.4%");
      } else {
        setProgress(p);
      }
    }, 150);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Chart bars */}
      <div className="flex items-end gap-1 h-16 w-full">
        {BARS.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.07, duration: 0.6, ease: "easeOut" }}
            className={`flex-1 rounded-t-sm ${i < 7 ? "bg-cyan-500/30" : "bg-emerald-400/60"} relative`}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 whitespace-nowrap">{MONTHS[i]}</div>
          </motion.div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={runBacktest}
          className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${running ? "bg-white/5 text-slate-500 cursor-not-allowed" : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"}`}
        >
          {running ? "Backtesting..." : result ? "Run Again" : "▶ Run Backtest"}
        </button>
        {result && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-emerald-400 font-black text-base font-mono"
          >
            {result}
          </motion.span>
        )}
      </div>
    </div>
  );
}

/* ── AI Portfolio Doctor Mini UI ── */
const RISK_ITEMS = [
  { label: "BTC", pct: 45, risk: "Low", color: "emerald" },
  { label: "ETH", pct: 30, risk: "Low", color: "cyan" },
  { label: "PEPE", pct: 20, risk: "High", color: "rose" },
  { label: "Other", pct: 5, risk: "Med", color: "amber" },
];

function PortfolioDoctorDemo() {
  const [score] = useState("B+");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full flex flex-col gap-3">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <span className="text-white font-black text-base">{score}</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Risk Score: Moderate</div>
              <div className="text-[10px] text-cyan-400">⚡ 20% in high-risk assets. Consider rebalancing.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {RISK_ITEMS.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 w-8">{item.label}</span>
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.pct}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                item.color === "emerald" ? "bg-emerald-500" :
                item.color === "cyan" ? "bg-cyan-400" :
                item.color === "rose" ? "bg-rose-500" : "bg-amber-400"
              }`}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{item.pct}%</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
            item.color === "emerald" ? "text-emerald-400 bg-emerald-500/10" :
            item.color === "cyan" ? "text-cyan-400 bg-cyan-500/10" :
            item.color === "rose" ? "text-rose-400 bg-rose-500/10" : "text-amber-400 bg-amber-500/10"
          }`}>{item.risk}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Live Signal Feed Mini UI ── */
const SIGNALS = [
  { type: "BUY", pair: "BTC/USDT", conf: 92, reason: "RSI oversold + Whale accumulation" },
  { type: "SELL", pair: "DOGE/USDT", conf: 78, reason: "Double top pattern detected" },
  { type: "BUY", pair: "SOL/USDT", conf: 85, reason: "Breakout above 200 MA" },
  { type: "WATCH", pair: "ETH/USDT", conf: 67, reason: "Consolidation phase, await trigger" },
];

function LiveSignalsDemo() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent(prev => (prev + 1) % SIGNALS.length), 2500);
    return () => clearInterval(t);
  }, []);

  const sig = SIGNALS[current];

  return (
    <div className="flex flex-col gap-2 w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`p-4 rounded-xl border ${
            sig.type === "BUY" ? "bg-emerald-500/5 border-emerald-500/20" :
            sig.type === "SELL" ? "bg-rose-500/5 border-rose-500/20" :
            "bg-amber-500/5 border-amber-500/20"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
              sig.type === "BUY" ? "bg-emerald-500/20 text-emerald-400" :
              sig.type === "SELL" ? "bg-rose-500/20 text-rose-400" :
              "bg-amber-500/20 text-amber-400"
            }`}>{sig.type}</span>
            <span className="text-white font-bold font-mono text-sm">{sig.pair}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-500">Confidence</span>
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sig.conf}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${
                  sig.type === "BUY" ? "bg-emerald-400" :
                  sig.type === "SELL" ? "bg-rose-400" : "bg-amber-400"
                }`}
              />
            </div>
            <span className={`text-[11px] font-bold ${
              sig.type === "BUY" ? "text-emerald-400" :
              sig.type === "SELL" ? "text-rose-400" : "text-amber-400"
            }`}>{sig.conf}%</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">{sig.reason}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1.5 justify-center mt-1">
        {SIGNALS.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === current ? "w-4 bg-cyan-400" : "w-1.5 bg-white/10"}`} />
        ))}
      </div>
    </div>
  );
}

/* ── Main Export ── */
export function FeatureBentoGrid() {
  return (
    <section className="relative z-10 px-6 lg:px-12 max-w-[1400px] mx-auto mb-32">
      {/* Section Header */}
      <FadeIn className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs font-semibold mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
          Exclusive Features
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Tools that give you an{" "}
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            unfair advantage
          </span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Features that institutional desks pay six figures for — now in your browser, for free.
        </p>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* BENTO 1: Whale X-Ray — col-span-1 */}
        <FadeIn delay={0.1} className="relative group overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-8 min-h-[380px] flex flex-col justify-between backdrop-blur-2xl shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          {/* Glow */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-[70px] pointer-events-none" />

          <div className="relative z-10 flex-1 mb-8 w-full rounded-2xl border border-white/[0.05] bg-[#020817]/80 p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Live Whale Feed</span>
            </div>
            <WhaleXRayDemo />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12c0-3.5 2.5-6 7-6s7 2 10 6c-3 4-5.5 6-10 6S3 15.5 3 12z" />
                <circle cx="12" cy="12" r="3" fill="currentColor" className="text-emerald-400" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Whale X-Ray</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track every wallet moving $1M+ in real time. Know what the smart money is doing before the crowd notices.
            </p>
          </div>
        </FadeIn>

        {/* BENTO 2: Time-Machine Backtesting — col-span-2 */}
        <FadeIn delay={0.2} className="md:col-span-2 relative group overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-8 min-h-[380px] flex flex-col justify-between backdrop-blur-2xl shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.04] to-cyan-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex-1 mb-8 w-full rounded-2xl border border-white/[0.05] bg-[#020817]/80 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Strategy: RSI + EMA Cross</span>
              </div>
              <span className="text-[10px] font-mono text-purple-400">2024 → 2025</span>
            </div>
            <BacktestingDemo />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Time-Machine Backtesting</h3>
            <p className="text-slate-400 max-w-lg text-sm leading-relaxed">
              Replay any strategy against years of historical data in seconds. Know your edge before risking a single dollar in live markets.
            </p>
          </div>
        </FadeIn>

        {/* BENTO 3: AI Portfolio Doctor — col-span-2 */}
        <FadeIn delay={0.3} className="md:col-span-2 relative group overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-8 min-h-[380px] flex flex-col justify-between backdrop-blur-2xl shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex-1 mb-8 w-full rounded-2xl border border-white/[0.05] bg-[#020817]/80 p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Risk Analysis — Live</span>
            </div>
            <PortfolioDoctorDemo />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">AI Portfolio Doctor</h3>
            <p className="text-slate-400 max-w-lg text-sm leading-relaxed">
              Connect your wallet and get an instant AI-generated risk score, diversification grade, and actionable rebalancing recommendations in seconds.
            </p>
          </div>
        </FadeIn>

        {/* BENTO 4: Live AI Signals — col-span-1 */}
        <FadeIn delay={0.4} className="relative group overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-8 min-h-[380px] flex flex-col justify-between backdrop-blur-2xl shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 flex-1 mb-8 w-full rounded-2xl border border-white/[0.05] bg-[#020817]/80 p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Signal Engine</span>
            </div>
            <LiveSignalsDemo />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Live AI Signals</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              AI-powered BUY/SELL/WATCH signals updated every minute, combining technical patterns, on-chain data, and sentiment.
            </p>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
