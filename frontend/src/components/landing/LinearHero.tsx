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
    <section className="relative flex flex-col items-center overflow-hidden bg-[#020204]">
      {/* Background Layer: Extremely lightweight radial gradient instead of heavy blur */}
      <div className="pointer-events-none absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vw] max-w-[1000px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] z-0" />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen w-full pt-32 pb-20 text-center px-4">
        
        {/* Nansen-style Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 py-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 text-[var(--accent)] text-[11px] font-bold tracking-widest uppercase mb-8"
        >
          CryptoNeko Web App
        </motion.div>

        {/* Massive Bold Wide H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-[90px] leading-[0.95] tracking-[-0.04em] font-black text-white mb-6 max-w-5xl"
        >
          Agentic Trading with <br className="hidden md:block"/>
          Onchain Intelligence
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base md:text-xl text-white/50 font-medium leading-relaxed mb-10 max-w-2xl"
        >
          Trade alongside the largest onchain dataset of labeled wallets out in the market. See how top traders are positioning and go from discovery to execution, instantly.
        </motion.p>

        {/* Single CTA Button like Nansen */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { if (user) navigate("/dashboard"); else if (onAuthOpen) onAuthOpen("signup"); }}
          className="px-8 py-4 rounded-full bg-[var(--accent)] text-white font-bold text-[15px] shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] transition-all"
        >
          Launch Web App
        </motion.button>

        {/* Massive Floating App Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 100 }}
          className="relative w-full max-w-[1000px] mx-auto mt-20 z-20"
        >
          <div className="relative w-full aspect-[16/9] rounded-[24px] border border-white/10 bg-[#0a0a0f] shadow-2xl overflow-hidden flex flex-col">
            {/* MacOS style window header */}
            <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.01]">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
            </div>
            {/* Fake Dashboard Body */}
            <div className="flex-1 flex p-4 gap-4">
              {/* Fake Sidebar */}
              <div className="w-[200px] border-r border-white/5 flex flex-col gap-3 pr-4 hidden md:flex">
                <div className="h-6 w-full rounded-md bg-white/5" />
                <div className="h-6 w-3/4 rounded-md bg-[var(--accent)]/20" />
                <div className="h-6 w-full rounded-md bg-white/5" />
                <div className="h-6 w-5/6 rounded-md bg-white/5" />
              </div>
              {/* Fake Main Content */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="h-[120px] flex-1 rounded-xl border border-white/5 bg-white/[0.02]" />
                  <div className="h-[120px] flex-1 rounded-xl border border-white/5 bg-white/[0.02]" />
                  <div className="h-[120px] flex-1 rounded-xl border border-white/5 bg-white/[0.02]" />
                </div>
                {/* Fake Chart area */}
                <div className="flex-1 rounded-xl border border-[var(--accent)]/20 bg-gradient-to-b from-[var(--accent)]/5 to-transparent relative overflow-hidden">
                  <svg className="absolute bottom-0 w-full h-[60%] opacity-50" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M0,100 L0,50 Q25,20 50,60 T100,30 L100,100 Z" fill="url(#gradient)" />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5"/>
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Reflection removed for performance */}
        </motion.div>

      </div>

      {/* ── Metric Strip ── */}
      <MetricStrip coins={coins as any[]} />
    </section>
  );
}