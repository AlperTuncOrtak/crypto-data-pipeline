import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Brain, Activity, Cpu, ArrowRight, Sparkles, Terminal, Command, Code
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
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
        hidden: { opacity: 0, y: 15 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] } 
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
  const { t } = useTranslation();

  const PARTNERS = ["BINANCE", "COINBASE", "KRAKEN", "OKX", "BYBIT", "BITGET", "KUCOIN"];

  const [orderbook, setOrderbook] = useState([
    { pair: "BTC-PERP", pnl: "+2.4", color: "green" },
    { pair: "ETH-PERP", pnl: "-1.2", color: "red" },
    { pair: "SOL-PERP", pnl: "+5.8", color: "green" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrderbook(prev => prev.map(o => {
        const val = parseFloat(o.pnl) + (Math.random() > 0.5 ? 0.2 : -0.2);
        return {
          ...o,
          pnl: (val > 0 ? "+" : "") + val.toFixed(1),
          color: val >= 0 ? "green" : "red"
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-[var(--bg-elevated)] selection:text-white font-sans overflow-x-hidden">
      
      {/* 🔴 HERO STRIPE (Raycast Signature) */}
      <div className="absolute top-0 left-0 right-0 h-1 z-50 bg-[linear-gradient(90deg,#ff3366,#ff9933,#ff3366)]"></div>
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none z-0"></div>

      {/* 🧭 HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 lg:px-12 py-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)] transition-all duration-300 mt-1">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-black font-black text-sm">
            C
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
            CryptoNeko
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/pro" className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors">Pro</Link>
          <Link to="/pricing" className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors">Pricing</Link>
          {loading ? null : user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-md bg-white text-black font-medium text-[13px] hover:bg-[#e8e8e8] transition-colors"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-md bg-white text-black font-medium text-[13px] hover:bg-[#e8e8e8] transition-colors"
            >
              Log in
            </button>
          )}
        </div>
      </header>

      {/* 🚀 HERO SECTION */}
      <main className="relative z-10 pt-32 pb-20 px-6 lg:px-12 max-w-[1200px] mx-auto">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-24">
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="px-3 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[12px] font-medium text-[var(--text-secondary)] mb-8 flex items-center gap-2"
          >
            <Command size={12} className="text-[var(--text-muted)]" />
            Intelligence powered by Deep Learning
          </motion.div>

          <motion.h1 
            initial="hidden" animate="visible" variants={fadeUp}
            className="text-5xl md:text-[64px] font-bold tracking-tight leading-[1.1] mb-6 text-[var(--text-primary)]"
          >
            Algorithmic <br /> Crypto Trading.
          </motion.h1>

          <motion.p 
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-base md:text-[17px] text-[var(--text-secondary)] font-normal max-w-2xl leading-relaxed mb-8"
          >
            Advanced portfolio tracking, real-time AI sentiment analysis, and professional-grade algorithmic indicators in one sleek, unified terminal.
          </motion.p>

          <motion.div 
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <button 
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="px-5 py-2.5 rounded-md bg-white text-black font-medium text-[14px] hover:bg-[#e8e8e8] transition-colors flex items-center gap-2 group"
            >
              Start Trading <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button 
              onClick={() => navigate("/pricing")}
              className="px-5 py-2.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-medium text-[14px] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              View Pricing
            </button>
          </motion.div>
        </div>

        {/* 🧱 BENTO BOX FEATURES (Raycast Spec) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-24">
          
          <FadeIn delay={0.1} className="lg:col-span-2 relative overflow-hidden rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border)] p-6 min-h-[300px] flex flex-col justify-between hover:bg-[var(--bg-elevated)] transition-colors">
            {/* UI Preview: AI Dashboard */}
            <div className="relative z-10 flex-1 mb-6 w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] overflow-hidden p-4 flex items-center justify-center">
              <div className="flex items-center gap-6 w-full max-w-sm">
                <div className="flex flex-col gap-2 w-full">
                  <div className="h-1.5 w-full bg-[var(--border)] rounded-sm overflow-hidden"><div className="h-full bg-[var(--text-primary)] w-[85%]"></div></div>
                  <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)]">
                    <span>EXTREME GREED</span>
                    <span>85/100</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-auto">
              <div className="w-8 h-8 rounded-md bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center mb-4">
                <Brain className="text-[var(--text-primary)]" size={16} />
              </div>
              <h3 className="text-[15px] font-semibold mb-1 text-[var(--text-primary)]">AI Market Analysis</h3>
              <p className="text-[13px] text-[var(--text-secondary)] max-w-md leading-relaxed">
                Our proprietary AI analyzes sentiment across millions of data points, giving you an edge with real-time Fear & Greed indices.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="relative overflow-hidden rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border)] p-6 min-h-[300px] flex flex-col justify-between hover:bg-[var(--bg-elevated)] transition-colors">
            {/* UI Preview: Orderbook/Sparkline */}
            <div className="relative z-10 flex-1 mb-6 w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] overflow-hidden p-3 flex flex-col justify-end gap-1.5">
              {orderbook.map((o, i) => (
                <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border)]`}>
                  <span className={`text-[10px] font-mono text-[var(--text-secondary)]`}>{o.pair}</span>
                  <span className={`text-[11px] font-mono ${o.color === 'green' ? 'text-emerald-400' : 'text-rose-400'}`}>{o.pnl}%</span>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-auto">
              <div className="w-8 h-8 rounded-md bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center mb-4">
                <Activity className="text-[var(--text-primary)]" size={16} />
              </div>
              <h3 className="text-[15px] font-semibold mb-1 text-[var(--text-primary)]">Real-Time Data</h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Millisecond-precision websocket feeds straight to your dashboard. No delays.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.3} className="lg:col-span-3 relative overflow-hidden rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border)] p-6 md:p-8 min-h-[300px] flex flex-col justify-between hover:bg-[var(--bg-elevated)] transition-colors">
            {/* UI Preview: Algo Code */}
            <div className="relative z-10 flex-1 mb-6 w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] overflow-hidden p-4 font-mono text-[11px] text-[var(--text-secondary)] leading-loose">
               <div><span className="text-[var(--text-primary)]">import</span> {' { MarketMaker } '} <span className="text-[var(--text-primary)]">from</span> '@crypto/algo';</div>
               <br/>
               <div><span className="text-[var(--text-primary)]">const</span> strategy = <span className="text-[var(--text-primary)]">new</span> MarketMaker({'{'}</div>
               <div className="pl-4">pair: 'BTC/USDT',</div>
               <div className="pl-4">riskFactor: 0.05,</div>
               <div className="pl-4">leverage: 10,</div>
               <div>{'}'});</div>
               <br/>
               <div>strategy.execute(); <span className="text-[var(--text-muted)]">// Running...</span></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="w-8 h-8 rounded-md bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center mb-4">
                  <Terminal className="text-[var(--text-primary)]" size={16} />
                </div>
                <h3 className="text-[15px] font-semibold mb-1 text-[var(--text-primary)]">Algorithmic Edge</h3>
                <p className="text-[13px] text-[var(--text-secondary)] max-w-xl leading-relaxed">
                  Utilize advanced quantitative metrics typically reserved for institutional trading desks, simplified into an elegant UI.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* 🎬 CALL TO ACTION */}
        <FadeIn delay={0.1}>
          <div className="relative overflow-hidden rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border)] px-8 py-12 text-center">
            <h2 className="relative z-10 text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
              Ready to trade smarter?
            </h2>
            <p className="relative z-10 text-[var(--text-secondary)] text-[14px] mb-6 max-w-xl mx-auto">
              Join elite traders who rely on CryptoNeko's intelligence layer to navigate the markets.
            </p>
            <button 
              onClick={() => navigate("/signup")}
              className="relative z-10 px-5 py-2.5 rounded-md bg-white text-black font-medium text-[14px] hover:bg-[#e8e8e8] transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </FadeIn>
      </main>

      {/* 🦶 FOOTER */}
      <footer className="border-t border-[var(--border)] py-8 mt-12 bg-[var(--bg-base)] relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white flex items-center justify-center text-black font-bold text-[10px]">C</div>
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">CryptoNeko</span>
          </div>
          <div className="text-[12px] text-[var(--text-muted)]">
            © {new Date().getFullYear()} CryptoNeko Analytics. All rights reserved.
          </div>
          <div className="flex gap-4 text-[12px] text-[var(--text-secondary)]">
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
