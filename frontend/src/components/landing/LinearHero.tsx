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
    <section className="relative flex flex-col overflow-hidden bg-[#020204]">
      
      {/* 🔮 Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
        {/* Subtle Global Noise */}
        <div 
          className="absolute inset-0 z-20 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }}
        />
      </div>

      {/* ✨ Centered Content ✨ */}
      <div className="relative z-20 flex flex-col items-center justify-start pt-32 w-full text-center">

        {/* Casino-style Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.04 }}
          className="inline-flex items-center gap-2 pr-3 pl-1 py-1 rounded-full border border-white/[0.12] bg-[#111]/80 backdrop-blur-md mb-8 cursor-pointer group transition-colors hover:bg-[#222]/80 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <span className="bg-white text-black font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[10px]">
            New
          </span>
          <span className="text-[12px] font-medium text-white/80 group-hover:text-white transition-colors">
            AI tools inside →
          </span>
        </motion.div>

        {/* Pure White Bold H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[3rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] tracking-[-0.04em] font-bold text-white mb-6"
        >
          Unleash the Data.
          <br />
          Seize the Future.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[16px] md:text-[19px] text-[var(--text-muted)] leading-relaxed mb-10 max-w-2xl font-medium"
        >
          Your definitive toolkit for precision, insight, and dominance in crypto trading.
        </motion.p>

        {/* Minimalist CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto z-30"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { if (user) navigate("/dashboard"); else if (onAuthOpen) onAuthOpen("signup"); }}
            className="flex items-center justify-center h-12 w-full sm:w-[150px] rounded-full border border-white/20 bg-[#0a0a0c]/50 text-white hover:bg-white/10 font-semibold text-[14px] transition-all backdrop-blur-md"
          >
            Trade now
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/market")}
            className="flex items-center justify-center h-12 w-full sm:w-[150px] rounded-full bg-white text-black hover:bg-gray-200 font-bold text-[14px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Explore
          </motion.button>
        </motion.div>

        {/* 🎨 The Cropped Cyber Cat Artwork */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[1400px] mt-[-2rem] flex justify-center z-10 pointer-events-none"
        >
           {/* Fade out mask at the bottom so the image blends into the next section */}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020204] z-20" />
           <img 
              src="/hero-cat-cropped.png" 
              alt="CryptoNeko Mascot" 
              className="w-full h-auto object-cover opacity-95 mix-blend-screen"
              style={{ maskImage: 'radial-gradient(ellipse at top, black 50%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse at top, black 60%, transparent 100%)' }}
           />
        </motion.div>

      </div>

      {/* 📊 Metric Strip */}
      <div className="relative z-30 bg-[#020204] pt-8">
        <MetricStrip coins={coins as any[]} />
      </div>
    </section>
  );
}