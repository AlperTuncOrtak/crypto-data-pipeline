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
    <section className="relative flex flex-col overflow-hidden bg-black">
      
      {/* 🔮 Background Layer with Noise & Image */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
        {/* Global Film Grain / Noise */}
        <div 
          className="absolute inset-0 z-20 opacity-[0.4] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* The Spectacular 3D Crypto Fire Artwork */}
        <div className="absolute top-[20%] md:top-[10%] w-full max-w-[1200px] aspect-square md:aspect-video flex items-center justify-center z-0 opacity-80 mix-blend-screen">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,black_70%)] z-10" />
          <img 
            src="/hero-bg.png" 
            alt="Crypto Terminal" 
            className="w-full h-full object-cover object-center"
            style={{ maskImage: 'radial-gradient(circle, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 70%)' }}
          />
        </div>
      </div>

      {/* ✨ Centered Content ✨ */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[90vh] max-w-4xl mx-auto w-full px-6 pt-32 pb-16 text-center">

        {/* Casino-style Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.04 }}
          className="inline-flex items-center gap-2 pr-3 pl-1 py-1 rounded-full border border-white/[0.12] bg-[#111]/80 backdrop-blur-md mb-8 cursor-pointer group transition-colors hover:bg-[#222]/80"
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
          className="text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] tracking-[-0.04em] font-black text-white mb-6 drop-shadow-2xl"
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
          className="text-[17px] md:text-[20px] text-white/50 leading-relaxed mb-12 max-w-2xl font-medium"
        >
          Your definitive toolkit for precision, insight, and dominance in crypto trading.
        </motion.p>

        {/* Minimalist CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { if (user) navigate("/dashboard"); else if (onAuthOpen) onAuthOpen("signup"); }}
            className="flex items-center justify-center h-12 w-full sm:w-[160px] rounded-full border border-white/20 bg-transparent text-white hover:bg-white/10 font-semibold text-[15px] transition-all backdrop-blur-sm"
          >
            Try for free
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/docs")}
            className="flex items-center justify-center h-12 w-full sm:w-[160px] rounded-full bg-white text-black hover:bg-gray-200 font-bold text-[15px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Get a demo
          </motion.button>
        </motion.div>

      </div>
      <MetricStrip coins={coins as any[]} />
    </section>
  );
}