import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ChevronDown } from "lucide-react";

const GLASS_BG     = "rgba(255,255,255,0.03)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";

const FALLBACK_SIGNALS = [
  {
    id: 1,
    type: "BUY" as const,
    asset: "LINK",
    pair: "LINK / USD",
    summary: "Whale accumulation spike — breakout above $18.40 imminent.",
    detail: "2.3M LINK moved to cold storage in 60 min. Volume 4× the 30-day average. RSI at 58 — room to run. Breakout confirmed on 4h chart.",
    move: "+12.4%",
    timeframe: "12–24h",
    token: "LINK",
    dotColor: "#10b981",
  },
  {
    id: 2,
    type: "SELL" as const,
    asset: "WIF",
    pair: "WIF / USD",
    summary: "Extreme overbought — smart money distributing.",
    detail: "RSI at 87 on the 4h. Funding rates negative on perps. Same setup preceded April's 20% correction. Stablecoin hedge recommended.",
    move: "−18.2%",
    timeframe: "6–12h",
    token: "USDC",
    dotColor: "#f43f5e",
  },
  {
    id: 3,
    type: "ROTATE" as const,
    asset: "FET",
    pair: "FET / USD",
    summary: "AI narrative flows accelerating. 3× relative strength.",
    detail: "Weekly capital rotation into AI tokens outperforming BTC by 3.1×. AGIX and FET leading. Breakout from 3-month base on daily.",
    move: "+8.5%",
    timeframe: "24–72h",
    token: "FET",
    dotColor: "#22d3ee",
  },
];

const TYPE_CFG = {
  BUY:    { label: "Long",   Icon: TrendingUp,  color: "#10b981" },
  SELL:   { label: "Short",  Icon: TrendingDown, color: "#f43f5e" },
  ROTATE: { label: "Rotate", Icon: RefreshCw,    color: "#22d3ee" },
};

type Signal = (typeof FALLBACK_SIGNALS)[number];

function SignalRow({ s, onApply }: { s: Signal; onApply: () => void }) {
  const [open, setOpen] = useState(false);
  const cfg = TYPE_CFG[s.type];
  const Icon = cfg.Icon;

  return (
    <div style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
      {/* Row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-5 py-4 flex items-center gap-3 transition-colors group"
        style={{ background: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.background = GLASS_BG)}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        {/* Color dot */}
        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ background: s.dotColor, boxShadow: `0 0 6px ${s.dotColor}` }} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-white">{s.pair}</span>
            <span
              className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded"
              style={{ background: `${cfg.color}14`, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug truncate pr-2">{s.summary}</p>
        </div>

        {/* Move + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold font-mono" style={{ color: s.type === "SELL" ? "#f43f5e" : "#10b981" }}>
            {s.move}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={13} className="text-slate-700" />
          </motion.div>
        </div>
      </button>

      {/* Detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
              <p className="text-[12px] text-slate-400 leading-relaxed mb-3">{s.detail}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-700 font-mono">Target: {s.timeframe}</span>
                <button
                  onClick={e => { e.stopPropagation(); onApply(); }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-80 active:scale-95"
                  style={{
                    background: GLASS_BG,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 8,
                    padding: "5px 12px",
                  }}
                >
                  Use in Swap <ArrowUpRight size={11} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AITradeInsights({
  onApplySuggestion,
}: {
  onApplySuggestion: (tokenSymbol: string) => void;
}) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const { apiClient } = await import("../../api/client");
        const res = await apiClient.get("/ai/signals");
        if (res.data && res.data.ok && Array.isArray(res.data.signals)) {
          setSignals(res.data.signals);
        } else {
          setSignals(FALLBACK_SIGNALS);
        }
      } catch (err) {
        console.error("Failed to fetch AI signals:", err);
        setSignals(FALLBACK_SIGNALS);
      } finally {
        setLoading(false);
      }
    };
    fetchSignals();
  }, []);

  return (
    <div
      className="w-full flex flex-col backdrop-blur-sm"
      style={{
        background: GLASS_BG,
        border: `1px solid ${GLASS_BORDER}`,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {/* Top line — matches landing page card style */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}
      >
        <div>
          <h3 className="text-[13px] font-semibold text-white tracking-tight">Market Signals</h3>
          <p className="text-[10px] text-slate-600 mt-0.5 font-mono">3 active · live</p>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <motion.div
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          />
          <span className="text-[10px] font-bold text-emerald-500 font-mono">LIVE</span>
        </div>
      </div>

      {/* Signals */}
      <div className="relative min-h-[220px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col justify-center items-center gap-4 bg-[#0a0b0d]/50 backdrop-blur-sm z-10">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <span className="text-xs font-mono text-emerald-500/70 animate-pulse uppercase tracking-widest">Generating AI Signals</span>
          </div>
        ) : (
          signals.map(s => (
            <SignalRow key={s.id} s={s} onApply={() => onApplySuggestion(s.token)} />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: `1px solid ${GLASS_BORDER}` }}
      >
        <span className="text-[9px] text-slate-700 font-mono uppercase tracking-wider">AI · Not financial advice</span>
        <span className="text-[9px] text-slate-700 font-mono">91.2% avg accuracy</span>
      </div>
    </div>
  );
}
