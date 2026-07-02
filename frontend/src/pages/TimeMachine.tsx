import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Brain, TrendingUp, TrendingDown, Clock, Activity, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

const COINS = [
  { id: "SOL", name: "Solana", color: "text-purple-500", bg: "bg-purple-500", basePrice: 20 },
  { id: "PEPE", name: "Pepe", color: "text-green-500", bg: "bg-green-500", basePrice: 0.000001 },
  { id: "WIF", name: "dogwifhat", color: "text-orange-500", bg: "bg-orange-500", basePrice: 0.1 },
];

export default function TimeMachine() {
  const { t } = useTranslation();
  const [monthsAgo, setMonthsAgo] = useState(6);
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [investment, setInvestment] = useState(1000);

  // Simulation State
  const [simulatedPnl, setSimulatedPnl] = useState(0);
  const [simulatedValue, setSimulatedValue] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    // Run simulation whenever inputs change
    setIsSimulating(true);
    const timeout = setTimeout(() => {
      // Fake math to make it look realistic based on time and coin
      let multiplier = 1;
      if (selectedCoin.id === "SOL") multiplier = (monthsAgo / 12) * 5 + 1; // e.g. 6 months = 3.5x
      if (selectedCoin.id === "PEPE") multiplier = (monthsAgo / 12) * 20 - 2; // e.g. 6 months = 8x
      if (selectedCoin.id === "WIF") multiplier = (monthsAgo / 12) * 50 - 5; // highly volatile
      
      multiplier = Math.max(0.1, multiplier + (Math.random() * 0.5)); // add jitter
      
      const val = investment * multiplier;
      setSimulatedValue(val);
      setSimulatedPnl(((val - investment) / investment) * 100);
      setIsSimulating(false);
    }, 400); // quick simulation delay

    return () => clearTimeout(timeout);
  }, [monthsAgo, selectedCoin, investment]);

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white pt-24 pb-20 px-6 lg:px-12 relative overflow-hidden">
      
      {/* Background Cinematic Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px] mix-blend-screen"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.5, 1] }} 
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[#0a0b0d]/50 backdrop-blur-[40px] z-10"></div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-[32px] bg-white/5 border border-[#273951]/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <History className="text-white" size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4"
          >
            Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-600">Machine</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-lg text-lg"
          >
            Simulate historical backtests. "What if I invested $1,000 into SOL 6 months ago?"
          </motion.p>
        </div>

        {/* Controls Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[32px] bg-[#16181c]/80 backdrop-blur-2xl border border-[#273951]/50 p-8 mb-12 shadow-2xl relative z-20 group"
        >
           <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-[32px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
             
             {/* Coin Selector */}
             <div className="flex flex-col gap-3">
               <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Asset</label>
               <div className="flex gap-2">
                 {COINS.map(c => (
                   <button
                     key={c.id}
                     onClick={() => setSelectedCoin(c)}
                     className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all ${selectedCoin.id === c.id ? `bg-white/10 border-white/20 text-white shadow-lg` : `bg-transparent border-transparent text-gray-500 hover:bg-white/5 border`} `}
                   >
                     {c.id}
                   </button>
                 ))}
               </div>
             </div>

             {/* Investment */}
             <div className="flex flex-col gap-3">
               <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Investment ($)</label>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                 <input 
                   type="number" 
                   value={investment}
                   onChange={e => setInvestment(Number(e.target.value))}
                   className="w-full bg-black/40 border border-[#273951]/50 rounded-xl py-3 pl-8 pr-4 text-white font-mono outline-none focus:border-purple-500/50 transition-colors"
                 />
               </div>
             </div>

             {/* Timeline Slider */}
             <div className="flex flex-col gap-3">
               <div className="flex justify-between items-center">
                 <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Time Travel</label>
                 <span className="text-purple-400 font-bold bg-purple-400/10 px-2 py-0.5 rounded text-xs">{monthsAgo} Months Ago</span>
               </div>
               <div className="relative pt-2">
                 <input 
                   type="range" 
                   min="1" max="24" 
                   value={monthsAgo}
                   onChange={e => setMonthsAgo(Number(e.target.value))}
                   className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
                 />
                 <div className="flex justify-between mt-2 text-[10px] font-mono text-gray-500 uppercase">
                   <span>1m</span>
                   <span>12m</span>
                   <span>24m</span>
                 </div>
               </div>
             </div>

           </div>
        </motion.div>

        {/* Results Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main ROI Card */}
          <motion.div 
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="md:col-span-2 rounded-[32px] bg-[#16181c]/60 backdrop-blur-xl border border-[#273951]/50 p-8 relative overflow-hidden group min-h-[300px] flex flex-col justify-center"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex items-center gap-3 mb-6">
              <Target size={20} className={selectedCoin.color} />
              <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-sm">Simulated Return</h3>
            </div>

            <AnimatePresence mode="wait">
              {isSimulating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center flex-1"
                >
                  <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative z-10 flex flex-col"
                >
                  <div className="flex items-end gap-6 mb-4">
                    <h2 className="text-6xl md:text-7xl font-black text-white tracking-tight font-mono">
                      ${simulatedValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-lg border ${simulatedPnl >= 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {simulatedPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      {simulatedPnl > 0 ? '+' : ''}{simulatedPnl.toLocaleString("en-US", { maximumFractionDigits: 2 })}%
                    </div>
                    <p className="text-gray-500 font-medium">
                      If you bought ${investment} of <span className="text-white">{selectedCoin.name}</span> {monthsAgo} months ago.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* AI Hindsight Card */}
          <motion.div 
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-[32px] bg-[#16181c]/60 backdrop-blur-xl border border-[#273951]/50 p-8 relative overflow-hidden group flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none group-hover:from-blue-500/10 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex items-center gap-3 mb-6">
              <Brain size={20} className="text-blue-400" />
              <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-sm">AI Hindsight</h3>
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col justify-center">
              {isSimulating ? (
                 <div className="space-y-3 animate-pulse">
                   <div className="h-4 bg-white/5 rounded w-3/4"></div>
                   <div className="h-4 bg-white/5 rounded w-full"></div>
                   <div className="h-4 bg-white/5 rounded w-5/6"></div>
                 </div>
              ) : (
                <>
                  <p className="text-gray-300 leading-relaxed italic mb-4">
                    "{simulatedPnl > 500 ? "Masterclass execution. Entering the ecosystem right before the major liquidity rotation was the perfect play." : simulatedPnl > 0 ? "A solid, defensive entry. Capital preservation combined with steady upside." : "Caught the top of the local narrative bubble. Classic retail trap."}"
                  </p>
                  <div className="mt-auto flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">CryptoNeko DeepSeek-v3</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}

