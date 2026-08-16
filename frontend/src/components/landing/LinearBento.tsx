import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, CandlestickChart, ShieldAlert, GitBranch, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";

// Spotlight Card Wrapper
function BentoCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div 
      onMouseMove={onMouseMove}
      className={`group relative rounded-2xl border border-white/5 bg-[#0a0a0a] overflow-hidden transition-colors hover:border-white/10 ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100 z-0"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 40%)`
          )
        }}
      />
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// CARD 1: AI Whale Anomaly Radar
// A premium, scanning radar interface with glowing alerts.
// ----------------------------------------------------
function WhaleFeed() {
  const [items, setItems] = useState([
    { id: 1, type: "WHALE BUY", amount: "1,200", asset: "BTC", score: 92, time: "Just now" },
    { id: 2, type: "ANOMALY", amount: "45,000", asset: "ETH", score: 88, time: "2s ago" },
    { id: 3, type: "WHALE SELL", amount: "890k", asset: "SOL", score: 95, time: "5s ago" },
  ]);

  useEffect(() => {
    let idCounter = 4;
    const assets = ["BTC", "ETH", "SOL", "LINK", "AVAX"];
    const types = ["WHALE BUY", "ANOMALY", "WHALE SELL"];
    
    const int = setInterval(() => {
      setItems(prev => {
        const typeStr = types[Math.floor(Math.random() * types.length)];
        const isSell = typeStr.includes("SELL");
        const newItems = [
          { 
            id: idCounter++, 
            type: typeStr,
            amount: isSell ? `${Math.floor(Math.random() * 9000 + 1000)}` : `${Math.floor(Math.random() * 500 + 10)}`, 
            asset: assets[Math.floor(Math.random() * assets.length)],
            score: Math.floor(Math.random() * 20 + 80),
            time: "Just now" 
          },
          ...prev.map(p => ({ ...p, time: parseInt(p.time) ? `${parseInt(p.time) + 2}s ago` : "2s ago" }))
        ];
        return newItems.slice(0, 3);
      });
    }, 2500);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="relative h-56 w-full overflow-hidden mt-4 border border-white/5 bg-[#030303] rounded-xl p-4 flex flex-col justify-start shadow-inner">
      {/* Radar Sweep Background */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.05] opacity-80 pointer-events-none"
        style={{
          background: "conic-gradient(from 0deg, transparent 60%, rgba(52, 211, 153, 0.4) 100%)"
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-emerald-500/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-emerald-500/30 pointer-events-none bg-emerald-500/[0.02]" />

      {/* "Live AI" indicator */}
      <div className="flex items-center gap-2 mb-4 px-1 relative z-10">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-100"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#34d399]"></span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">AI Scanner Active</span>
      </div>

      <div className="flex flex-col gap-3 relative z-10 mask-image-bottom h-full">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const isBuy = item.type.includes("BUY");
            const isAnomaly = item.type === "ANOMALY";
            const color = isAnomaly ? "text-purple-400" : (isBuy ? "text-emerald-400" : "text-red-400");
            const borderColor = isAnomaly ? "#a855f7" : (isBuy ? "#34d399" : "#f87171");
            const glow = isAnomaly ? "shadow-[0_0_20px_rgba(168,85,247,0.5)]" : (isBuy ? "shadow-[0_0_20px_rgba(52,211,153,0.5)]" : "shadow-[0_0_20px_rgba(248,113,113,0.5)]");
            
            return (
              <motion.div 
                layout
                key={item.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, filter: "blur(4px)", scale: 0.9 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className={`flex items-center justify-between py-2.5 px-4 rounded-lg bg-white/[0.04] border-l-[3px] border border-white/10 backdrop-blur-md cursor-pointer ${glow}`}
                style={{ borderLeftColor: borderColor }}
              >
                <div className="flex gap-4 items-center w-full">
                  <motion.span 
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`text-[10px] font-black w-20 tracking-wider whitespace-nowrap ${color}`}
                  >
                    {item.type}
                  </motion.span>
                  <span className="text-sm text-white font-mono font-bold flex-1">
                    {item.amount} <span className="text-slate-400 font-medium ml-1">{item.asset}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest">Score</span>
                    <span className={`text-[11px] font-black ${color}`}>{item.score}%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono w-12 text-right">{item.time}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// CARD 2: AI Candlestick Vision (User likes it, keeping it similar but polished)
// ----------------------------------------------------
function AnimatedCandles() {
  const [heights, setHeights] = useState([40, 55, 30, 70, 80, 50, 90]);

  useEffect(() => {
    const int = setInterval(() => {
      setHeights(prev => prev.map(h => {
        const delta = (Math.random() - 0.5) * 30;
        return Math.max(20, Math.min(95, h + delta));
      }));
    }, 2500); // Slowed down from 1500
    return () => clearInterval(int);
  }, []);

  return (
    <div className="flex gap-2 w-full h-full items-end justify-center px-4 z-10 relative">
      {heights.map((h, i) => (
        <motion.div 
          key={i} 
          animate={{ height: `${h}%` }} 
          transition={{ duration: 1.5, type: "spring", bounce: 0.2 }} // Slowed down duration
          className={`flex-1 rounded-[1px] relative ${i % 2 === 0 ? 'bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}
        >
          {/* Candle Wick */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/30 -my-3" />
        </motion.div>
      ))}
    </div>
  );
}

// ----------------------------------------------------
// CARD 3: Institutional Grade Risk
// A visual "Rule Builder" pipeline (If X AND Y -> Execute Action).
// ----------------------------------------------------
function RiskMonitor() {
  return (
    <div className="h-32 mt-6 rounded-xl bg-[#030303] border border-white/5 relative p-4 flex flex-col justify-center items-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full" />
      
      <div className="flex items-center gap-1.5 w-full justify-center relative z-10">
        {/* Trigger 1: Volume */}
        <motion.div 
          animate={{ borderColor: ["rgba(255,255,255,0.05)", "rgba(59,130,246,0.4)", "rgba(255,255,255,0.05)"] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0 }}
          className="flex flex-col items-center justify-center w-[52px] h-[52px] bg-black border rounded-xl shadow-lg shrink-0"
        >
          <Activity size={14} className="text-blue-400 mb-1" />
          <span className="text-[7px] text-slate-400 font-mono tracking-tighter">VOL &gt; 300%</span>
        </motion.div>

        {/* Connecting Line 1 */}
        <div className="w-4 sm:w-6 h-[1px] bg-white/10 relative overflow-hidden shrink-0">
          <motion.div 
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0 }}
            className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent"
          />
        </div>

        {/* AND Gate Operator */}
        <div className="px-1.5 py-1 rounded bg-white/5 border border-white/10 text-[6px] font-black text-slate-400 shrink-0 uppercase tracking-widest shadow-inner">
          AND
        </div>

        {/* Connecting Line 2 */}
        <div className="w-4 sm:w-6 h-[1px] bg-white/10 relative overflow-hidden shrink-0">
          <motion.div 
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
            className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-purple-400 to-transparent"
          />
        </div>

        {/* Action Node: Hedge */}
        <motion.div 
          animate={{ borderColor: ["rgba(255,255,255,0.05)", "rgba(168,85,247,0.5)", "rgba(255,255,255,0.05)"], scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1.6 }}
          className="flex flex-col items-center justify-center w-[52px] h-[52px] bg-black border rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.1)] shrink-0"
        >
          <ShieldAlert size={14} className="text-purple-400 mb-1" />
          <span className="text-[7px] text-purple-400 font-black font-mono tracking-tighter">HEDGE</span>
        </motion.div>
      </div>

      {/* Floating particles to make it feel "active" */}
      <motion.div 
        animate={{ y: [-5, 5, -5], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-2 right-4 text-[8px] text-slate-500 font-mono"
      >
        [ACTIVE]
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------
// CARD 4: Time-Machine Backtesting
// A wide timeline chart showing years passing rapidly and a portfolio growing.
// ----------------------------------------------------
// ----------------------------------------------------
// CARD 4: Time-Machine Backtesting
// A highly graphical Equity Curve scanner with interactive-looking tooltips and trade grid.
// ----------------------------------------------------
// ----------------------------------------------------
// CARD 4: Time-Machine Backtesting
// Reverted to original state for future redesign.
// ----------------------------------------------------
function BacktestEngine() {
  return (
    <div className="h-32 mt-6 rounded-xl bg-[#000000] border border-white/5 relative flex items-end p-4 overflow-hidden group-hover:border-white/10 transition-colors">
       {/* Progress Bar Demo */}
       <div className="w-full">
         <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-2">
           <span>Simulating 2022-2023...</span>
           <span>RSI + MACD Cross</span>
         </div>
         <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
           <motion.div
             initial={{ width: "0%" }}
             animate={{ width: "100%" }}
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
             className="h-full rounded-full bg-white opacity-80" 
           />
         </div>
       </div>
    </div>
  );
}


export function LinearBento() {
  return (
    <section className="py-24 px-6 max-w-[1200px] mx-auto relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
          Built for the modern trader.
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Every tool you need to analyze, execute, and scale your crypto strategy without the noise.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
        
        {/* Card 1: Wide */}
        <BentoCard className="md:col-span-2 p-8 flex flex-col justify-between">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                <Activity size={20} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight">AI Whale Anomaly Radar</h3>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Detect massive institutional flows and algorithmic anomalies before they move the market using our Isolation Forest ML model.
            </p>
            <WhaleFeed />
          </div>
        </BentoCard>

        {/* Card 2: Square */}
        <BentoCard className="p-8 flex flex-col">
          <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4">
            <CandlestickChart size={20} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white tracking-tight mb-2">AI Candlestick Vision</h3>
          <p className="text-sm text-slate-400 mb-6">
            Automatically detect support, resistance, and key technical patterns with 94% accuracy.
          </p>
          
          <div className="flex-1 rounded-xl bg-black border border-white/5 relative overflow-hidden flex items-end">
             {/* Grid background */}
             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBoMjBWMEgweiIgZmlsbD0ibm9uZSIvPjxwaGF0aCBkPSJNMCAxOS41aDIwbS0yMC0xOS41djIwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz48L3N2Zz4=')] opacity-50 pointer-events-none" />
             <AnimatedCandles />
             {/* Scan line */}
             <motion.div 
               animate={{ top: ["-10%", "110%", "-10%"] }} 
               transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
               className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_20px_#34d399] opacity-90 z-20"
             />
          </div>
        </BentoCard>

        {/* Card 3: Square */}
        <BentoCard className="p-8 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <ShieldAlert size={20} className="text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Institutional Grade Risk</h3>
            <p className="text-sm text-slate-400">
              Set highly complex conditional alerts based on volume spikes and sentiment changes.
            </p>
          </div>
          <RiskMonitor />
        </BentoCard>

        {/* Card 4: Wide */}
        <BentoCard className="md:col-span-2 p-8 flex flex-col justify-between">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <GitBranch size={20} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Time-Machine Backtesting</h3>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Run your strategies against 5 years of historical tick-level data in seconds. Test before you risk a single satoshi.
            </p>
            <BacktestEngine />
          </div>
        </BentoCard>

      </div>
    </section>
  );
}
