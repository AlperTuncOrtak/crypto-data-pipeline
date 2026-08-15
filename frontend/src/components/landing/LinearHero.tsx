import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight, Activity, BarChart3, PieChart, ShieldAlert, Zap, Globe, Lock, ArrowDownUp, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRef, useState } from "react";

export function LinearHero({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("market");

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const mockupRotateX = useTransform(scrollYProgress, [0, 0.5], [20, 0]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.2], [0.5, 1]);

  const tabs = [
    { id: "market", label: "Markets", icon: BarChart3 },
    { id: "portfolio", label: "Portfolio", icon: PieChart },
    { id: "swap", label: "Swap", icon: ArrowDownUp },
    { id: "ai", label: "AI Agent", icon: Bot },
  ];

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
            onClick={() => {
              if (user) {
                navigate("/dashboard");
              } else if (onAuthOpen) {
                onAuthOpen("login");
              }
            }}
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
          className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl sm:rounded-[24px] border border-white/10 bg-[#060606] shadow-[0_0_80px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col pointer-events-auto"
        >
          {/* Mac Header */}
          <div className="h-10 shrink-0 border-b border-white/5 bg-[#0a0a0a] flex items-center px-4 gap-2 z-20">
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
          <div className="flex-1 flex overflow-hidden text-white relative">
            
            {/* Sidebar */}
            <div className="w-16 sm:w-48 lg:w-56 border-r border-white/5 bg-[#0a0a0a]/50 flex flex-col pt-4 shrink-0 z-20">
              <div className="px-4 mb-6 hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-[4px] bg-white text-black flex items-center justify-center font-bold text-[10px]">C</div>
                  <span className="font-semibold text-sm tracking-tight truncate">CryptoNeko</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 px-2">
                {tabs.map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center sm:justify-start gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${activeTab === tab.id ? "bg-white/5 border border-white/5 text-white" : "hover:bg-white/[0.02] text-slate-400 border border-transparent"}`}
                  >
                    <tab.icon size={16} />
                    <span className="hidden sm:block text-xs font-medium truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trading Area - Dynamic Tabs */}
            <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden relative">
              <AnimatePresence mode="wait">
                {activeTab === "market" && <MarketTab key="market" />}
                {activeTab === "portfolio" && <PortfolioTab key="portfolio" />}
                {activeTab === "swap" && <SwapTab key="swap" />}
                {activeTab === "ai" && <AiTab key="ai" />}
              </AnimatePresence>
            </div>

          {/* Fade out bottom overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent opacity-60 pointer-events-none z-30" />
        </motion.div>
      </div>
    </section>
  );
}

function MarketTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(4px)" }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Header */}
      <div className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-sm sm:text-xl font-bold tracking-tight truncate">BTC-PERP</span>
            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[8px] sm:text-[9px] font-black uppercase tracking-wider shrink-0">Perpetual</span>
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/5 mx-2 shrink-0"></div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-lg font-mono font-bold text-emerald-400">64,230.50</span>
            <span className="text-[8px] sm:text-[10px] font-mono text-slate-500">$64,230.50</span>
          </div>
          <div className="flex flex-col ml-2 sm:ml-4">
            <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-semibold">24h Change</span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400">+4.20%</span>
          </div>
        </div>
      </div>

      {/* Chart & Order Book Split */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Main Chart Area */}
        <div className="flex-1 relative p-4 sm:p-6 flex flex-col justify-end border-r border-white/5 overflow-hidden">
          {/* Grid Lines */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwaGF0aCBkPSJNMCAzOS41aDQwbS00MC0zOS41djQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz48L3N2Zz4=')] opacity-50 pointer-events-none" />
          
          {/* Candlesticks */}
          <div className="w-full h-full flex items-end justify-between relative z-10 gap-1 sm:gap-2">
            {[
              {h: "20%", c: "bg-red-500"}, {h: "15%", c: "bg-red-500"}, {h: "25%", c: "bg-emerald-500"}, 
              {h: "40%", c: "bg-emerald-500"}, {h: "35%", c: "bg-red-500"}, {h: "50%", c: "bg-emerald-500"},
              {h: "60%", c: "bg-emerald-500"}, {h: "55%", c: "bg-red-500"}, {h: "70%", c: "bg-emerald-500"},
              {h: "65%", c: "bg-red-500"}, {h: "80%", c: "bg-emerald-500"}, {h: "75%", c: "bg-red-500"},
              {h: "90%", c: "bg-emerald-500"}, {h: "100%", c: "bg-emerald-500"}, {h: "85%", c: "bg-red-500"}
            ].map((candle, i) => (
              <div key={i} className="flex-1 flex justify-center relative h-[80%] items-end group">
                <div className="absolute w-[1px] bg-white/20" style={{ height: `calc(${candle.h} + 10%)`, bottom: 0 }} />
                <div className={`w-[80%] max-w-[12px] rounded-[1px] ${candle.c} relative z-10`} style={{ height: candle.h, marginBottom: '5%' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Order Book Panel */}
        <div className="w-28 sm:w-48 lg:w-64 bg-[#0a0a0a] hidden md:flex flex-col overflow-hidden shrink-0">
          <div className="flex text-[8px] sm:text-[9px] font-semibold text-slate-500 px-2 sm:px-4 py-2 border-b border-white/5 uppercase tracking-widest shrink-0">
            <span className="flex-1">Price</span>
            <span className="flex-1 text-right">Size</span>
          </div>
          
          <div className="flex-1 p-2 flex flex-col gap-[2px] overflow-hidden justify-center">
            {/* Asks (Red) */}
            {[
              {p: "64,245.00", s: "1.45", w: "45%"},
              {p: "64,242.50", s: "0.89", w: "20%"},
              {p: "64,239.00", s: "3.10", w: "85%"},
              {p: "64,235.50", s: "0.12", w: "5%"},
              {p: "64,232.00", s: "2.40", w: "60%"},
            ].reverse().map((row, i) => (
              <div key={`ask-${i}`} className="flex text-[8px] sm:text-[10px] font-mono px-2 py-[2px] relative group cursor-pointer hover:bg-white/[0.02] transition-colors rounded-sm">
                <div className="absolute right-0 top-0 bottom-0 bg-red-500/10 rounded-sm" style={{ width: row.w }} />
                <span className="flex-1 text-red-400 relative z-10">{row.p}</span>
                <span className="flex-1 text-right text-slate-300 relative z-10">{row.s}</span>
              </div>
            ))}
            
            {/* Spread */}
            <div className="my-1 sm:my-2 py-1 flex items-center justify-center border-y border-white/5 shrink-0">
              <span className="text-sm sm:text-lg font-mono font-bold text-white">64,230.50</span>
            </div>

            {/* Bids (Green) */}
            {[
              {p: "64,228.00", s: "4.50", w: "100%"},
              {p: "64,225.50", s: "1.20", w: "30%"},
              {p: "64,222.00", s: "0.55", w: "15%"},
              {p: "64,219.50", s: "2.10", w: "55%"},
              {p: "64,215.00", s: "0.80", w: "25%"},
            ].map((row, i) => (
              <div key={`bid-${i}`} className="flex text-[8px] sm:text-[10px] font-mono px-2 py-[2px] relative group cursor-pointer hover:bg-white/[0.02] transition-colors rounded-sm">
                <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 rounded-sm" style={{ width: row.w }} />
                <span className="flex-1 text-emerald-400 relative z-10">{row.p}</span>
                <span className="flex-1 text-right text-slate-300 relative z-10">{row.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Floating Modal hidden on small screens */}
      <div className="absolute bottom-6 left-6 w-72 rounded-xl bg-[#0a0a0a]/90 border border-white/10 shadow-xl backdrop-blur-md overflow-hidden hidden lg:block z-20">
        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Whale Pulse</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10">
            <Activity size={10} className="text-emerald-400" />
            <span className="text-[9px] font-mono text-emerald-400">Live</span>
          </div>
        </div>
        <div className="p-3">
          <div className="flex gap-2 items-start">
            <ShieldAlert size={14} className="text-red-400 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">Massive Transfer</span>
              <p className="text-[10px] text-slate-400 leading-snug">12,500 BTC moving to spot wallets.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PortfolioTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(4px)" }}
      className="absolute inset-0 flex flex-col p-4 sm:p-6 overflow-hidden"
    >
      <div className="mb-6 shrink-0">
        <h3 className="text-xs sm:text-sm text-slate-400 font-medium mb-1">Total Balance</h3>
        <div className="text-2xl sm:text-4xl font-bold text-white font-mono">$124,592.80</div>
        <div className="text-[10px] sm:text-xs text-emerald-400 mt-1 flex items-center gap-1">
          <Activity size={12} /> +$4,230 (3.5%) Today
        </div>
      </div>
      
      <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-4 overflow-y-auto">
        {[
          { symbol: "BTC", name: "Bitcoin", amount: "1.25", value: "$80,288.12", color: "bg-orange-500" },
          { symbol: "ETH", name: "Ethereum", amount: "12.4", value: "$38,440.00", color: "bg-blue-500" },
          { symbol: "SOL", name: "Solana", amount: "45.0", value: "$5,864.68", color: "bg-purple-500" },
          { symbol: "LINK", name: "Chainlink", amount: "100.0", value: "$1,450.00", color: "bg-blue-600" },
        ].map(asset => (
          <div key={asset.symbol} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${asset.color} flex items-center justify-center font-bold text-[10px] sm:text-xs`}>
                {asset.symbol[0]}
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">{asset.symbol}</div>
                <div className="text-[9px] sm:text-[10px] text-slate-400">{asset.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-xs sm:text-sm">{asset.value}</div>
              <div className="font-mono text-[9px] sm:text-[10px] text-slate-400">{asset.amount} {asset.symbol}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SwapTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(4px)" }}
      className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
    >
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-2xl relative">
        <h3 className="text-xs sm:text-sm font-bold text-white mb-4">Swap Assets</h3>
        
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-4 mb-2">
          <div className="text-[9px] sm:text-[10px] text-slate-400 mb-1">You pay</div>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-mono text-white">1.0</span>
            <div className="px-2 py-1 sm:px-3 sm:py-1 bg-white/10 rounded-full text-[10px] sm:text-xs font-bold">ETH</div>
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1">$3,100.00</div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-[15%] w-6 h-6 sm:w-8 sm:h-8 bg-[#111] border border-white/10 rounded-full flex items-center justify-center z-10 shadow-lg">
          <ArrowDownUp size={12} className="text-slate-400" />
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="text-[9px] sm:text-[10px] text-slate-400 mb-1">You receive</div>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-mono text-white">3,095.50</span>
            <div className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] sm:text-xs font-bold">USDC</div>
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1">$3,095.50</div>
        </div>

        <button className="w-full py-2 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[10px] sm:text-sm transition-colors">
          Confirm Swap
        </button>
      </div>
    </motion.div>
  );
}

function AiTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(4px)" }}
      className="absolute inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden"
    >
      <div className="p-3 sm:p-4 border-b border-white/5 flex items-center gap-3 bg-[#050505] shrink-0">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
          <Bot size={14} className="text-blue-400" />
        </div>
        <div>
          <div className="font-bold text-xs sm:text-sm">CryptoNeko AI</div>
          <div className="text-[9px] sm:text-[10px] text-emerald-400 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Online
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex gap-2 sm:gap-3 justify-end">
          <div className="bg-blue-600 text-white text-[10px] sm:text-xs p-2 sm:p-3 rounded-2xl rounded-tr-sm max-w-[80%]">
            Analyze the current market sentiment for Solana.
          </div>
        </div>
        
        <div className="flex gap-2 sm:gap-3 items-start">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
            <Bot size={10} className="text-white" />
          </div>
          <div className="bg-white/5 border border-white/10 text-slate-200 text-[10px] sm:text-xs p-2 sm:p-3 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed">
            Solana (SOL) is showing strong bullish divergence on the 4H timeframe. On-chain volume has increased by 14% in the last 24h. 
            <br/><br/>
            Key resistance: <b className="text-white"> $145</b><br/>
            Support: <b className="text-white"> $138</b>
            <br/><br/>
            <span className="text-emerald-400 font-bold">Recommendation:</span> Accumulate near support.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
