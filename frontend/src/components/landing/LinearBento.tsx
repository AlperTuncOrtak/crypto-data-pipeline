import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, CandlestickChart, ShieldAlert, GitBranch } from "lucide-react";

// Double-Bezel Premium Card Wrapper
function BentoCard({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.32, 0.72, 0, 1] }}
      onMouseMove={onMouseMove}
      className={`group relative rounded-[2rem] p-1.5 bg-white/5 border border-[var(--border-subtle)] overflow-hidden transition-colors hover:border-white/10 ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 z-0"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 40%)`
          )
        }}
      />
      
      {/* Inner Core */}
      <div className="relative z-10 w-full h-full rounded-[calc(2rem-0.375rem)] border border-[var(--border-base)] bg-[var(--bg-base)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col p-8">
        {children}
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------
// CARD 1: AI Whale Anomaly Radar
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
    <div className="relative flex-1 w-full overflow-hidden mt-6 rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 flex flex-col justify-start">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.05] opacity-80 pointer-events-none"
        style={{ background: "conic-gradient(from 0deg, transparent 60%, rgba(52, 211, 153, 0.4) 100%)" }}
      />
      <div className="flex items-center gap-2 mb-4 px-1 relative z-10">
        <div className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-100"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-medium">Scanner Active</span>
      </div>

      <div className="flex flex-col gap-2 relative z-10 mask-image-bottom h-full">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const isBuy = item.type.includes("BUY");
            const isAnomaly = item.type === "ANOMALY";
            const color = isAnomaly ? "text-orange-400" : (isBuy ? "text-emerald-400" : "text-red-400");
            const borderColor = isAnomaly ? "border-orange-500/50" : (isBuy ? "border-emerald-500/50" : "border-red-500/50");
            
            return (
              <motion.div 
                layout
                key={item.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, filter: "blur(4px)", scale: 0.9 }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className={`flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border-l-2 border border-white/5 backdrop-blur-md ${borderColor}`}
              >
                <div className="flex gap-4 items-center">
                  <span className={`text-[9px] font-bold w-16 tracking-wider ${color}`}>{item.type}</span>
                  <span className="text-xs text-[var(--text-main)] font-mono font-bold">
                    {item.amount} <span className="text-[var(--text-muted)] ml-0.5">{item.asset}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold ${color}`}>{item.score}%</span>
                  </div>
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
// CARD 2: AI Candlestick Vision
// ----------------------------------------------------
function AnimatedCandles() {
  const [heights, setHeights] = useState([40, 55, 30, 70, 80, 50, 90]);

  useEffect(() => {
    const int = setInterval(() => {
      setHeights(prev => prev.map(h => {
        const delta = (Math.random() - 0.5) * 30;
        return Math.max(20, Math.min(95, h + delta));
      }));
    }, 2500); 
    return () => clearInterval(int);
  }, []);

  return (
    <div className="flex gap-2 w-full h-full items-end justify-center px-4 z-10 relative">
      {heights.map((h, i) => (
        <motion.div 
          key={i} 
          animate={{ height: `${h}%` }} 
          transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1] }} 
          className={`flex-1 rounded-sm relative ${i % 2 === 0 ? 'bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}
        >
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/20 -my-3" />
        </motion.div>
      ))}
    </div>
  );
}

// ----------------------------------------------------
// CARD 3: Institutional Grade Risk
// ----------------------------------------------------
function RiskMonitor() {
  return (
    <div className="flex-1 mt-6 rounded-[1.5rem] bg-[var(--bg-base)] border border-[var(--border-subtle)] relative p-4 flex flex-col justify-center items-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-1.5 w-full justify-center relative z-10">
        <div className="flex flex-col items-center justify-center w-[48px] h-[48px] bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-sm shrink-0">
          <Activity size={12} className="text-orange-400 mb-1" />
          <span className="text-[6px] text-[var(--text-muted)] font-mono tracking-tighter">VOL &gt; 300%</span>
        </div>

        <div className="w-4 sm:w-6 h-[1px] bg-white/10 relative overflow-hidden shrink-0">
          <motion.div 
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent"
          />
        </div>

        <div className="px-1.5 py-1 rounded bg-white/5 border border-white/5 text-[5px] font-bold text-[var(--text-muted)] shrink-0 uppercase tracking-widest">
          AND
        </div>

        <div className="w-4 sm:w-6 h-[1px] bg-white/10 relative overflow-hidden shrink-0">
          <motion.div 
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
            className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-red-400 to-transparent"
          />
        </div>

        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.6 }}
          className="flex flex-col items-center justify-center w-[48px] h-[48px] bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-[0_0_15px_rgba(239,68,68,0.15)] shrink-0"
        >
          <ShieldAlert size={12} className="text-red-400 mb-1" />
          <span className="text-[6px] text-red-400 font-bold font-mono tracking-tighter">HEDGE</span>
        </motion.div>
      </div>
    </div>
  );
}

export function LinearBento() {
  return (
    <section className="py-32 px-6 max-w-[1400px] mx-auto relative z-10">
      
      {/* Eyebrow for the section (Allowed once) */}
      <div className="text-center mb-24">
        <span className="inline-block mb-6 px-3 py-1 rounded-full border border-[var(--border-subtle)] text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-muted)] bg-white/[0.02]">
          Platform Architecture
        </span>
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-6 leading-[1.1]">
          Engineered for the <br className="hidden sm:block" /> absolute frontier.
        </h2>
        <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
          Every tool you need to analyze, execute, and scale your crypto strategy without the noise.
        </p>
      </div>

      {/* Asymmetrical Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[400px]">
        
        {/* Card 1: Main Highlight (Large) */}
        <BentoCard className="md:col-span-8 md:row-span-2" delay={0}>
          <div className="flex flex-col h-full">
            <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight mb-2">AI Whale Anomaly Radar</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mb-4 leading-relaxed">
              Detect massive institutional flows and algorithmic anomalies before they move the market using our Isolation Forest ML model.
            </p>
            <WhaleFeed />
          </div>
        </BentoCard>

        {/* Card 2: Square Top Right */}
        <BentoCard className="md:col-span-4 md:row-span-1" delay={0.1}>
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight mb-2">Candlestick Vision</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Detect key technical patterns with 94% accuracy.
            </p>
            <div className="flex-1 rounded-[1.5rem] bg-[#050505] border border-[var(--border-subtle)] relative overflow-hidden flex items-end">
               <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBoMjBWMEgweiIgZmlsbD0ibm9uZSIvPjxwaGF0aCBkPSJNMCAxOS41aDIwbS0yMC0xOS41djIwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />
               <AnimatedCandles />
            </div>
          </div>
        </BentoCard>

        {/* Card 3: Square Bottom Right */}
        <BentoCard className="md:col-span-4 md:row-span-1" delay={0.2}>
          <div className="flex flex-col h-full justify-between">
            <div>
              <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight mb-2">Institutional Risk</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Set complex conditional alerts based on volume spikes and sentiment changes.
              </p>
            </div>
            <RiskMonitor />
          </div>
        </BentoCard>

        {/* Card 4: Wide Full Bottom */}
        <BentoCard className="md:col-span-12 md:row-span-1" delay={0.3}>
          <div className="flex flex-col md:flex-row h-full gap-8">
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight mb-2">Time-Machine Backtesting</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md leading-relaxed">
                Run your strategies against 5 years of historical tick-level data in seconds. Test before you risk a single satoshi.
              </p>
            </div>
            
            <div className="flex-[1.5] rounded-[2rem] bg-[#050505] border border-[var(--border-subtle)] relative flex items-end p-6 overflow-hidden">
               <div className="w-full">
                 <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono mb-3">
                   <span className="uppercase tracking-widest font-semibold">Simulating 2022-2023</span>
                   <span className="uppercase tracking-widest font-semibold">RSI + MACD Cross</span>
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
          </div>
        </BentoCard>

      </div>
    </section>
  );
}
