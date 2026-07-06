import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ChevronDown } from "lucide-react";

const SIGNALS = [
  {
    id: 1,
    type: "BUY" as const,
    asset: "LINK / USD",
    summary: "Whale accumulation spike — potential breakout above $18.40 resistance.",
    detail: "On-chain data shows 2.3M LINK moved to cold storage in the last 60 min. Volume is 4× the 30-day average. RSI at 58 — room to run.",
    move: "+12.4%",
    timeframe: "12–24h",
    token: "LINK",
  },
  {
    id: 2,
    type: "SELL" as const,
    asset: "WIF / USD",
    summary: "Extreme overbought conditions — smart money distributing.",
    detail: "RSI at 87 on the 4h chart. Funding rates are negative on perps. Similar pattern preceded a 20% correction in April. Stablecoin hedge recommended.",
    move: "−18.2%",
    timeframe: "6–12h",
    token: "USDC",
  },
  {
    id: 3,
    type: "ROTATE" as const,
    asset: "FET / USD",
    summary: "AI narrative flows accelerating. FET showing 3× relative strength.",
    detail: "Weekly capital rotation into AI tokens is outperforming BTC by 3.1×. AGIX and FET leading. Breakout from 3-month base on daily confirmed.",
    move: "+8.5%",
    timeframe: "24–72h",
    token: "FET",
  },
];

type Signal = (typeof SIGNALS)[number];

const TYPE_CONFIG = {
  BUY:    { label: "Long",   Icon: TrendingUp,   color: "#22c55e" },
  SELL:   { label: "Short",  Icon: TrendingDown,  color: "#ef4444" },
  ROTATE: { label: "Rotate", Icon: RefreshCw,     color: "#a78bfa" },
};

function SignalRow({ s, onApply }: { s: Signal; onApply: () => void }) {
  const [open, setOpen] = useState(false);
  const cfg = TYPE_CONFIG[s.type];
  const Icon = cfg.Icon;
  const isPositive = s.type !== "SELL";

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Main row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors duration-150"
      >
        {/* Type icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
        >
          <Icon size={14} style={{ color: cfg.color }} strokeWidth={2.5} />
        </div>

        {/* Asset + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-bold text-white tracking-tight">{s.asset}</span>
            <span
              className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
              style={{ background: `${cfg.color}18`, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug truncate pr-4">
            {s.summary}
          </p>
        </div>

        {/* Move + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="text-sm font-bold font-mono"
            style={{ color: isPositive ? "#22c55e" : "#ef4444" }}
          >
            {s.move}
          </span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-slate-600" />
          </motion.div>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 flex flex-col gap-3">
              <p className="text-[12px] text-slate-400 leading-relaxed">
                {s.detail}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600 font-mono">
                  Target window: {s.timeframe}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onApply(); }}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-white hover:text-slate-200 transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "6px 12px",
                  }}
                >
                  Use in Swap
                  <ArrowUpRight size={12} />
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
  return (
    <div
      className="w-full flex flex-col"
      style={{
        background: "#0a0a0f",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 24,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <h3 className="text-[13px] font-bold text-white tracking-tight">
            Market Signals
          </h3>
          <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
            3 active · updated 2m ago
          </p>
        </div>
        {/* Live badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <motion.div
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-green-500"
          />
          <span className="text-[10px] font-bold text-green-500 font-mono">LIVE</span>
        </div>
      </div>

      {/* Signal list */}
      <div>
        {SIGNALS.map((s) => (
          <SignalRow
            key={s.id}
            s={s}
            onApply={() => onApplySuggestion(s.token)}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span className="text-[9px] text-slate-700 font-mono uppercase tracking-wider">
          AI · Not financial advice
        </span>
        <span className="text-[9px] text-slate-700 font-mono">
          91.2% avg accuracy
        </span>
      </div>
    </div>
  );
}
