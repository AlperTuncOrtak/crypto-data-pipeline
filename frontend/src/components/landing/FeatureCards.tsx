import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Fish, BarChart2, Zap, Shield, Globe, Cpu } from "lucide-react";

const features = [
  {
    icon: Fish,
    title: "Whale X-Ray",
    desc: "Track every large wallet movement the moment it hits the blockchain. See exactly who is accumulating and who is distributing before price reacts.",
  },
  {
    icon: BarChart2,
    title: "Live AI Analytics",
    desc: "Real-time dashboards fuse on-chain data with social sentiment — turning noise into the single number that tells you what to do next.",
  },
  {
    icon: Zap,
    title: "Instant Triggers",
    desc: "Fire custom alerts across your stack the moment anomalies appear. Milliseconds not minutes — because every block counts.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade",
    desc: "Multi-factor auth, encrypted vaults, and SOC-2 aligned architecture. Institutional security baked in, not bolted on.",
  },
  {
    icon: Cpu,
    title: "AI Candlestick Vision",
    desc: "Our vision model reads chart patterns across 500+ assets simultaneously, surfacing setups your eye would miss in milliseconds.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    desc: "CEX, DEX, cross-chain — every market in one place. Multi-region low-latency infra keeps data fresh wherever you are.",
  },
];

function FeatureCard({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col p-7 rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] hover:border-cyan-500/20 hover:shadow-[0_0_40px_rgba(34,211,238,0.06)] transition-all duration-300 cursor-default"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border border-cyan-500/20 bg-cyan-500/10 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all">
        <Icon size={18} className="text-cyan-400" />
      </div>

      <h3 className="font-bold text-[1rem] text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function FeatureCards() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section className="relative z-10 px-6 lg:px-12 py-24 max-w-[1200px] mx-auto">
      {/* Section header */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-14"
      >
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-4">
          Everything In Orbit
        </p>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
          One terminal to run the
          <br />
          entire alpha engine
        </h2>
        <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
          Stop stitching tools together. CryptoNeko unifies on-chain intelligence,
          AI analytics, and real-time signals into a single surface you'll
          actually want to use.
        </p>
      </motion.div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </div>
    </section>
  );
}
