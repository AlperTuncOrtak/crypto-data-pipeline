import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, delay: custom * 0.1, ease: [0.16, 1, 0.3, 1] } 
  })
};

export function Hero() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="relative z-10 pt-40 pb-20 px-6 lg:px-12 max-w-[1200px] mx-auto min-h-[90vh] flex flex-col justify-center">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#00d084] opacity-[0.03] blur-[120px] pointer-events-none" />

      <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16 relative z-10">
        
        {/* Top Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-[11px] font-bold text-slate-300 mb-8 tracking-widest uppercase flex items-center gap-2"
        >
          Web App
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          custom={0} initial="hidden" animate="visible" variants={fadeUp}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-6 text-white"
        >
          Agentic Trading with <br className="hidden md:block" />
          <span className="text-[#00d084]">Onchain Intelligence</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          custom={1} initial="hidden" animate="visible" variants={fadeUp}
          className="text-base md:text-lg text-slate-400 font-medium max-w-2xl leading-relaxed mb-10"
        >
          CryptoNeko is the most powerful trading tool for onchain investors. Analyze wallet flows, track key metrics, and trade the market with confidence.
        </motion.p>

        {/* Action Button */}
        <motion.div 
          custom={2} initial="hidden" animate="visible" variants={fadeUp}
        >
          <button 
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            className="px-8 py-3.5 rounded-lg bg-[#00d084] text-[#050505] font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Launch Web App
          </button>
        </motion.div>
      </div>
    </section>
  );
}

