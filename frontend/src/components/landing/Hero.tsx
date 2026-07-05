import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, delay: d, ease: [0.16, 1, 0.3, 1] },
  }),
};

interface HeroProps {
  isLoggedIn: boolean;
}

export default function Hero({ isLoggedIn }: HeroProps) {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 pt-36 pb-0 px-6 lg:px-12 flex flex-col items-center text-center">
      {/* Badge */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeUp}
        className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-sm font-semibold text-cyan-300 mb-8 backdrop-blur-sm"
      >
        <Sparkles size={14} className="text-cyan-400" />
        AI-Powered Crypto Intelligence · Deep Learning Core
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial="hidden"
        animate="visible"
        custom={0.15}
        variants={fadeUp}
        className="text-[clamp(2.8rem,8vw,6rem)] font-black tracking-tight leading-[1.05] text-white mb-6"
      >
        Trade Smarter,
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300">
          Not Harder
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial="hidden"
        animate="visible"
        custom={0.3}
        variants={fadeUp}
        className="max-w-2xl text-[1.05rem] md:text-lg text-slate-400 font-medium leading-relaxed mb-10"
      >
        Whale X-Ray intelligence, real-time AI sentiment analysis, and
        institutional-grade algorithmic signals — unified in one cinematic
        terminal.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={0.45}
        variants={fadeUp}
        className="flex flex-col sm:flex-row items-center gap-4 mb-0"
      >
        <button
          onClick={() => navigate(isLoggedIn ? "/dashboard" : "/login")}
          className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-cyan-400 text-[#020817] font-bold text-[0.95rem] hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(34,211,238,0.35)] cursor-pointer"
        >
          Start Free Right Now
          <ArrowRight
            size={17}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>

        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-white/10 bg-white/[0.04] text-white font-bold text-[0.95rem] hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm cursor-pointer"
        >
          View Pricing
        </button>
      </motion.div>
    </section>
  );
}
