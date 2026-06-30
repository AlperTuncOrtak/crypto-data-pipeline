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
    <div className="min-h-screen bg-[#0d0d0f] text-white selection:bg-white/20 selection:text-white font-sans overflow-x-hidden">
      
      {/* ── BACKGROUND MESH / GLOW ── */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <motion.div style={{ y, opacity }} className="absolute w-[800px] h-[800px] bg-[var(--accent)]/5 rounded-full blur-[120px] top-[-200px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[#0d0d0f]/60 backdrop-blur-[100px]"></div>
      </div>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-6 flex items-center justify-between border-b border-white/[0.02] bg-[#0d0d0f]/50 backdrop-blur-md">
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

        {/* ── BENTO BOX FEATURES (gettrade.ai style) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-32">
          
          <FadeIn delay={0.1} className="md:col-span-2 relative group overflow-hidden rounded-[2rem] bg-[#19191c] border border-white/5 p-8 md:p-12 min-h-[400px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {/* UI Preview: AI Dashboard */}
            <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-white/5 bg-black/40 overflow-hidden group-hover:border-white/10 transition-colors p-6 shadow-2xl flex items-center justify-center">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent)]/30 rounded-full blur-[50px] pointer-events-none"></div>
              <div className="flex items-center gap-8 w-full max-w-sm">
                <div className="relative w-32 h-32 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_var(--accent-soft)]">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--accent)" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="60" strokeLinecap="round" className="animate-pulse" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">76</span>
                    <span className="text-[10px] text-[var(--accent)] font-bold tracking-widest uppercase">Greed</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[80%]"></div></div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[var(--accent)] w-[60%]"></div></div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500 w-[30%]"></div></div>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-auto">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-5">
                <Brain className="text-[var(--accent)]" size={20} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight text-white">AI Market Analysis</h3>
              <p className="text-gray-400 max-w-md text-base leading-relaxed">
                Our proprietary AI analyzes sentiment across millions of data points, giving you an edge with real-time Fear & Greed indices and predictive modeling.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="relative group overflow-hidden rounded-[2rem] bg-[#19191c] border border-white/5 p-8 md:p-12 min-h-[400px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {/* UI Preview: Orderbook/Sparkline */}
            <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-white/5 bg-black/40 overflow-hidden group-hover:border-white/10 transition-colors p-4 shadow-2xl flex flex-col justify-end gap-2">
               <div className="flex justify-between items-center px-2 py-1.5 rounded-md bg-green-500/10 border border-green-500/20">
                 <span className="text-[10px] font-mono text-green-400">BTC-PERP</span>
                 <span className="text-xs font-bold text-green-400">+2.4%</span>
               </div>
               <div className="flex justify-between items-center px-2 py-1.5 rounded-md bg-red-500/10 border border-red-500/20">
                 <span className="text-[10px] font-mono text-red-400">ETH-PERP</span>
                 <span className="text-xs font-bold text-red-400">-1.2%</span>
               </div>
               <div className="flex justify-between items-center px-2 py-1.5 rounded-md bg-green-500/10 border border-green-500/20">
                 <span className="text-[10px] font-mono text-green-400">SOL-PERP</span>
                 <span className="text-xs font-bold text-green-400">+5.8%</span>
               </div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                <Activity className="text-gray-300" size={20} />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white">Real-Time Data</h3>
              <p className="text-gray-400 text-base leading-relaxed">
                Millisecond-precision websocket feeds straight to your dashboard. No delays.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.3} className="relative group overflow-hidden rounded-[2rem] bg-[#19191c] border border-white/5 p-8 md:p-12 min-h-[400px] flex flex-col justify-between">
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {/* UI Preview: Wallet Sync */}
            <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-white/5 bg-black/40 overflow-hidden group-hover:border-white/10 transition-colors p-5 shadow-2xl flex flex-col items-center justify-center relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
               <div className="w-16 h-16 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center mb-4 z-10 relative">
                 <Wallet className="text-[var(--accent)]" size={24} />
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#19191c]"></div>
               </div>
               <div className="text-xl font-black text-white z-10 font-mono">$124,592.00</div>
               <div className="text-xs font-bold text-gray-500 z-10 mt-1 uppercase tracking-widest">Total Balance</div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                <Wallet className="text-gray-300" size={20} />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white">Portfolio Sync</h3>
              <p className="text-gray-400 text-base leading-relaxed">
                Automatically import trades via CSV or connect on-chain wallets for tracking.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.4} className="md:col-span-2 relative group overflow-hidden rounded-[2rem] bg-[#19191c] border border-white/5 p-8 md:p-12 min-h-[400px] flex flex-col justify-between">
             <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {/* UI Preview: Algo Code */}
            <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-white/5 bg-[#0a0a0c] overflow-hidden group-hover:border-white/10 transition-colors p-6 shadow-2xl flex flex-col justify-center font-mono text-xs md:text-sm text-gray-500 relative">
               <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-[60px] pointer-events-none"></div>
               <div className="text-purple-400">import <span className="text-white">{' { MarketMaker } '}</span> from <span className="text-green-400">'@crypto/algo'</span>;</div>
               <br/>
               <div><span className="text-blue-400">const</span> <span className="text-white">strategy</span> = <span className="text-blue-400">new</span> <span className="text-yellow-200">MarketMaker</span>({'{'}</div>
               <div className="pl-4">pair: <span className="text-green-400">'BTC/USDT'</span>,</div>
               <div className="pl-4">riskFactor: <span className="text-orange-400">0.05</span>,</div>
               <div className="pl-4">leverage: <span className="text-orange-400">10</span>,</div>
               <div>{'}'});</div>
               <br/>
               <div><span className="text-white">strategy</span>.<span className="text-yellow-200">execute</span>(); <span className="text-green-500 font-bold ml-2 animate-pulse">// Running...</span></div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-5">
                <Cpu className="text-[var(--accent)]" size={20} />
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
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-[#19191c] to-[#0d0d0f] border border-white/10 px-8 py-24 text-center">
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
      <footer className="border-t border-white/5 bg-[#0d0d0f] py-12 px-6 lg:px-12 relative z-10">
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
