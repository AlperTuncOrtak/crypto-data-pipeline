import { useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Brain, BarChart2, Wallet, ArrowRight, Activity, Cpu, Shield, Zap, RefreshCw, Layers
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

// ============================================================================
// COMPONENTS
// ============================================================================

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
        visible: { 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)",
          transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] } 
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 selection:text-white font-sans overflow-x-hidden">
      
      {/* ── BACKGROUND MESH / GLOW ── */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <motion.div style={{ y, opacity }} className="absolute w-[800px] h-[800px] bg-[var(--accent)]/5 rounded-full blur-[120px] top-[-200px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[100px]"></div>
      </div>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-6 flex items-center justify-between border-b border-white/[0.02] bg-[#050505]/50 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-gray-500 flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">
            CryptoNeko
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/pro" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Pro</Link>
          <Link to="/pricing" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Pricing</Link>
          {loading ? null : user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <main className="relative z-10 pt-40 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-32">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-sm font-medium text-gray-300 mb-8 backdrop-blur-md flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
            Intelligence powered by Deep Learning
          </motion.div>

          <motion.h1 
            initial="hidden" animate="visible" variants={fadeUp}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500"
          >
            Algorithmic <br /> Crypto Trading.
          </motion.h1>

          <motion.p 
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-lg md:text-xl text-gray-400 font-medium max-w-2xl leading-relaxed mb-10"
          >
            Advanced portfolio tracking, real-time AI sentiment analysis, and professional-grade algorithmic indicators in one sleek, unified terminal.
          </motion.p>

          <motion.div 
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button 
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 group"
            >
              Start Trading <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate("/pricing")}
              className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-colors"
            >
              View Pricing
            </button>
          </motion.div>
        </div>

        {/* ── BENTO BOX FEATURES ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-32">
          
          <FadeIn delay={0.1} className="md:col-span-2 relative group overflow-hidden rounded-[2rem] bg-[#0A0A0A] border border-white/5 p-8 md:p-12 min-h-[350px] flex flex-col justify-end">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--accent)]/20 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Brain className="text-white" size={24} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight text-white">AI Market Analysis</h3>
              <p className="text-gray-400 max-w-md text-base leading-relaxed">
                Our proprietary AI analyzes sentiment across millions of data points, giving you an edge with real-time Fear & Greed indices and predictive modeling.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="relative group overflow-hidden rounded-[2rem] bg-[#0A0A0A] border border-white/5 p-8 md:p-12 min-h-[350px] flex flex-col justify-end">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Activity className="text-white" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white">Real-Time Data</h3>
              <p className="text-gray-400 text-base leading-relaxed">
                Millisecond-precision websocket feeds straight to your dashboard. No delays, no refreshing.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.3} className="relative group overflow-hidden rounded-[2rem] bg-[#0A0A0A] border border-white/5 p-8 md:p-12 min-h-[350px] flex flex-col justify-end">
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Wallet className="text-white" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white">Portfolio Sync</h3>
              <p className="text-gray-400 text-base leading-relaxed">
                Automatically import trades via CSV or connect on-chain wallets for unified net worth tracking.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.4} className="md:col-span-2 relative group overflow-hidden rounded-[2rem] bg-[#0A0A0A] border border-white/5 p-8 md:p-12 min-h-[350px] flex flex-col justify-end">
             <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Cpu className="text-white" size={24} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight text-white">Algorithmic Edge</h3>
              <p className="text-gray-400 max-w-md text-base leading-relaxed">
                Utilize advanced quantitative metrics typically reserved for institutional trading desks, simplified into an elegant UI.
              </p>
            </div>
          </FadeIn>
        </div>

        {/* ── CALL TO ACTION ── */}
        <FadeIn delay={0.1}>
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-[#111] to-[#050505] border border-white/10 px-8 py-24 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[var(--accent)]/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <h2 className="relative z-10 text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
              Ready to trade smarter?
            </h2>
            <p className="relative z-10 text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Join elite traders who rely on CryptoNeko's intelligence layer to navigate the markets.
            </p>
            <button 
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="relative z-10 px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
              {user ? "Go to Dashboard" : "Create Free Account"}
            </button>
          </div>
        </FadeIn>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-[#050505] py-12 px-6 lg:px-12 relative z-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-black font-black text-xs">C</div>
            <span className="font-bold text-sm text-gray-300">CryptoNeko</span>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            © {new Date().getFullYear()} CryptoNeko. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link to="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
