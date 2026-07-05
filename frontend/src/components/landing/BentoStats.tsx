import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

const stats = [
  { value: "3.4×", label: "Faster signal velocity" },
  { value: "92%", label: "Alert accuracy rate" },
  { value: "11k+", label: "Active traders" },
  { value: "$2.1B", label: "Volume tracked" },
];

// Mini bar chart data
const chartBars = [55, 80, 60, 95, 70, 88, 75, 100, 65, 90];

function LiveBarChart() {
  return (
    <div className="w-full h-full flex flex-col p-5">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-bold text-white/80">
          BTC Market Depth · Live
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5 h-28 mb-5">
        {chartBars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
            style={{ originY: 1, height: `${h}%` }}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-500/80 to-cyan-400/40"
          />
        ))}
      </div>

      {/* Funnel bars */}
      <div className="space-y-2.5">
        {[
          { label: "Spot buys", pct: 82 },
          { label: "Perpetuals", pct: 67 },
          { label: "Options", pct: 48 },
          { label: "OTC block", pct: 31 },
        ].map(({ label, pct }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-20 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BentoStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const navigate = useNavigate();

  return (
    <section
      ref={ref}
      className="relative z-10 px-6 lg:px-12 py-20 max-w-[1200px] mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-14">
        {/* Left copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-4">
            Built For Momentum
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-5">
            See the whole market
            <br />
            move in real time
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md">
            Every block, every whale, every sentiment spike — rendered live.
            CryptoNeko gives you the altitude to spot what's moving and the
            precision to act instantly.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-2.5 px-6 py-3 rounded-full bg-cyan-400 text-[#020817] font-bold text-sm hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] cursor-pointer"
          >
            Explore the terminal
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Right chart */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-72 rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm shadow-[0_0_60px_rgba(34,211,238,0.05)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent" />
          <LiveBarChart />
        </motion.div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ value, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-cyan-500/20 transition-all group"
          >
            <span className="text-3xl font-black text-cyan-400 group-hover:text-cyan-300 transition-colors font-mono">
              {value}
            </span>
            <span className="text-xs text-slate-500 mt-2 font-medium">{label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
