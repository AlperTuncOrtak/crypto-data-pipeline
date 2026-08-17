import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Activity, Brain, TrendingUp, BarChart2, Zap, Shield, Globe } from "lucide-react";

// ─── Premium Bento Card ──────────────────────────────────────
function BentoCard({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      whileHover={{ y: -4 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.32, 0.72, 0, 1] }}
      onMouseMove={onMouseMove}
      className={`group relative rounded-[20px] overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-overlay)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-[var(--border-base)] hover:bg-[var(--bg-elevated)] transition-all duration-300 ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-0 rounded-[20px]"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(99,102,241,0.06), transparent 50%)`
          )
        }}
      />
      {/* Subtle top edge highlight for glass effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent z-0" />
      <div className="relative z-10 w-full h-full flex flex-col p-7">
        {children}
      </div>
    </motion.div>
  );
}

// ─── CARD 1: AI Whale Radar ───────────────────────────────────
function WhaleRadar() {
  const [items, setItems] = useState([
    { id: 1, type: "WHALE BUY", amount: "1,200", asset: "BTC", score: 92, time: "Just now" },
    { id: 2, type: "ANOMALY", amount: "45,000", asset: "ETH", score: 88, time: "2s ago" },
    { id: 3, type: "WHALE SELL", amount: "890k", asset: "SOL", score: 95, time: "5s ago" },
  ]);

  useEffect(() => {
    let idCounter = 4;
    const assets = ["BTC", "ETH", "SOL", "LINK", "AVAX", "ARB"];
    const types = ["WHALE BUY", "ANOMALY", "WHALE SELL"] as const;
    const int = setInterval(() => {
      setItems(prev => {
        const typeStr = types[Math.floor(Math.random() * types.length)];
        const isSell = typeStr.includes("SELL");
        const newItem = {
          id: idCounter++,
          type: typeStr,
          amount: isSell ? `${(Math.random() * 900 + 100).toFixed(0)}k` : `${Math.floor(Math.random() * 500 + 10)}`,
          asset: assets[Math.floor(Math.random() * assets.length)],
          score: Math.floor(Math.random() * 20 + 80),
          time: "Just now"
        };
        return [newItem, ...prev.map(p => ({ ...p, time: p.time === "Just now" ? "2s ago" : p.time === "2s ago" ? "5s ago" : "8s ago" }))].slice(0, 3);
      });
    }, 2800);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="relative flex-1 w-full overflow-hidden mt-5 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 backdrop-blur-md p-4 flex flex-col shadow-inner">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--positive)] opacity-70" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--positive)]" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-semibold font-mono">ML Scanner Active</span>
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const isBuy = item.type.includes("BUY");
            const isAnomaly = item.type === "ANOMALY";
            const pillClass = isAnomaly
              ? "text-[var(--warning)] border-[var(--warning)]/20 bg-[var(--warning-muted)]"
              : isBuy
                ? "text-[var(--positive)] border-[var(--positive)]/20 bg-[var(--positive-muted)]"
                : "text-[var(--negative)] border-[var(--negative)]/20 bg-[var(--negative-muted)]";

            return (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, filter: "blur(4px)", scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 backdrop-blur-sm shadow-sm"
              >
                <div className="flex gap-3 items-center">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-[6px] tracking-wider uppercase border ${pillClass}`}>
                    {item.type}
                  </span>
                  <span className="text-[13px] text-[var(--text-main)] font-mono font-semibold">
                    {item.amount} <span className="text-[var(--text-muted)] font-medium">{item.asset}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[var(--text-faint)] font-mono">{item.time}</span>
                  <span className={`text-[11px] font-bold font-mono ${isAnomaly ? "text-[var(--warning)]" : isBuy ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                    {item.score}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── CARD 2: Portfolio PnL (SVG Equity Curve) ────────────────
function EquityCurve() {
  const path = "M 0 80 C 40 75, 80 65, 120 60 S 180 40, 220 35 S 290 20, 320 15 S 370 10, 400 8";
  const areaPath = `${path} L 400 100 L 0 100 Z`;
  const [pnl] = useState({ value: "+34.7%", usd: "+$12,490", period: "90d" });

  return (
    <div className="flex-1 mt-5 rounded-[14px] bg-[var(--bg-base)]/40 backdrop-blur-md border border-[var(--border-subtle)] relative p-4 flex flex-col justify-between overflow-hidden shadow-inner">
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div>
          <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">{pnl.period} Return</div>
          <div className="text-2xl font-black font-mono tracking-tight text-[var(--positive)]">{pnl.value}</div>
          <div className="text-[12px] text-[var(--text-faint)] font-mono">{pnl.usd}</div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--positive-muted)] border border-[var(--positive)]/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <TrendingUp size={11} className="text-[var(--positive)]" />
          <span className="text-[10px] font-bold text-[var(--positive)] uppercase tracking-wide">Outperform</span>
        </div>
      </div>

      <div className="relative h-[80px] w-full">
        {/* Subtle grid pattern behind chart */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '100% 20px' }}></div>
        <svg viewBox="0 0 400 100" className="w-full h-full relative z-10" preserveAspectRatio="none">
          <defs>
            <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={areaPath}
            fill="url(#equity-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />
          <motion.path
            d={path}
            fill="none"
            stroke="rgb(16,185,129)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
          />
          <motion.circle
            cx="400" cy="8" r="3"
            fill="rgb(16,185,129)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.8 }}
          />
        </svg>
        <motion.div
          className="absolute top-[2px] right-[-1px] w-2 h-2 rounded-full bg-[var(--positive)] z-20"
          animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

// ─── CARD 3: AI Sentiment Gauge ───────────────────────────────
function SentimentGauge() {
  const [score] = useState(78);
  const radius = 56;
  const cx = 80;
  const cy = 76;

  const label = score <= 25 ? "Extreme Fear" : score <= 45 ? "Fear" : score <= 55 ? "Neutral" : score <= 75 ? "Greed" : "Extreme Greed";
  const color = score <= 25 ? "var(--negative)" : score <= 45 ? "var(--warning)" : score <= 55 ? "var(--text-muted)" : "var(--positive)";

  function arcPath(startDeg: number, endDeg: number) {
    const sr = (startDeg * Math.PI) / 180;
    const er = (endDeg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(sr);
    const y1 = cy + radius * Math.sin(sr);
    const x2 = cx + radius * Math.cos(er);
    const y2 = cy + radius * Math.sin(er);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  }

  return (
    <div className="flex-1 mt-5 rounded-[14px] bg-[var(--bg-base)]/40 backdrop-blur-md border border-[var(--border-subtle)] flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_60%)]" />
      <svg viewBox="0 0 160 90" className="w-full max-w-[200px] relative z-10">
        <path d={arcPath(-178, -145)} stroke="rgba(239,68,68,0.4)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d={arcPath(-141, -108)} stroke="rgba(245,158,11,0.4)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d={arcPath(-104, -76)} stroke="rgba(148,163,184,0.25)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d={arcPath(-72, -40)} stroke="rgba(16,185,129,0.4)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d={arcPath(-36, -4)} stroke="rgba(16,185,129,0.65)" strokeWidth="6" fill="none" strokeLinecap="round" />

        <motion.line
          x1={cx - radius} y1={cy}
          x2={cx} y2={cy}
          stroke="var(--text-main)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ originX: 1, originY: 0.5 }}
          initial={{ rotate: 0 }}
          animate={{ rotate: (score / 100) * 180 }}
          transition={{ duration: 1.6, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
        />
        <circle cx={cx} cy={cy} r="4" fill="var(--bg-elevated)" stroke="var(--border-base)" strokeWidth="1.5" />
        <text x={cx} y={cy - 22} textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--text-main)" fontFamily="sans-serif">{score}</text>
      </svg>
      <div className="text-center -mt-2 relative z-10">
        <div className="text-[13px] font-bold tracking-tight" style={{ color }}>{label}</div>
        <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-widest mt-0.5">AI Sentiment · Live</div>
      </div>
    </div>
  );
}

// ─── CARD 4: Market Pulse Stats ───────────────────────────────
const STATS = [
  { icon: Globe, label: "Global Mkt Cap", value: "$2.41T", delta: "+1.8%", up: true },
  { icon: BarChart2, label: "24h Volume", value: "$89.3B", delta: "+4.2%", up: true },
  { icon: Zap, label: "Active Alerts", value: "1,247", delta: "Live", up: null },
  { icon: Shield, label: "Liquidations", value: "$312M", delta: "-22%", up: false },
];

// ─── Section ─────────────────────────────────────────────────
export function LinearBento() {
  return (
    <section className="py-28 px-6 max-w-[1360px] mx-auto relative z-10">

      <div className="text-center mb-20">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-block mb-5 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--text-muted)] bg-[var(--bg-subtle)]"
        >
          Platform Architecture
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--text-main)] mb-5 leading-[1.08]"
        >
          Every edge. One terminal.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[var(--text-muted)] text-lg max-w-lg mx-auto"
        >
          Institutional-grade analytics, AI-driven signals, and portfolio intelligence — unified.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[380px]">

        {/* 1: AI Whale Radar (8 col) */}
        <BentoCard className="md:col-span-8 md:row-span-1" delay={0}>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-[var(--positive-muted)]">
                <Activity size={15} className="text-[var(--positive)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">AI Whale Anomaly Radar</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] max-w-sm mb-1 leading-relaxed">
              Detect massive institutional flows using our Isolation Forest ML model — before they move the market.
            </p>
            <WhaleRadar />
          </div>
        </BentoCard>

        {/* 2: AI Sentiment Gauge (4 col) */}
        <BentoCard className="md:col-span-4 md:row-span-1" delay={0.1}>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-[var(--accent-muted)]">
                <Brain size={15} className="text-[var(--accent)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight">AI Sentiment Gauge</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Real-time market psychology from on-chain + social signals.</p>
            <SentimentGauge />
          </div>
        </BentoCard>

        {/* 3: Portfolio PnL Equity Curve (8 col) */}
        <BentoCard className="md:col-span-8 md:row-span-1" delay={0.15}>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-[var(--positive-muted)]">
                <TrendingUp size={15} className="text-[var(--positive)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Portfolio Performance</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] max-w-sm mb-1 leading-relaxed">
              Track your realized and unrealized PnL against benchmark indices in real time.
            </p>
            <EquityCurve />
          </div>
        </BentoCard>

        {/* 4: Market Pulse (4 col) */}
        <BentoCard className="md:col-span-4 md:row-span-1" delay={0.2}>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-[var(--bg-overlay)]">
                <Globe size={15} className="text-[var(--text-muted)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight">Market Pulse</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Live global metrics updated every second.</p>
            <div className="flex-1 mt-5 rounded-[14px] bg-[var(--bg-base)]/40 backdrop-blur-md border border-[var(--border-subtle)] p-5 shadow-inner">
              <div className="flex flex-col gap-5 h-full justify-center">
                {STATS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-[6px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                        <s.icon size={11} className="text-[var(--text-muted)]" />
                      </div>
                      <span className="text-[12px] text-[var(--text-muted)] font-medium">{s.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-bold font-mono text-[var(--text-main)]">{s.value}</div>
                      <div className={`text-[10px] font-mono font-bold ${s.up === null ? "text-[var(--accent)]" : s.up ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{s.delta}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </BentoCard>

      </div>
    </section>
  );
}
