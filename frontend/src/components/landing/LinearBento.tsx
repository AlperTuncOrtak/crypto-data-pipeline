import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, CandlestickChart, ShieldAlert } from "lucide-react";

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
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 40%)`
          )
        }}
      />
      {children}
    </div>
  );
}

// Minimal Whale Feed (from WhaleDemo)
function WhaleFeed() {
  const [items, setItems] = useState([0, 1, 2]);
  useEffect(() => {
    const int = setInterval(() => {
      setItems(prev => [(prev[0] + 1) % 100, ...prev].slice(0, 4));
    }, 2000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="relative h-40 w-full overflow-hidden mask-image-bottom">
      <div className="flex flex-col gap-2 mt-4">
        {items.map((item, i) => (
          <motion.div 
            key={item}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1 - i * 0.25, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white font-mono">1,000,000 USDT</span>
            </div>
            <span className="text-[10px] text-slate-500">Just now</span>
          </motion.div>
        ))}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
        
        {/* Card 1: Wide */}
        <BentoCard className="md:col-span-2 p-8 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4">
              <Activity size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Real-time Whale Tracking</h3>
            <p className="text-sm text-slate-400 max-w-md">
              Detect massive institutional flows before they move the market. Our latency is measured in milliseconds.
            </p>
          </div>
          <WhaleFeed />
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
          
          <div className="flex-1 rounded-xl bg-[#000000] border border-white/5 relative overflow-hidden flex items-end p-4">
             {/* Abstract Candle Chart */}
             <div className="flex gap-1 w-full opacity-30">
               {[40, 55, 30, 70, 80, 50, 90].map((h, i) => (
                 <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-white rounded-sm"></div>
               ))}
             </div>
             {/* Scan line */}
             {/* TODO: Refine this scan line micro-animation further to be perfectly smooth across all devices */}
             <motion.div 
               animate={{ top: ["0%", "100%", "0%"] }} 
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute left-0 right-0 h-[1px] bg-cyan-400/50 shadow-[0_0_15px_#22d3ee] opacity-80"
             />
          </div>
        </BentoCard>

        {/* Card 3: Square */}
        <BentoCard className="p-8 flex flex-col">
          <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Institutional Grade Risk</h3>
          <p className="text-sm text-slate-400">
            Set highly complex conditional alerts based on volume spikes and sentiment changes.
          </p>
        </BentoCard>

        {/* Card 4: Wide */}
        <BentoCard className="md:col-span-2 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Time-Machine Backtesting</h3>
            <p className="text-sm text-slate-400 max-w-md">
              Run your strategies against 5 years of historical tick-level data in seconds.
            </p>
          </div>
          
          <div className="h-32 mt-6 rounded-xl bg-[#000000] border border-white/5 relative flex items-end p-4 overflow-hidden">
             {/* Progress Bar Demo */}
             <div className="w-full">
               <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-2">
                 <span>Simulating 2022-2023...</span>
                 <span>RSI + MACD Cross</span>
               </div>
               <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                 {/* TODO: Progress bar animation could be synced with actual data parsing in the future */}
                 <motion.div
                   initial={{ width: "0%" }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 3, repeat: Infinity, ease: "circInOut", repeatDelay: 0.5 }}
                   className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                 />
               </div>
             </div>
          </div>
        </BentoCard>

      </div>
    </section>
  );
}
