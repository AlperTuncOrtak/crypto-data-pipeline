import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronRight, Activity, BarChart3, PieChart, ShieldAlert, Zap, Globe, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRef } from "react";

export function LinearHero() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const mockupRotateX = useTransform(scrollYProgress, [0, 0.5], [20, 0]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.2], [0.5, 1]);

  return (
    <section ref={containerRef} className="relative z-10 pt-32 pb-20 flex flex-col items-center justify-start min-h-[140vh] perspective-[2000px] overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Content */}
      <div className="flex flex-col items-center text-center max-w-[900px] mx-auto px-6 relative z-20">
        
        {/* Glowing Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="group cursor-pointer mb-8"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">New</span>
            <span className="text-slate-300 text-xs sm:text-sm font-medium">CryptoNeko v2.0 is now live</span>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </motion.div>

        {/* Massive Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-6xl sm:text-7xl md:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-6 text-white"
        >
          Algorithmic Crypto <br className="hidden md:block" /> Trading.
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl leading-relaxed mb-10"
        >
          Advanced portfolio tracking, real-time AI sentiment analysis, and professional-grade indicators in one sleek, unified terminal.
        </motion.p>

        {/* Primary CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button 
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-white text-[#000000] font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            Start building <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>

      {/* Hyper-Realistic DOM Mockup */}
      <div className="w-full max-w-[1200px] px-6 mt-20 relative z-10 pointer-events-none">
        <motion.div
          style={{ 
            rotateX: mockupRotateX, 
            scale: mockupScale,
            opacity: mockupOpacity,
            transformStyle: "preserve-3d" 
          }}
          className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl sm:rounded-[24px] border border-white/10 bg-[#060606] shadow-[0_0_80px_rgba(255,255,255,0.05)] overflow-hidden"
        >
          {/* Mac Header */}
          <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 bg-[#0a0a0a] flex items-center px-4 gap-2 z-20">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-white/10 border border-white/10"></div>
              <div className="w-3 h-3 rounded-full bg-white/10 border border-white/10"></div>
              <div className="w-3 h-3 rounded-full bg-white/10 border border-white/10"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-3 py-1 rounded-md bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <Lock size={10} className="text-slate-500" />
                <span className="text-[10px] text-slate-400 font-mono">cryptoneko.app/terminal</span>
              </div>
            </div>
          </div>
          
          {/* Main Terminal Layout */}
          <div className="absolute inset-0 top-10 flex text-white">
            
            {/* Sidebar */}
            <div className="w-16 sm:w-56 border-r border-white/5 bg-[#0a0a0a]/50 flex flex-col pt-4">
              <div className="px-4 mb-6 hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-[4px] bg-white text-black flex items-center justify-center font-bold text-[10px]">C</div>
                  <span className="font-semibold text-sm tracking-tight">CryptoNeko</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 px-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white">
                  <BarChart3 size={16} />
                  <span className="hidden sm:block text-xs font-medium">Markets</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] text-slate-400 transition-colors">
                  <PieChart size={16} />
                  <span className="hidden sm:block text-xs font-medium">Portfolio</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] text-slate-400 transition-colors">
                  <Zap size={16} />
                  <span className="hidden sm:block text-xs font-medium">AI Agents</span>
                </div>
              </div>
            </div>

            {/* Trading Area */}
            <div className="flex-1 flex flex-col bg-[#050505]">
              {/* Header */}
              <div className="h-16 border-b border-white/5 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight">BTC-PERP</span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[9px] font-black uppercase tracking-wider">Perpetual</span>
                  </div>
                  <div className="h-8 w-px bg-white/5 mx-2"></div>
                  <div className="flex flex-col">
                    <span className="text-lg font-mono font-bold text-emerald-400">64,230.50</span>
                    <span className="text-[10px] font-mono text-slate-500">$64,230.50</span>
                  </div>
                  <div className="flex flex-col ml-4">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">24h Change</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">+4.20%</span>
                  </div>
                </div>
              </div>

              {/* Chart & Order Book Split */}
              <div className="flex-1 flex overflow-hidden">
                
                {/* Main Chart Area */}
                <div className="flex-1 relative p-6 flex flex-col justify-end border-r border-white/5">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwaGF0aCBkPSJNMCAzOS41aDQwbS00MC0zOS41djQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz48L3N2Zz4=')] opacity-50" />
                  
                  {/* AI Line Chart Overlay */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <path d="M0,350 Q100,320 200,340 T400,280 T600,200 T800,100 T1000,50" fill="none" stroke="rgba(34,211,238,0.4)" strokeWidth="2" strokeDasharray="4 4" />
                    <circle cx="800" cy="100" r="4" fill="#22d3ee" />
                    <circle cx="1000" cy="50" r="4" fill="#22d3ee" />
                  </svg>
                  
                  {/* Candlesticks (HTML DOM) */}
                  <div className="w-full flex items-end justify-between h-48 relative z-10 gap-[2px]">
                    {[
                      {h: 40, c: "bg-red-500"}, {h: 35, c: "bg-red-500"}, {h: 45, c: "bg-emerald-500"}, 
                      {h: 60, c: "bg-emerald-500"}, {h: 55, c: "bg-red-500"}, {h: 70, c: "bg-emerald-500"},
                      {h: 80, c: "bg-emerald-500"}, {h: 75, c: "bg-red-500"}, {h: 90, c: "bg-emerald-500"},
                      {h: 85, c: "bg-red-500"}, {h: 110, c: "bg-emerald-500"}, {h: 100, c: "bg-red-500"},
                      {h: 130, c: "bg-emerald-500"}, {h: 150, c: "bg-emerald-500"}, {h: 140, c: "bg-red-500"}
                    ].map((candle, i) => (
                      <div key={i} className="flex-1 flex justify-center relative group">
                        {/* Wick */}
                        <div className="absolute w-[1px] bg-white/20" style={{ height: `${candle.h + 20}px`, bottom: 0 }} />
                        {/* Body */}
                        <div className={`w-[80%] rounded-[1px] ${candle.c}`} style={{ height: `${candle.h}px`, marginBottom: '10px' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Book Panel */}
                <div className="w-64 bg-[#0a0a0a] hidden md:flex flex-col">
                  <div className="flex text-[9px] font-semibold text-slate-500 px-4 py-2 border-b border-white/5 uppercase tracking-widest">
                    <span className="flex-1">Price (USDT)</span>
                    <span className="flex-1 text-right">Size (BTC)</span>
                  </div>
                  
                  <div className="flex-1 p-2 flex flex-col gap-[2px]">
                    {/* Asks (Red) */}
                    {[
                      {p: "64,245.00", s: "1.452", w: "45%"},
                      {p: "64,242.50", s: "0.892", w: "20%"},
                      {p: "64,239.00", s: "3.105", w: "85%"},
                      {p: "64,235.50", s: "0.120", w: "5%"},
                      {p: "64,232.00", s: "2.400", w: "60%"},
                    ].reverse().map((row, i) => (
                      <div key={`ask-${i}`} className="flex text-[10px] font-mono px-2 py-[2px] relative group cursor-pointer hover:bg-white/[0.02] transition-colors rounded-sm">
                        <div className="absolute right-0 top-0 bottom-0 bg-red-500/10 rounded-sm" style={{ width: row.w }} />
                        <span className="flex-1 text-red-400 relative z-10">{row.p}</span>
                        <span className="flex-1 text-right text-slate-300 relative z-10">{row.s}</span>
                      </div>
                    ))}
                    
                    {/* Spread */}
                    <div className="my-2 py-1 flex items-center justify-center border-y border-white/5">
                      <span className="text-lg font-mono font-bold text-white">64,230.50</span>
                    </div>

                    {/* Bids (Green) */}
                    {[
                      {p: "64,228.00", s: "4.500", w: "100%"},
                      {p: "64,225.50", s: "1.200", w: "30%"},
                      {p: "64,222.00", s: "0.550", w: "15%"},
                      {p: "64,219.50", s: "2.100", w: "55%"},
                      {p: "64,215.00", s: "0.800", w: "25%"},
                    ].map((row, i) => (
                      <div key={`bid-${i}`} className="flex text-[10px] font-mono px-2 py-[2px] relative group cursor-pointer hover:bg-white/[0.02] transition-colors rounded-sm">
                        <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 rounded-sm" style={{ width: row.w }} />
                        <span className="flex-1 text-emerald-400 relative z-10">{row.p}</span>
                        <span className="flex-1 text-right text-slate-300 relative z-10">{row.s}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Linear-Style Floating Modal (Pulse) */}
            <div className="absolute bottom-12 left-24 sm:left-64 w-80 rounded-xl bg-white/[0.02] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden hidden sm:block">
              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-semibold text-white tracking-tight">Whale Pulse for Jul 7</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  <Activity size={10} className="text-emerald-400" />
                  <span className="text-[9px] font-mono text-slate-300">Live</span>
                </div>
              </div>
              {/* Modal Content */}
              <div className="p-4 flex flex-col gap-4">
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5">
                    <ShieldAlert size={14} className="text-red-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Massive Transfer</span>
                      <span className="text-[10px] text-slate-500 font-mono">1 min ago</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Identified <span className="text-white font-mono">12,500 BTC</span> moving from cold storage to Binance spot wallets. High risk of timeline slip if support breaks.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="mt-0.5">
                    <Globe size={14} className="text-emerald-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Sentiment Shift</span>
                      <span className="text-[10px] text-slate-500 font-mono">5 mins ago</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Social volume increased by 400%. Localization efforts and buying pressure detected on Asian exchanges.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Fade out bottom overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent opacity-60 pointer-events-none z-30" />
        </motion.div>
      </div>
    </section>
  );
}
