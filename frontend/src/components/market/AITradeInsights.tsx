import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Zap,
  ArrowUpRight,
  Shield,
  ChevronRight,
} from "lucide-react";

const SIGNALS = [
  {
    id: 1,
    type: "BUY",
    asset: "LINK",
    desc: "Whale wallets accumulated 2.3M tokens in 60 min. Breakout above $18.4 resistance confirmed.",
    move: "+12.4%",
    conviction: 94,
    timeAgo: "2m ago",
    color: "#10b981",
    glowColor: "rgba(16,185,129,0.15)",
    borderGlow: "rgba(16,185,129,0.4)",
    Icon: TrendingUp,
    token: "LINK",
  },
  {
    id: 2,
    type: "SELL",
    asset: "WIF",
    desc: "RSI at 87 — extreme overbought. Smart money distributing. Correction to $1.92 likely.",
    move: "-18.2%",
    conviction: 88,
    timeAgo: "7m ago",
    color: "#f43f5e",
    glowColor: "rgba(244,63,94,0.12)",
    borderGlow: "rgba(244,63,94,0.4)",
    Icon: AlertTriangle,
    token: "USDC",
  },
  {
    id: 3,
    type: "ROTATE",
    asset: "FET",
    desc: "AI narrative dominating weekly flows. FET & AGIX showing 3x relative strength vs BTC.",
    move: "+8.5%",
    conviction: 76,
    timeAgo: "14m ago",
    color: "#8b5cf6",
    glowColor: "rgba(139,92,246,0.12)",
    borderGlow: "rgba(139,92,246,0.4)",
    Icon: Sparkles,
    token: "FET",
  },
];

const TYPE_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  BUY:    { label: "BUY",    bg: "rgba(16,185,129,0.12)", text: "#10b981" },
  SELL:   { label: "SELL",   bg: "rgba(244,63,94,0.12)",  text: "#f43f5e" },
  ROTATE: { label: "ROTATE", bg: "rgba(139,92,246,0.12)", text: "#8b5cf6" },
};

function ConvictionBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          style={{ background: color, height: "100%", borderRadius: "9999px" }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

export default function AITradeInsights({
  onApplySuggestion,
}: {
  onApplySuggestion: (tokenSymbol: string) => void;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [scanPhase, setScanPhase] = useState(0);

  // Cycle through "scanning" phases
  useEffect(() => {
    const id = setInterval(() => setScanPhase((p) => (p + 1) % 3), 2000);
    return () => clearInterval(id);
  }, []);

  const scanLabels = ["Scanning markets…", "Analyzing flows…", "Signals updated"];

  return (
    <div
      className="w-full flex flex-col rounded-3xl overflow-hidden relative"
      style={{
        background: "linear-gradient(160deg, #0d0d12 0%, #080810 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 0 60px -20px rgba(99,102,241,0.12)",
      }}
    >
      {/* Ambient glow top-right */}
      <div
        className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── HEADER ── */}
      <div className="relative z-10 px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3">
            <div
              className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
                border: "1px solid rgba(99,102,241,0.25)",
              }}
            >
              <Zap size={16} className="text-indigo-400" />
              {/* Live dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              </span>
            </div>
            <div>
              <h3 className="text-white font-bold text-base tracking-tight leading-none">
                Alpha Signals
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono tracking-wider uppercase">
                AI Intelligence Feed
              </p>
            </div>
          </div>

          {/* Right: scanning status */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={scanPhase}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-[10px] font-mono text-slate-400 whitespace-nowrap"
              >
                {scanLabels[scanPhase]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-4">
          {[
            { label: "Signals", value: "3 Live" },
            { label: "Accuracy", value: "91.2%" },
            { label: "Updated", value: "Just now" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex-1 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">{label}</div>
              <div className="text-xs font-bold text-white mt-0.5 font-mono">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

      {/* ── SIGNAL CARDS ── */}
      <div className="flex-1 flex flex-col gap-2 px-3 py-3 relative z-10">
        {SIGNALS.map((s, i) => {
          const typeStyle = TYPE_LABEL[s.type];
          const isActive = activeId === s.id;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 120, damping: 18 }}
              onClick={() => setActiveId(isActive ? null : s.id)}
              className="rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-300"
              style={{
                background: isActive
                  ? s.glowColor
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? s.borderGlow : "rgba(255,255,255,0.06)"}`,
                boxShadow: isActive ? `0 0 24px -6px ${s.glowColor}` : "none",
              }}
            >
              {/* Top accent line */}
              <div
                className="h-[2px] w-full"
                style={{ background: `linear-gradient(90deg, ${s.color}, transparent 70%)`, opacity: isActive ? 1 : 0.3 }}
              />

              <div className="px-4 py-3">
                {/* Row 1: Type badge + Asset + Move + Time */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md"
                    style={{ background: typeStyle.bg, color: typeStyle.text }}
                  >
                    {typeStyle.label}
                  </span>
                  <span className="text-sm font-black text-white">{s.asset}</span>
                  <span
                    className="text-xs font-bold font-mono ml-auto"
                    style={{ color: s.color }}
                  >
                    {s.move}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">{s.timeAgo}</span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  {s.desc}
                </p>

                {/* Conviction bar */}
                <div className="mb-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">AI Conviction</span>
                  </div>
                  <ConvictionBar value={s.conviction} color={s.color} />
                </div>

                {/* Expanded action */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-3 pt-3"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplySuggestion(s.token);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:brightness-110 active:scale-95"
                          style={{
                            background: `linear-gradient(135deg, ${s.color}22, ${s.color}11)`,
                            border: `1px solid ${s.color}44`,
                            color: s.color,
                          }}
                        >
                          <Shield size={14} />
                          Apply Signal to Swap
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── FOOTER ── */}
      <div
        className="px-5 py-3 relative z-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-600 tracking-wider uppercase flex items-center gap-1.5">
            <ChevronRight size={10} className="text-indigo-500" />
            CryptoNeko Neural Engine v2.4
          </span>
          <span className="text-[9px] font-mono text-slate-600">
            Not financial advice
          </span>
        </div>
      </div>
    </div>
  );
}
