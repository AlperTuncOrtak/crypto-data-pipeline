import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Activity, Radio, Database, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useMarket } from "../../hooks/useMarket";

// ─── Animated Number Counter ──────────────────────────────────────────────────
function AnimCounter({ to, prefix = "", suffix = "", dec = 0 }: { to: number; prefix?: string; suffix?: string; dec?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, to, { duration: 1.8, ease: "easeOut", onUpdate: setV });
    return () => ctrl.stop();
  }, [to]);
  return <>{prefix}{v.toFixed(dec)}{suffix}</>;
}

// ─── Metric Strip ─────────────────────────────────────────────────────────────
function MetricStrip({ coins }: { coins?: any[] }) {
  const vol = (coins?.reduce((s, c) => s + (Number(c.total_volume) || 0), 0) || 0) / 1e9;
  const mcap = (coins?.reduce((s, c) => s + (Number(c.market_cap) || 0), 0) || 0) / 1e12;

  const metrics = [
    { label: "24h Volume",     num: vol,   prefix: "$", suffix: "B", dec: 1, Icon: BarChart3 },
    { label: "Market Cap",     num: mcap,  prefix: "$", suffix: "T", dec: 2, Icon: Database },
    { label: "Active Feeds",   num: 148,   prefix: "",  suffix: "",  dec: 0, Icon: Radio },
    { label: "24h Signals",    num: 3820,  prefix: "",  suffix: "+", dec: 0, Icon: Zap },
    { label: "Avg Latency",    num: 14,    prefix: "",  suffix: "ms",dec: 0, Icon: Activity },
    { label: "AI Win Rate",    num: 68,    prefix: "",  suffix: "%", dec: 0, Icon: TrendingUp },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.55 }}
      className="relative z-10 w-full border-t border-white/5 bg-[#08080d]/80 backdrop-blur-xl"
    >
      <div className="max-w-[1200px] mx-auto flex items-stretch divide-x divide-white/5 overflow-x-auto scrollbar-none">
        {metrics.map(({ label, num, prefix, suffix, dec, Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.06 }}
            whileHover={{ backgroundColor: "rgba(99,102,241,0.05)" }}
            className="flex-1 min-w-[140px] flex flex-col items-center justify-center py-6 px-4 gap-1.5 cursor-default transition-colors"
          >
            <Icon size={13} className="text-[var(--accent)] opacity-60" />
            <div className="text-[1.15rem] font-bold text-[var(--text-main)] font-mono tabular-nums tracking-tight leading-none">
              {num > 0 ? <AnimCounter to={num} prefix={prefix} suffix={suffix} dec={dec} /> : <span>{prefix}—{suffix}</span>}
            </div>
            <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-[0.14em] font-medium text-center">{label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function LinearHero({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: coins } = useMarket(50);

  return (
    <section className="relative flex flex-col overflow-hidden bg-[#09090b]">

      {/* ── Background Layer ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Subtle repeating dot-grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Soft ambient radial glows centered behind content */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      {/* ── Centered Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] max-w-4xl mx-auto w-full px-6 pt-24 pb-16 text-center">

        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.04, y: -1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md mb-8 cursor-default"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--positive)] opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--positive)]" />
          </span>
          <span className="text-[10px] tracking-[0.2em] font-semibold text-[var(--text-muted)] uppercase font-mono">
            Live · Build v2.5.1
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 36, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.95, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-[3.2rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] tracking-[-0.03em] font-black text-[var(--text-main)] mb-6"
        >
          Algorithmic Crypto
          <br />
          <span className="relative inline-block mt-1">
            <motion.span
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-[#818cf8] via-[#60a5fa] to-[#818cf8] bg-[length:200%_auto]"
            >
              Analytics.
            </motion.span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-[16px] md:text-[19px] text-[var(--text-muted)] leading-relaxed mb-12 max-w-2xl"
        >
          Institutional-grade execution, AI anomaly detection, and tick-level backtesting — the terminal built for the absolute frontier.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -2, boxShadow: "0 0 36px rgba(99,102,241,0.45)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { if (user) navigate("/dashboard"); else if (onAuthOpen) onAuthOpen("signup"); }}
            className="relative flex items-center justify-center gap-2.5 h-12 w-full sm:w-auto pl-7 pr-6 rounded-[12px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-[14px] transition-colors shadow-[0_4px_28px_rgba(99,102,241,0.32)] overflow-hidden"
          >
            <span className="relative z-10">Get Started</span>
            <ArrowRight size={16} className="relative z-10" />
            <motion.div
              animate={{ x: ["-120%", "220%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 4.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/docs")}
            className="flex items-center justify-center gap-2.5 h-12 w-full sm:w-auto px-8 rounded-[12px] border border-white/[0.1] bg-white/[0.03] backdrop-blur-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-white/[0.18] hover:bg-white/[0.06] font-medium text-[14px] transition-all"
          >
            Read Docs
          </motion.button>
        </motion.div>

      </div>

      {/* ── Metric Strip ── */}
      <MetricStrip coins={coins as any[]} />
    </section>
  );
}