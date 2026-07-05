import { motion } from "framer-motion";
import { Eye, TrendingUp, Cpu } from "lucide-react";

export function FeaturesZigZag() {
  return (
    <section className="relative z-10 px-6 lg:px-12 max-w-[1400px] mx-auto mb-32 space-y-32">
      
      {/* Feature 1: Whale X-Ray */}
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left: Text */}
        <div className="flex-1 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]">
            <Eye className="text-cyan-400" size={24} />
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            Whale X-Ray
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
            See exactly where the smart money is flowing. Our on-chain analysis engine tracks massive wallet movements across multiple DEXs in real-time. Don't be the exit liquidity; trade alongside the whales.
          </p>
          <ul className="space-y-3 pt-4">
            {['Live large transfer alerts', 'DEX activity monitoring', 'Wallet tagging and profiling'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Right: UI Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 w-full"
        >
          <div className="relative rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/30 transition-colors"></div>
            
            <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-6 shadow-inner space-y-4">
              {/* Mockup Rows */}
              {[
                { type: "BUY", token: "ETH", amt: "$1.2M", time: "Just now", color: "emerald" },
                { type: "SELL", token: "WIF", amt: "$800K", time: "2m ago", color: "rose" },
                { type: "TRANSFER", token: "USDC", amt: "$5.0M", time: "15m ago", color: "blue" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-${row.color}-500/10 text-${row.color}-400 border border-${row.color}-500/20`}>
                      {row.type}
                    </span>
                    <span className="font-bold text-white">{row.token}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-slate-300">{row.amt}</div>
                    <div className="text-[10px] text-slate-500">{row.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Feature 2: Time Machine Backtesting (Reverse) */}
      <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
        <div className="flex-1 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]">
            <TrendingUp className="text-purple-400" size={24} />
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            Time-Machine Backtesting
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
            What if you had bought Solana at the bottom of the bear market? Stop wondering. Simulate past market conditions, backtest your strategies, and receive an AI-generated analysis of your hypothetical portfolio performance.
          </p>
          <ul className="space-y-3 pt-4">
            {['Historical price replay', 'P&L Simulation', 'AI-driven critique of your entries'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 w-full"
        >
          <div className="relative rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/30 transition-colors"></div>
            
            <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-6 shadow-inner flex flex-col items-center justify-center min-h-[220px]">
               {/* Decorative Chart Mockup */}
               <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                 <path d="M0,80 Q20,60 40,70 T80,40 T120,50 T160,20 T200,10" fill="none" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                 <path d="M0,100 L0,80 Q20,60 40,70 T80,40 T120,50 T160,20 T200,10 L200,100 Z" fill="url(#gradient-purple)" opacity="0.2" />
                 <defs>
                   <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#a855f7" />
                     <stop offset="100%" stopColor="transparent" />
                   </linearGradient>
                 </defs>
               </svg>
               <div className="absolute bg-[#020817]/80 backdrop-blur border border-purple-500/30 px-4 py-2 rounded-lg text-center top-1/3">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Simulated P&L</div>
                 <div className="text-xl font-black text-emerald-400">+4,250%</div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Feature 3: AI Candlestick Vision */}
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
            <Cpu className="text-emerald-400" size={24} />
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            AI Candlestick Vision
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
            Tired of drawing lines manually? Toggle AI Vision on your charts and let Deep Learning instantly map support/resistance zones, highlight hidden patterns, and overlay orderbook density right on the candles.
          </p>
          <ul className="space-y-3 pt-4">
            {['Auto-drawn Support & Resistance', 'Pattern recognition (Head & Shoulders, Flags)', 'Liquidity heatmaps'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 w-full"
        >
          <div className="relative rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/30 transition-colors"></div>
            
            <div className="relative z-10 bg-[#020817] rounded-2xl border border-white/[0.05] p-6 shadow-inner h-[250px] flex items-center justify-center overflow-hidden">
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(16,185,129,0.1)_50%,transparent_100%)] bg-[length:100%_4px] opacity-30"></div>
              <motion.div 
                animate={{ y: ["-10%", "110%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent pointer-events-none"
              />
              
              <div className="text-center z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-4">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  SCANNING PATTERNS...
                </div>
                <div className="space-y-2">
                  <div className="h-1 w-32 bg-white/10 rounded-full mx-auto"></div>
                  <div className="h-1 w-24 bg-white/10 rounded-full mx-auto"></div>
                  <div className="h-1 w-16 bg-white/10 rounded-full mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
