import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ChevronDown } from "lucide-react";

const SIGNALS = [
  {
    id: 1,
    type: "BUY" as const,
    asset: "LINK",
    pair: "/ USD",
    summary: "Whale accumulation spike — breakout above $18.40 resistance.",
    detail: "On-chain data shows 2.3M LINK moved to cold storage in the last 60 min. Volume is 4× the 30-day average. RSI at 58 — room to run.",
    move: "+12.4%",
    positive: true,
    timeframe: "12–24h",
    token: "LINK",
  },
  {
    id: 2,
    type: "SELL" as const,
    asset: "WIF",
    pair: "/ USD",
    summary: "Extreme overbought — smart money distributing.",
    detail: "RSI at 87 on the 4h chart. Funding rates flipped negative on perps. Similar setup preceded a 20% correction in April.",
    move: "−18.2%",
    positive: false,
    timeframe: "6–12h",
    token: "USDC",
  },
  {
    id: 3,
    type: "ROTATE" as const,
    asset: "FET",
    pair: "/ USD",
    summary: "AI sector rotation — FET showing 3× relative strength vs BTC.",
    detail: "Weekly capital flows into AI tokens outperforming BTC by 3.1×. Breakout from 3-month base on daily chart confirmed.",
    move: "+8.5%",
    positive: true,
    timeframe: "24–72h",
    token: "FET",
  },
];

type Signal = (typeof SIGNALS)[number];

const TYPE_CONFIG = {
  BUY:    { label: "Long",   Icon: TrendingUp,   color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)" },
  SELL:   { label: "Short",  Icon: TrendingDown,  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)" },
  ROTATE: { label: "Rotate", Icon: RefreshCw,     color: "#fa4eff", bg: "rgba(250,78,255,0.1)",  border: "rgba(250,78,255,0.2)" },
};

function SignalRow({ s, onApply }: { s: Signal; onApply: () => void }) {
  const [open, setOpen] = useState(false);
  const cfg = TYPE_CONFIG[s.type];
  const Icon = cfg.Icon;

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-4 flex items-center gap-3 transition-colors duration-150"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {/* Type badge */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg shrink-0"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <Icon size={11} style={{ color: cfg.color }} strokeWidth={2.5} />
          <span className="text-[10px] font-bold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>

        {/* Asset + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1 mb-0.5">
            <span className="text-sm font-semibold text-white">{s.asset}</span>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{s.pair}</span>
          </div>
          <p className="text-[11px] leading-snug truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
            {s.summary}
          </p>
        </div>

        {/* Move + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold font-mono" style={{ color: s.positive ? "#22c55e" : "#ef4444" }}>
            {s.move}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.25)" }} />
          </motion.div>
        </div>
      </button>

      {/* Expanded */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4" style={{ paddingTop: 0 }}>
              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-[12px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {s.detail}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Window: {s.timeframe}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onApply(); }}
                    className="flex items-center gap-1.5 text-[11px] font-semibold transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: 8,
                      padding: "5px 11px",
                      color: "rgba(255,255,255,0.7)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  >
                    Use in Swap
                    <ArrowUpRight size={11} />
                  </button>
                </div>
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
      className="w-full flex flex-col overflow-hidden"
      style={{
        background: "#1b1b1b",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 24,
      }}
    >
      {/* Header — matches Swap card header exactly */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <span className="text-white font-semibold text-base">Market Signals</span>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            3 active · 2m ago
          </p>
        </div>
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
          <SignalRow key={s.id} s={s} onApply={() => onApplySuggestion(s.token)} />
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>
          Not financial advice
        </span>
        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
          91.2% accuracy
        </span>
      </div>
    </div>
  );
}
