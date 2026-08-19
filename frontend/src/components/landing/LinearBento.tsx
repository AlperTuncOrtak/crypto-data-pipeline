import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, Brain, TrendingUp, BarChart2, Zap, Shield, Globe } from "lucide-react";
import { BaseGlassCard, SectionHeader, BentoGridWrapper, MetricStrip } from "../ui/EthenaDesign";

// ─── CARD 1: AI Whale Radar ─────────────────────────────────────────────
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
    <div className="relative flex-1 w-full overflow-hidden mt-6 flex flex-col">
      <div className="flex items-center gap-2 mb-6 px-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--positive)] opacity-70" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--positive)]" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold font-mono">Live Feed</span>
      </div>

      <div className="flex flex-col gap-3 relative z-10 min-h-[176px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item) => {
            const isBuy = item.type.includes("BUY");
            const isAnomaly = item.type === "ANOMALY";
            const textColor = isAnomaly ? "text-orange-400" : isBuy ? "text-[var(--positive)]" : "text-[var(--negative)]";

            return (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
              >
                <div className="flex gap-4 items-center">
                  <span className={`text-[10px] font-bold tracking-widest uppercase w-20 ${textColor}`}>
                    {item.type}
                  </span>
                  <span className="text-[15px] text-white font-mono font-medium">
                    {item.amount} <span className="text-white/40">{item.asset}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-white/30 font-mono hidden sm:inline-block">{item.time}</span>
                  <span className={`text-[13px] font-bold font-mono ${textColor}`}>
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

// ─── CARD 2: Portfolio PnL (SVG Equity Curve) ───────────────────────────
function EquityCurve() {
  const path = "M 0 80 C 40 75, 80 65, 120 60 S 180 40, 220 35 S 290 20, 320 15 S 370 10, 400 8";
  const areaPath = `${path} L 400 100 L 0 100 Z`;
  const [pnl] = useState({ value: "+34.7%", usd: "+$12,490", period: "90d" });

  return (
    <div className="flex-1 mt-4 relative flex flex-col overflow-hidden">
      <div className="flex items-center justify-between relative z-10 px-1">
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-semibold">{pnl.period} Return</div>
          <div className="text-[32px] font-medium font-mono tracking-tight text-white mt-1 leading-none">{pnl.value}</div>
          <div className="text-[12px] text-white/30 font-mono mt-1.5">{pnl.usd}</div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--positive)]/20 bg-[var(--positive)]/5 self-start">
          <span className="text-[10px] font-bold text-[var(--positive)] uppercase tracking-widest">Outperform</span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[65%] w-full">
        {/* Minimal grid lines */}
        <div className="absolute inset-0 border-t border-white/[0.03]" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/[0.03]" />
        
        <svg viewBox="0 0 400 100" className="w-full h-full relative z-10" preserveAspectRatio="none">
          <defs>
            <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
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
            stroke="rgb(129,140,248)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
          />
          <motion.circle
            cx="400" cy="8" r="4"
            fill="#09090b"
            stroke="rgb(129,140,248)"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.8 }}
          />
        </svg>
      </div>
    </div>
  );
}

// ─── CARD 3: AI Sentiment Gauge ─────────────────────────────────────────
function SentimentGauge() {
  const [score] = useState(78);
  const cx = 100, cy = 90, radius = 70;
  const color = score > 60 ? "rgb(16,185,129)" : score < 40 ? "rgb(239,68,68)" : "rgb(245,158,11)";
  const label = score > 60 ? "Greed" : score < 40 ? "Fear" : "Neutral";

  const arcPath = (startAngle: number, endAngle: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(start), y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end), y2 = cy + radius * Math.sin(end);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex-1 mt-6 flex flex-col items-center justify-center p-4">
      <svg viewBox="0 0 200 120" className="w-[180px] h-[110px] drop-shadow-2xl">
        {/* Subtle background track */}
        <path d={arcPath(-180, 0)} stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="none" strokeLinecap="round" />
        
        {/* Color segments (ultra thin) */}
        <path d={arcPath(-180, -145)} stroke="rgba(239,68,68,0.4)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d={arcPath(-141, -108)} stroke="rgba(245,158,11,0.4)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d={arcPath(-104, -76)} stroke="rgba(255,255,255,0.15)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d={arcPath(-72, -40)} stroke="rgba(16,185,129,0.4)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d={arcPath(-36, 0)} stroke="rgba(16,185,129,0.65)" strokeWidth="4" fill="none" strokeLinecap="round" />

        <motion.line
          x1={cx - radius + 15} y1={cy}
          x2={cx} y2={cy}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ originX: 1, originY: 0.5 }}
          initial={{ rotate: 0 }}
          animate={{ rotate: (score / 100) * 180 }}
          transition={{ duration: 1.6, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
        />
        <circle cx={cx} cy={cy} r="4" fill="#09090b" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        <text x={cx} y={cy - 28} textAnchor="middle" fontSize="26" fontWeight="600" fill="white" fontFamily="monospace">{score}</text>
      </svg>
      <div className="text-center mt-2 relative z-10">
        <div className="text-[13px] font-medium tracking-wide text-white">{label}</div>
        <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1.5">Network Index</div>
      </div>
    </div>
  );
}

// ─── CARD 4: Market Pulse Stats ─────────────────────────────────────────
const STATS = [
  { icon: Globe, label: "Global Mkt Cap", value: "$2.41T", delta: "+1.8%", up: true },
  { icon: BarChart2, label: "24h Volume", value: "$89.3B", delta: "+4.2%", up: true },
  { icon: Zap, label: "Active Alerts", value: "1,247", delta: "Live", up: null },
  { icon: Shield, label: "Liquidations", value: "$312M", delta: "-22%", up: false },
];

// ─── Section ──────────────────────────────────────────────────────────
export function LinearBento() {
  return (
    <section className="py-24 relative z-10 w-full overflow-hidden bg-[#09090b]">
      
      <SectionHeader 
        badge="Platform Architecture"
        title="Every edge. One terminal."
        subtitle="Institutional-grade analytics, AI-driven signals, and portfolio intelligence — unified in an ultra-modern interface."
      />

      <BentoGridWrapper>
        {/* 1: AI Whale Radar (8 col) */}
        <BaseGlassCard className="col-span-1 md:col-span-12 lg:col-span-8" glowPosition="top-left">
          <div className="flex items-center gap-3 mb-2">
            <Activity size={18} className="text-white/60" />
            <h3 className="text-[19px] font-medium text-white tracking-tight">AI Whale Anomaly Radar</h3>
          </div>
          <p className="text-[14px] text-white/40 max-w-md leading-relaxed mb-1">
            Detect massive institutional flows using our ML model before they move the market.
          </p>
          <WhaleRadar />
        </BaseGlassCard>

        {/* 2: AI Sentiment Gauge (4 col) */}
        <BaseGlassCard className="col-span-1 md:col-span-12 lg:col-span-4" glowPosition="top-right">
          <div className="flex items-center gap-3 mb-2">
            <Brain size={18} className="text-white/60" />
            <h3 className="text-[19px] font-medium text-white tracking-tight">AI Sentiment</h3>
          </div>
          <p className="text-[14px] text-white/40 leading-relaxed mb-1">Real-time market psychology from on-chain + social signals.</p>
          <SentimentGauge />
        </BaseGlassCard>

        {/* 3: Portfolio PnL Equity Curve (8 col) */}
        <BaseGlassCard className="col-span-1 md:col-span-12 lg:col-span-8" glowPosition="bottom">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={18} className="text-white/60" />
            <h3 className="text-[19px] font-medium text-white tracking-tight">Portfolio Performance</h3>
          </div>
          <p className="text-[14px] text-white/40 max-w-md leading-relaxed mb-1">
            Track your realized and unrealized PnL against benchmark indices in real time.
          </p>
          <EquityCurve />
        </BaseGlassCard>

        {/* 4: Market Pulse (4 col) */}
        <BaseGlassCard className="col-span-1 md:col-span-12 lg:col-span-4" glowPosition="center">
          <div className="flex items-center gap-3 mb-2">
            <Globe size={18} className="text-white/60" />
            <h3 className="text-[19px] font-medium text-white tracking-tight">Market Pulse</h3>
          </div>
          <p className="text-[14px] text-white/40 leading-relaxed mb-1">Live global metrics updated every second.</p>
          <div className="flex-1 mt-6 flex flex-col justify-center gap-5">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                className="flex items-center justify-between border-b border-white/[0.03] pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <s.icon size={15} className="text-white/30" />
                  <span className="text-[14px] text-white/50 font-medium">{s.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-medium font-mono text-white/90">{s.value}</div>
                  <div className={`text-[11px] font-mono font-medium mt-0.5 uppercase tracking-widest ${s.up === null ? "text-[var(--accent)]" : s.up ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{s.delta}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </BaseGlassCard>
      </BentoGridWrapper>

      <div className="mt-20">
        <MetricStrip items={[
          { label: "Total Value Locked", value: "$4.12B" },
          { label: "Active Traders", value: "142K" },
          { label: "Supported Assets", value: "8,400+" },
          { label: "Avg Execution", value: "12ms" }
        ]} />
      </div>
      
    </section>
  );
}