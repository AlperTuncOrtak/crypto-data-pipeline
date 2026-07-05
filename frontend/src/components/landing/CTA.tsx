import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function CTA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 30, filter: "blur(8px)" }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="px-6 lg:px-12 max-w-[1400px] mx-auto pb-32"
    >
      <div className="relative overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl px-8 py-20 text-center shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <h2 className="relative z-10 text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
          Ready to trade smarter?
        </h2>
        
        <p className="relative z-10 text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Join elite traders who rely on CryptoNeko's intelligence layer to navigate the markets with precision and speed.
        </p>
        
        <button 
          onClick={() => navigate(user ? "/dashboard" : "/login")}
          className="relative z-10 px-10 py-5 rounded-full bg-cyan-400 text-[#020817] font-bold text-lg hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(34,211,238,0.3)]"
        >
          {user ? "Go to Dashboard" : "Create Free Account"}
        </button>
      </div>
    </motion.section>
  );
}
