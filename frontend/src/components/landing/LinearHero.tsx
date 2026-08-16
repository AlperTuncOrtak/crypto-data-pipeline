import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function LinearHero({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="relative z-10 pt-40 pb-20 flex flex-col items-center justify-center min-h-[80vh] overflow-hidden bg-[var(--bg-base)]">
      
      {/* Premium Vantablack / Ethereal Glass Background Mesh */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-white/[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.03] blur-[100px] rounded-full" />
        {/* CSS Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Hero Content (Centered) */}
      <div className="flex flex-col items-center text-center max-w-[900px] mx-auto px-6 relative z-20">
        
        {/* Massive Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="text-5xl sm:text-7xl md:text-[6rem] font-black tracking-tighter leading-[1.05] text-[var(--text-main)] mb-6"
        >
          Algorithmic Crypto <br className="hidden md:block" /> Trading.
        </motion.h1>

        {/* Subtext */}
        <motion.p 
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          className="text-lg md:text-xl text-[var(--text-muted)] leading-relaxed max-w-2xl mx-auto mb-10"
        >
          Advanced portfolio tracking, real-time AI sentiment analysis, and professional-grade indicators inside a terminal that moves as fast as you do.
        </motion.p>

        {/* Haptic CTAs with Double-Bezel and Button-in-Button */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          {/* Primary CTA (Double Bezel + Magnetic Physics) */}
          <div className="p-1 rounded-full bg-white/5 border border-white/10 shrink-0">
            <button 
              onClick={() => {
                if (user) navigate("/dashboard");
                else if (onAuthOpen) onAuthOpen("login");
              }}
              className="group relative h-12 flex items-center gap-4 pl-6 pr-1.5 rounded-full bg-white text-black font-semibold text-sm transition-all duration-500 ease-spring active:scale-[0.98] hover:bg-gray-100"
            >
              Start building
              {/* Button-in-Button trailing icon */}
              <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-500 ease-spring group-hover:scale-[1.05] group-hover:translate-x-0.5">
                <ArrowRight size={16} className="text-black" />
              </div>
            </button>
          </div>
        </motion.div>
      </div>

    </section>
  );
}


