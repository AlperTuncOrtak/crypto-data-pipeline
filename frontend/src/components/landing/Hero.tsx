import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: (custom: number) => ({ 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: custom * 0.15, ease: [0.16, 1, 0.3, 1] } 
  })
};

export function Hero() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="relative z-10 pt-40 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto min-h-[90vh] flex flex-col justify-center">
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
        
        {/* Top Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.03] text-xs md:text-sm font-semibold text-cyan-400 mb-8 backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]"></span>
          Intelligence powered by Deep Learning
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          custom={0} initial="hidden" animate="visible" variants={fadeUp}
          className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.05] mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-sm"
        >
          Algorithmic <br className="hidden md:block" /> Crypto Trading.
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          custom={1} initial="hidden" animate="visible" variants={fadeUp}
          className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl leading-relaxed mb-12"
        >
          Advanced portfolio tracking, real-time AI sentiment analysis, and professional-grade algorithmic indicators in one sleek, unified terminal.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          custom={2} initial="hidden" animate="visible" variants={fadeUp}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button 
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-[#020817] font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 group"
          >
            Start Trading <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => navigate("/pricing")}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/[0.03] border border-white/10 text-white font-bold text-base hover:bg-white/[0.08] backdrop-blur-md transition-colors"
          >
            View Pricing
          </button>
        </motion.div>
      </div>
    </section>
  );
}
