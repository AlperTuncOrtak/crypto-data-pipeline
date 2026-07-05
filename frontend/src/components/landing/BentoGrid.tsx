import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Brain, Activity, Wallet, Cpu } from "lucide-react";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 30, filter: "blur(8px)" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function BentoGrid() {
  const [fearGreed, setFearGreed] = useState(76);
  const [balance, setBalance] = useState(124592.00);
  const [orderbook, setOrderbook] = useState([
    { pair: "BTC-PERP", pnl: "+2.4", color: "emerald" },
    { pair: "ETH-PERP", pnl: "-1.2", color: "rose" },
    { pair: "SOL-PERP", pnl: "+5.8", color: "emerald" }
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
          color: val >= 0 ? "emerald" : "rose"
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative z-10 px-6 lg:px-12 max-w-[1400px] mx-auto mb-32">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bento 1: AI Market Analysis */}
        <FadeIn delay={0.1} className="md:col-span-2 relative group overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-8 md:p-10 min-h-[350px] flex flex-col justify-between backdrop-blur-2xl shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-cyan-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-white/[0.05] bg-[#020817]/60 overflow-hidden p-6 shadow-2xl flex items-center justify-center">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="flex items-center gap-8 w-full max-w-sm">
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#22d3ee" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * fearGreed / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{fearGreed}</span>
                  <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">{fearGreed > 75 ? "Extr. Greed" : fearGreed > 55 ? "Greed" : fearGreed > 45 ? "Neutral" : "Fear"}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div style={{ width: `${Math.min(100, fearGreed + 10)}%` }} className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_#10b981]"></div></div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div style={{ width: `${fearGreed}%` }} className="h-full bg-cyan-400 transition-all duration-1000 shadow-[0_0_10px_#22d3ee]"></div></div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div style={{ width: `${Math.max(0, fearGreed - 20)}%` }} className="h-full bg-rose-500 transition-all duration-1000 shadow-[0_0_10px_#f43f5e]"></div></div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 mt-auto">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]">
              <Brain className="text-cyan-400" size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight text-white">AI Market Analysis</h3>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed">
              Our proprietary AI analyzes sentiment across millions of data points, giving you an edge with real-time Fear & Greed indices and predictive modeling.
            </p>
          </div>
        </FadeIn>

        {/* Bento 2: Real-Time Data */}
        <FadeIn delay={0.2} className="relative group overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-8 md:p-10 min-h-[350px] flex flex-col justify-between backdrop-blur-2xl shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-white/[0.05] bg-[#020817]/60 overflow-hidden p-5 shadow-2xl flex flex-col justify-end gap-3">
            {orderbook.map((o, i) => (
              <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-lg bg-${o.color}-500/10 border border-${o.color}-500/20 transition-all duration-300`}>
                <span className={`text-[11px] font-mono font-semibold text-${o.color}-400`}>{o.pair}</span>
                <span className={`text-xs font-bold text-${o.color}-400`}>{o.pnl}%</span>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-auto">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6">
              <Activity className="text-slate-300" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-tight text-white">Real-Time Data</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Millisecond-precision websocket feeds straight to your dashboard. No delays.
            </p>
          </div>
        </FadeIn>

        {/* Bento 3: Portfolio Sync */}
        <FadeIn delay={0.3} className="relative group overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-8 md:p-10 min-h-[350px] flex flex-col justify-between backdrop-blur-2xl shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
          <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-white/[0.05] bg-[#020817]/60 overflow-hidden p-5 shadow-2xl flex flex-col items-center justify-center relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15]"></div>
             <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", delay: 0.4 }} className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 z-10 relative">
               <Wallet className="text-cyan-400" size={24} />
               <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-[#020817]"></div>
             </motion.div>
             <div className="text-xl font-black text-white z-10 font-mono tracking-tight">${balance.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
             <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="text-[10px] font-bold text-slate-500 z-10 mt-1.5 uppercase tracking-widest">Total Balance</motion.div>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6">
              <Wallet className="text-slate-300" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-tight text-white">Portfolio Sync</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automatically import trades via CSV or connect on-chain wallets for tracking.
            </p>
          </div>
        </FadeIn>

        {/* Bento 4: Algorithmic Edge */}
        <FadeIn delay={0.4} className="md:col-span-2 relative group overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/[0.08] p-8 md:p-10 min-h-[350px] flex flex-col justify-between backdrop-blur-2xl shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
           <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-cyan-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 mb-10 w-full rounded-2xl border border-white/[0.05] bg-[#020817]/60 overflow-hidden p-8 shadow-2xl flex flex-col justify-center font-mono text-xs md:text-sm text-slate-500 relative">
             <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none"></div>
             <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-purple-400">import <span className="text-white">{' { MarketMaker } '}</span> from <span className="text-emerald-400">'@crypto/algo'</span>;</motion.div>
             <br/>
             <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.8 }}><span className="text-blue-400">const</span> <span className="text-white">strategy</span> = <span className="text-blue-400">new</span> <span className="text-yellow-200">MarketMaker</span>({'{'}</motion.div>
             <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.2 }} className="pl-6">pair: <span className="text-emerald-400">'BTC/USDT'</span>,</motion.div>
             <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.6 }} className="pl-6">riskFactor: <span className="text-orange-400">0.05</span>,</motion.div>
             <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.0 }} className="pl-6">leverage: <span className="text-orange-400">10</span>,</motion.div>
             <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.4 }}>{'}'});</motion.div>
             <br/>
             <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.8 }}><span className="text-white">strategy</span>.<span className="text-yellow-200">execute</span>(); <span className="text-emerald-400 font-bold ml-3 animate-pulse">// Running...</span></motion.div>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6">
              <Cpu className="text-slate-300" size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight text-white">Algorithmic Edge</h3>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed">
              Utilize advanced quantitative metrics typically reserved for institutional trading desks, simplified into an elegant UI.
            </p>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
