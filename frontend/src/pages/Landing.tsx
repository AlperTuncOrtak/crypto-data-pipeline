import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Brain, BarChart2, Wallet, ArrowRight, Activity, Cpu, Shield, Zap, RefreshCw, Layers, Sparkles, Briefcase, Hexagon, Circle, Triangle, Box, Fingerprint, Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThreeDHero } from "../components/ThreeDHero";
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

function FadeIn({ children, delay = 0, className = "", whileHover }: { children: React.ReactNode, delay?: number, className?: string, whileHover?: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      whileHover={whileHover}
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
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0.5, 0.8]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.1], ["10px", "20px"]);
  const { t } = useTranslation();

  const PARTNERS = [
    { name: "BINANCE", img: "/logos/binance.png" },
    { name: "COINBASE", img: "/logos/coinbase.png" },
    { name: "KRAKEN", img: "/logos/kraken.png" },
    { name: "OKX", img: "/logos/okx.png" },
    { name: "BYBIT", img: "/logos/bybit.png" },
    { name: "BITGET", img: "/logos/bitget.png" },
    { name: "KUCOIN", img: "/logos/kucoin.png" },
    { name: "METAMASK", img: "/logos/metamask.svg" },
    { name: "TRUST WALLET", img: "/logos/trustwallet.png" }
  ];

  // Live Simulation State
  const [fearGreed, setFearGreed] = useState(76);
  const [balance, setBalance] = useState(124592.00);
  const [orderbook, setOrderbook] = useState([
    { pair: "BTC-PERP", pnl: "+2.4", color: "green" },
    { pair: "ETH-PERP", pnl: "-1.2", color: "red" },
    { pair: "SOL-PERP", pnl: "+5.8", color: "green" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFearGreed(prev => Math.max(10, Math.min(90, prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3))));
      setBalance(prev => prev + (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 50));
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
    <div className="min-h-screen bg-[#0a0b0d] text-white selection:bg-[#533afd] selection:text-white font-sans overflow-x-hidden">
      
      {/* ── BACKGROUND AURORA MESH ── */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40"><div className="w-[800px] h-[300px] bg-[#533afd] blur-[150px] rounded-[100%] opacity-30 absolute -top-[100px] left-[10%]"></div><div className="w-[600px] h-[250px] bg-[#f96bee] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div></div>

      {/* ── 3D HERO CANVAS ── */}
      {/* <ThreeDHero /> */}

      {/* ── HEADER ── */}
      <motion.header 
        style={{ opacity: headerOpacity, backdropFilter: `blur(20px)` }}
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between border-b border-white/[0.05] bg-[#0a0b0d]/50 transition-all duration-300"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }} 
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-gray-500 flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            C
          </motion.div>
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
      </motion.header>

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
            className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500"
          >
            Algorithmic <br /> Crypto Trading.
          </motion.h1>

          <motion.p 
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-base md:text-lg text-gray-400 font-medium max-w-2xl leading-relaxed mb-8"
          >
            Advanced portfolio tracking, real-time AI sentiment analysis, and professional-grade algorithmic indicators in one sleek, unified terminal.
          </motion.p>

          <motion.div 
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button 
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="px-6 py-3 rounded-full bg-white text-black font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 group"
            >
              Start Trading <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate("/pricing")}
              className="px-6 py-3 rounded-full bg-[#16181c] border border-[#273951]/50 text-white font-bold text-base hover:bg-white/10 transition-colors"
            >
              View Pricing
            </button>
          </motion.div>
        </div>

        {/* ── INFINITE MARQUEE ── */}
        <div className="w-full overflow-hidden mb-24 py-8 border-y border-white/5 relative bg-white/[0.01]">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0b0d] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0b0d] to-transparent z-10 pointer-events-none"></div>
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-16 whitespace-nowrap"
            style={{ width: "max-content" }}
          >
            {[...PARTNERS, ...PARTNERS].map((partner, i) => {
              return (
                <div key={i} className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-all duration-300 cursor-default hover:scale-105">
                  <img src={partner.img} alt={partner.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 p-1 object-contain shadow-2xl" />
                  <span className="text-xl md:text-2xl font-black tracking-widest text-white uppercase" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {partner.name}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* ── BENTO BOX FEATURES (gettrade.ai style) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-24">
          
          <FadeIn delay={0.1} whileHover={{ scale: 0.98, transition: { type: "spring", stiffness: 400, damping: 25 } }} className="md:col-span-2 relative group overflow-hidden rounded-[32px] bg-[#16181c] border border-[#273951]/50 p-6 md:p-8 min-h-[350px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {/* UI Preview: AI Dashboard */}
            <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-[#273951]/50 bg-[#0a0b0d]/50 overflow-hidden group-hover:border-[#273951] transition-colors p-6 shadow-2xl flex items-center justify-center">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent)]/30 rounded-full blur-[50px] pointer-events-none"></div>
              <div className="flex items-center gap-8 w-full max-w-sm">
                <div className="relative w-32 h-32 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_var(--accent-soft)]">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--accent)" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * fearGreed / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{fearGreed}</span>
                    <span className="text-[10px] text-[var(--accent)] font-bold tracking-widest uppercase">{fearGreed > 75 ? "Extr. Greed" : fearGreed > 55 ? "Greed" : fearGreed > 45 ? "Neutral" : "Fear"}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div style={{ width: `${Math.min(100, fearGreed + 10)}%` }} className="h-full bg-green-500 transition-all duration-1000"></div></div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div style={{ width: `${fearGreed}%` }} className="h-full bg-[var(--accent)] transition-all duration-1000"></div></div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div style={{ width: `${Math.max(0, fearGreed - 20)}%` }} className="h-full bg-red-500 transition-all duration-1000"></div></div>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-auto">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-5">
                <Brain className="text-[var(--accent)]" size={20} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight text-white">AI Market Analysis</h3>
              <p className="text-gray-400 max-w-md text-sm leading-relaxed">
                Our proprietary AI analyzes sentiment across millions of data points, giving you an edge with real-time Fear & Greed indices and predictive modeling.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} whileHover={{ scale: 0.98, transition: { type: "spring", stiffness: 400, damping: 25 } }} className="relative group overflow-hidden rounded-[32px] bg-[#16181c] border border-[#273951]/50 p-6 md:p-8 min-h-[350px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {/* UI Preview: Orderbook/Sparkline */}
            <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-[#273951]/50 bg-[#0a0b0d]/50 overflow-hidden group-hover:border-[#273951] transition-colors p-4 shadow-2xl flex flex-col justify-end gap-2">
              {orderbook.map((o, i) => (
                <div key={i} className={`flex justify-between items-center px-2 py-1.5 rounded-md bg-${o.color}-500/10 border border-${o.color}-500/20 transition-all duration-300`}>
                  <span className={`text-[10px] font-mono text-${o.color}-400`}>{o.pair}</span>
                  <span className={`text-xs font-bold text-${o.color}-400`}>{o.pnl}%</span>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-auto">
              <div className="w-10 h-10 rounded-xl bg-[#16181c] border border-[#273951]/50 flex items-center justify-center mb-5">
                <Activity className="text-gray-300" size={20} />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight text-white">Real-Time Data</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Millisecond-precision websocket feeds straight to your dashboard. No delays.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.3} whileHover={{ scale: 0.98, transition: { type: "spring", stiffness: 400, damping: 25 } }} className="relative group overflow-hidden rounded-[32px] bg-[#16181c] border border-[#273951]/50 p-6 md:p-8 min-h-[350px] flex flex-col justify-between">
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {/* UI Preview: Wallet Sync */}
            <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-[#273951]/50 bg-[#0a0b0d]/50 overflow-hidden group-hover:border-[#273951] transition-colors p-5 shadow-2xl flex flex-col items-center justify-center relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
               <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", delay: 0.4 }} className="w-12 h-12 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center mb-3 z-10 relative">
                 <Wallet className="text-[var(--accent)]" size={20} />
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#19191c]"></div>
               </motion.div>
               <div className="text-lg font-black text-white z-10 font-mono transition-all duration-500">${balance.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
               <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="text-xs font-bold text-gray-500 z-10 mt-1 uppercase tracking-widest">Total Balance</motion.div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="w-10 h-10 rounded-xl bg-[#16181c] border border-[#273951]/50 flex items-center justify-center mb-5">
                <Wallet className="text-gray-300" size={20} />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight text-white">Portfolio Sync</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Automatically import trades via CSV or connect on-chain wallets for tracking.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.4} whileHover={{ scale: 0.98, transition: { type: "spring", stiffness: 400, damping: 25 } }} className="md:col-span-2 relative group overflow-hidden rounded-[32px] bg-[#16181c] border border-[#273951]/50 p-6 md:p-8 min-h-[350px] flex flex-col justify-between">
             <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {/* UI Preview: Algo Code */}
            <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-white/5 bg-[#0a0a0c] overflow-hidden group-hover:border-white/10 transition-colors p-6 shadow-2xl flex flex-col justify-center font-mono text-xs md:text-sm text-gray-500 relative">
               <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-[60px] pointer-events-none"></div>
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-purple-400">import <span className="text-white">{' { MarketMaker } '}</span> from <span className="text-green-400">'@crypto/algo'</span>;</motion.div>
               <br/>
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.8 }}><span className="text-blue-400">const</span> <span className="text-white">strategy</span> = <span className="text-blue-400">new</span> <span className="text-yellow-200">MarketMaker</span>({'{'}</motion.div>
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.2 }} className="pl-4">pair: <span className="text-green-400">'BTC/USDT'</span>,</motion.div>
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.6 }} className="pl-4">riskFactor: <span className="text-orange-400">0.05</span>,</motion.div>
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.0 }} className="pl-4">leverage: <span className="text-orange-400">10</span>,</motion.div>
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.4 }}>{'}'});</motion.div>
               <br/>
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.8 }}><span className="text-white">strategy</span>.<span className="text-yellow-200">execute</span>(); <span className="text-green-500 font-bold ml-2 animate-pulse">// Running...</span></motion.div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-5">
                <Cpu className="text-[var(--accent)]" size={20} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight text-white">Algorithmic Edge</h3>
              <p className="text-gray-400 max-w-md text-sm leading-relaxed">
                Utilize advanced quantitative metrics typically reserved for institutional trading desks, simplified into an elegant UI.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.5} whileHover={{ scale: 0.98, transition: { type: "spring", stiffness: 400, damping: 25 } }} className="md:col-span-3 relative group overflow-hidden rounded-[32px] bg-[#16181c] border border-[var(--accent)]/30 p-6 md:p-10 min-h-[350px] flex flex-col justify-between">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--accent)]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[var(--accent)]/20 transition-colors duration-700"></div>
            
            {/* UI Preview: Orbs */}
            <div className="relative z-10 flex-1 mb-8 w-full rounded-2xl border border-[#273951]/50 bg-[#0a0b0d]/50 overflow-hidden group-hover:border-[#273951] transition-colors shadow-2xl flex items-center justify-center p-8">
               <div className="relative w-full h-full min-h-[160px] flex items-center justify-center gap-6">
                 {/* Orb 1 */}
                 <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0 }} className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.4)] relative" style={{ background: "radial-gradient(circle at 30% 30%, #e11d48dd, #e11d4844, rgba(0,0,0,0.8))" }}>
                   <div className="absolute top-[10%] left-[15%] w-[40%] h-[30%] rounded-[100%] bg-white/20 rotate-[-45deg] blur-[2px] pointer-events-none" />
                   <span className="text-white font-black text-xs">Memecoins</span>
                 </motion.div>
                 {/* Orb 2 */}
                 <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }} className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.5)] relative -mt-8" style={{ background: "radial-gradient(circle at 30% 30%, #7c3aeddd, #7c3aed44, rgba(0,0,0,0.8))" }}>
                   <div className="absolute top-[10%] left-[15%] w-[40%] h-[30%] rounded-[100%] bg-white/20 rotate-[-45deg] blur-[2px] pointer-events-none" />
                   <span className="text-white font-black text-sm">AI</span>
                 </motion.div>
                 {/* Orb 3 */}
                 <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }} className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] relative" style={{ background: "radial-gradient(circle at 30% 30%, #10b981dd, #10b98144, rgba(0,0,0,0.8))" }}>
                   <div className="absolute top-[10%] left-[15%] w-[40%] h-[30%] rounded-[100%] bg-white/20 rotate-[-45deg] blur-[2px] pointer-events-none" />
                   <span className="text-white font-black text-[10px]">RWA</span>
                 </motion.div>
               </div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-4">
                  <Brain className="text-[var(--accent)]" size={20} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight text-white">AI Narrative Map <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-[var(--accent)] text-[#111]">New</span></h3>
                <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
                  Stop chasing green candles. Our AI visually maps where the market liquidity and hype are flowing in real-time. Follow the narratives before they break out.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ── CALL TO ACTION ── */}
        <FadeIn delay={0.1}>
          <div className="relative overflow-hidden rounded-[32px] bg-[#16181c] border border-[#273951]/50 shadow-[inset_0_0_80px_rgba(39,57,81,0.2)] px-8 py-16 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[var(--accent)]/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <h2 className="relative z-10 text-3xl md:text-4xl font-black tracking-tight text-white mb-4">
              Ready to trade smarter?
            </h2>
            <p className="relative z-10 text-gray-400 text-base mb-8 max-w-xl mx-auto">
              Join elite traders who rely on CryptoNeko's intelligence layer to navigate the markets.
            </p>
            <button 
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="relative z-10 px-8 py-4 rounded-full bg-white text-black font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
              {user ? "Go to Dashboard" : "Create Free Account"}
            </button>
          </div>
        </FadeIn>
      </main>

      

    </div>
  );
}



