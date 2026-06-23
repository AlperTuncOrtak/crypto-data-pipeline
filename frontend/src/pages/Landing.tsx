// ============================================================
// pages/Landing.tsx — Linear.app Inspired Minimalist V4
// ============================================================
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useMarketStats } from "../hooks/useMarket";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Brain,
  BarChart2,
  Wallet,
  Bell,
  ArrowRight,
  ChevronRight,
  Activity,
  LineChart,
  Shield,
  Zap
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ─── FLOATING COINS (Orbital layout) ──────────────────────────
const FLOATING_COINS = [
  { sym: "BTC",  name: "Bitcoin",  price: "$107,412", change: "+2.4%", up: true,  img: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",    top: "15%", left: "10%",  delay: 0,   dur: 7.0, size: 48 },
  { sym: "ETH",  name: "Ethereum", price: "$3,891",   change: "+1.8%", up: true,  img: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",  top: "60%", left: "5%",   delay: 1.5, dur: 8.4, size: 44 },
  { sym: "SOL",  name: "Solana",   price: "$182",     change: "-0.9%", up: false, img: "https://assets.coingecko.com/coins/images/4128/small/solana.png",   top: "20%", right: "8%", delay: 0.8, dur: 6.4, size: 42 },
  { sym: "BNB",  name: "BNB",      price: "$724",     change: "+3.2%", up: true,  img: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", top: "50%", right: "5%", delay: 2.2, dur: 7.8, size: 38 },
  { sym: "XRP",  name: "XRP",      price: "$2.18",    change: "+5.1%", up: true,  img: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", top: "80%", left: "20%", delay: 1.1, dur: 9.2, size: 36 },
  { sym: "DOGE", name: "Dogecoin", price: "$0.38",    change: "+7.3%", up: true,  img: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",    top: "75%", right: "20%", delay: 3.0, dur: 6.6, size: 40 },
];

function FloatingCoinCard({ sym, name, price, change, up, img, top, left, right, delay, dur, size }: any) {
  const [hovered, setHovered] = useState(false);
  const accentColor = up ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)";

  return (
    <div
      className="hidden md:block absolute z-20 cursor-pointer pointer-events-auto"
      style={{ top, left: left ?? "auto", right: right ?? "auto" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <style>{`
        @keyframes orbit-float-${sym} {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-${15 + delay * 2}px) rotate(${delay % 2 === 0 ? 2 : -2}deg); }
        }
        .orbit-wrap-${sym} { animation: orbit-float-${sym} ${dur}s ease-in-out ${delay}s infinite; }
      `}</style>

      <div className={`orbit-wrap-${sym} relative`}>
        {/* Coin Icon Orb */}
        <div 
          className="rounded-full overflow-hidden flex items-center justify-center bg-[#0b0b12]/80"
          style={{
            width: size, height: size,
            border: `1px solid ${hovered ? accentColor : "rgba(255,255,255,0.07)"}`,
            boxShadow: hovered ? `0 0 24px ${up ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` : "0 4px 12px rgba(0,0,0,0.5)",
            transform: hovered ? "scale(1.1)" : "scale(1)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            backdropFilter: "blur(8px)"
          }}
        >
          <img src={img} alt={sym} className="w-[85%] h-[85%] object-contain opacity-80" />
        </div>

        {/* Hover Data Card - Linear Style Minimal */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: right ? "auto" : "calc(100% + 16px)",
            right: right ? "calc(100% + 16px)" : "auto",
            transform: `translateY(-50%) ${hovered ? "scale(1)" : "scale(0.95)"}`,
            opacity: hovered ? 1 : 0,
            background: "rgba(18, 17, 26, 0.85)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
            padding: "12px 16px",
            minWidth: "160px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white tracking-tight">{sym}</span>
            <span className="text-xs text-gray-500">{name}</span>
          </div>
          <div className="text-lg font-mono font-bold text-white mb-1">{price}</div>
          <div className={`text-xs font-mono font-semibold ${up ? "text-green-500" : "text-red-500"}`}>
            {change}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COUNTER ─────────────────────────────────────────────────────
function Counter({ to, suffix = "", prefix = "" }: { to: number, suffix?: string, prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / 1500, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── MAIN LANDING PAGE ───────────────────────────────────────────
export default function Landing({ onAuthOpen }: { onAuthOpen: (mode: string) => void }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: stats } = useMarketStats();
  const { t } = useTranslation();

  const { scrollY } = useScroll();
  const previewY = useTransform(scrollY, [0, 500], [0, -50]);
  const previewRotate = useTransform(scrollY, [0, 500], [2, 0]);
  const previewScale = useTransform(scrollY, [0, 500], [0.95, 1]);

  let coinsTracked = 2500;
  let coinsStr = "2,500+";
  if (stats?.coin_count) {
    if (stats.coin_count >= 1000) {
      coinsTracked = Math.floor(stats.coin_count / 1000) * 1000;
      coinsStr = `${Math.floor(coinsTracked / 1000)},000+`;
    } else {
      coinsTracked = stats.coin_count;
      coinsStr = `${coinsTracked}+`;
    }
  }

  // Linear-style Bento Grid Features
  const features = [
    {
      id: "ai",
      title: "AI Technical Analysis",
      desc: "Our neural network analyzes 150+ indicators instantly. Get risk scores, correlation matrices, and automated portfolio rebalancing suggestions.",
      icon: Brain,
      colSpan: "col-span-12 md:col-span-8",
      bg: "bg-white/[0.02]",
      img: (
        <div className="absolute right-0 bottom-0 w-2/3 h-[85%] border-t border-l border-white/[0.07] bg-[#12111a] rounded-tl-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="h-8 border-b border-white/[0.05] flex items-center px-4 gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
          <div className="flex-1 p-6 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(94,106,210,0.15),transparent_70%)]" />
            <div className="flex items-end gap-4 h-full pt-4 relative z-10 opacity-70">
              <div className="w-8 bg-indigo-500/20 rounded-t-sm h-[40%]" />
              <div className="w-8 bg-indigo-500/40 rounded-t-sm h-[60%]" />
              <div className="w-8 bg-indigo-500/60 rounded-t-sm h-[30%]" />
              <div className="w-8 bg-indigo-500/80 rounded-t-sm h-[80%]" />
              <div className="w-8 bg-indigo-500 rounded-t-sm h-[100%]" />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "portfolio",
      title: "Portfolio Tracker",
      desc: "Sync via APIs or CSV. FIFO tax calculations built-in.",
      icon: Wallet,
      colSpan: "col-span-12 md:col-span-4",
      bg: "bg-white/[0.02]",
      img: (
        <div className="absolute -right-4 -bottom-4 w-[120%] h-[120%] opacity-20 bg-[radial-gradient(circle_at_bottom_right,var(--accent),transparent_60%)]" />
      )
    },
    {
      id: "screener",
      title: "Market Screener",
      desc: "Filter 10,000+ coins by RSI, MACD, Volume Anomalies, and more.",
      icon: Activity,
      colSpan: "col-span-12 md:col-span-4",
      bg: "bg-white/[0.02]",
    },
    {
      id: "alerts",
      title: "Custom Alerts",
      desc: "Never miss a move. Get notified via Telegram, Email, or Webhooks when price or volume spikes.",
      icon: Bell,
      colSpan: "col-span-12 md:col-span-8",
      bg: "bg-white/[0.02]",
      img: (
        <div className="absolute right-8 bottom-0 w-1/2 h-[70%] border-t border-l border-r border-white/[0.07] bg-[#161522] rounded-t-xl shadow-2xl p-4 flex flex-col gap-3">
          <div className="h-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center px-3 gap-3">
            <Bell size={14} className="text-indigo-400" /> <div className="h-2 w-24 bg-white/10 rounded-full" />
          </div>
          <div className="h-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center px-3 gap-3">
            <Zap size={14} className="text-amber-400" /> <div className="h-2 w-32 bg-white/10 rounded-full" />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--bg-base)] text-white mesh-hero">
      
      {/* ─── FLOATING COINS ORBIT ─────────────────────────────────── */}
      <div className="absolute inset-0 max-w-[1440px] mx-auto pointer-events-none">
        {FLOATING_COINS.map((c) => (
          <FloatingCoinCard key={c.sym} {...c} />
        ))}
      </div>

      {/* ─── HERO SECTION ─────────────────────────────────────────── */}
      <div className="relative z-10 pt-[120px] pb-16 px-6 max-w-[1200px] mx-auto text-center flex flex-col items-center">
        
        {/* Subtle Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-gray-300 mb-8 cursor-default"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          {t('landing.tracking_live')} <span className="text-white font-bold">{coinsStr}</span> {t('landing.coins')}
        </motion.div>

        {/* Huge Linear Typography */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-8xl font-black tracking-[-0.04em] leading-[1.05] mb-6"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.5) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          Meet the new standard <br className="hidden md:block" /> for crypto data.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-gray-400 max-w-[600px] mx-auto mb-10 tracking-tight"
        >
          {t('landing.hero_desc', "A professional suite for portfolio tracking, AI-powered analysis, and real-time market screening. Engineered for speed.")}
        </motion.p>

        {/* Linear Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          {isLoggedIn ? (
            <button 
              onClick={() => navigate("/dashboard")}
              className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all shadow-[0_0_24px_rgba(255,255,255,0.15)]"
            >
              {t('landing.go_dashboard')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <>
              <button 
                onClick={() => onAuthOpen("register")}
                className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-b from-[#6e7ae2] to-[var(--accent)] text-white shadow-[0_2px_12px_rgba(94,106,210,0.3)] hover:shadow-[0_4px_24px_rgba(94,106,210,0.5)] border border-[var(--accent-border)] hover:border-indigo-400 transition-all w-full sm:w-auto"
              >
                {t('auth.start_free')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => onAuthOpen("login")}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white/[0.03] text-gray-300 border border-white/[0.08] hover:bg-white/[0.06] hover:text-white transition-all w-full sm:w-auto"
              >
                {t('auth.login')}
              </button>
            </>
          )}
        </motion.div>
      </div>

      {/* ─── PRODUCT PREVIEW MOCKUP ───────────────────────────────── */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 mb-32 perspective-1000">
        <motion.div
          style={{ y: previewY, rotateX: previewRotate, scale: previewScale }}
          className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#12111a] rounded-2xl md:rounded-3xl border border-white/[0.08] shadow-[0_32px_128px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)_inset] overflow-hidden flex flex-col relative"
        >
          {/* Mockup Header */}
          <div className="h-12 border-b border-white/[0.05] bg-[#0b0b12]/50 backdrop-blur-md flex items-center px-4 gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-white/[0.1]" />
              <div className="w-3 h-3 rounded-full bg-white/[0.1]" />
              <div className="w-3 h-3 rounded-full bg-white/[0.1]" />
            </div>
            <div className="h-6 w-48 bg-white/[0.03] rounded-md border border-white/[0.02]" />
          </div>
          {/* Mockup Body Content - Abstract layout */}
          <div className="flex-1 p-6 md:p-8 flex gap-6">
            <div className="w-1/3 flex flex-col gap-4">
              <div className="h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-white/[0.04] rounded-xl" />
              <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-xl" />
            </div>
            <div className="w-2/3 flex flex-col gap-4">
              <div className="h-1/2 bg-white/[0.02] border border-white/[0.04] rounded-xl relative overflow-hidden">
                {/* Abstract Chart Line */}
                <svg className="absolute bottom-0 w-full h-[80%] opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,100 L0,50 Q25,20 50,60 T100,30 L100,100 Z" fill="url(#gradient)" />
                  <path d="M0,50 Q25,20 50,60 T100,30" fill="none" stroke="var(--accent)" strokeWidth="2" />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="h-1/2 flex gap-4">
                <div className="w-1/2 bg-white/[0.02] border border-white/[0.04] rounded-xl" />
                <div className="w-1/2 bg-white/[0.02] border border-white/[0.04] rounded-xl" />
              </div>
            </div>
          </div>
          
          {/* Glow reflection on the mockup itself */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none" />
        </motion.div>
      </div>


      {/* ─── BENTO GRID FEATURES ──────────────────────────────────── */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pb-40">
        <div className="mb-12 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Built for speed. <br className="hidden md:block" /> Designed for power.
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl">
            Everything you need to track, analyze, and automate your crypto portfolio in one unified workspace.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {features.map((f, i) => (
            <div 
              key={f.id}
              className={`glass-card ${f.colSpan} p-8 md:p-10 min-h-[320px] relative overflow-hidden group`}
            >
              {/* Radial Hover Glow (CSS effect applied globally usually, simulated here) */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_800px_at_50%_0%,rgba(94,106,210,0.06),transparent)]" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6 text-indigo-400">
                  <f.icon size={20} />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[85%]">{f.desc}</p>
              </div>

              {/* Decorative Image/Element */}
              {f.img}
            </div>
          ))}
        </div>
      </div>

      {/* ─── BOTTOM CTA ───────────────────────────────────────────── */}
      <div className="relative z-10 border-t border-white/[0.05] bg-[#0b0b12]">
        <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center mb-8">
            <Shield size={28} className="text-indigo-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to take control?</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl">
            Join thousands of traders who have upgraded their workflow. Free to start, cancel anytime.
          </p>
          <button 
            onClick={() => onAuthOpen("register")}
            className="group flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base bg-white text-black hover:bg-gray-100 transition-all shadow-[0_0_32px_rgba(255,255,255,0.15)]"
          >
            Start for free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

    </div>
  );
}
