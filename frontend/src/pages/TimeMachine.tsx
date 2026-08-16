import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Brain, TrendingUp, TrendingDown, Target, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import NumberFlow from "@number-flow/react";
import { useMarket } from "../hooks/useMarket";
import { useTimeMachine } from "../hooks/useTimeMachine";
import ProPaywall from "../components/layout/ProPaywall";

export default function TimeMachine() {
  const { t } = useTranslation();
  const { data: marketData, isLoading: isMarketLoading } = useMarket();
  
  const [daysAgo, setDaysAgo] = useState(30);
  const [investment, setInvestment] = useState(1000);
  const [search, setSearch] = useState("");
  
  // Default to bitcoin if available
  const [selectedCoinId, setSelectedCoinId] = useState<string>("bitcoin");
  
  // Find full coin object from market data
  const selectedCoin = useMemo(() => {
    if (!marketData) return null;
    return marketData.find((c) => c.id === selectedCoinId) || marketData[0];
  }, [marketData, selectedCoinId]);

  // Fetch history for the selected coin
  const { history, isLoading: isHistoryLoading, error } = useTimeMachine(selectedCoin?.id || null);

  // Search filter
  const filteredCoins = useMemo(() => {
    if (!marketData) return [];
    return marketData.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.symbol.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 12);
  }, [marketData, search]);

  // Simulation Math
  const simulation = useMemo(() => {
    if (!history || history.length === 0 || !selectedCoin) return null;
    
    // Find the closest data point to 'daysAgo'
    const targetTime = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
    
    // The history array from CoinGecko is sorted by timestamp ascending
    let closestPoint = history[0];
    let minDiff = Infinity;
    
    for (const point of history) {
      const diff = Math.abs(point.timestamp - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = point;
      }
    }

    const oldPrice = closestPoint.price;
    const currentPrice = selectedCoin.current_price;
    
    const coinsBought = investment / oldPrice;
    const simulatedValue = coinsBought * currentPrice;
    const pnl = ((simulatedValue - investment) / investment) * 100;
    
    return {
      oldPrice,
      currentPrice,
      simulatedValue,
      pnl,
      date: new Date(closestPoint.timestamp).toLocaleDateString()
    };
  }, [history, selectedCoin, daysAgo, investment]);

  const isSimulating = isHistoryLoading || isMarketLoading || !simulation;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] pt-24 pb-20 px-6 lg:px-12 relative overflow-hidden">
      
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
        <div className="absolute inset-0 bg-[var(--bg-base)]/50 backdrop-blur-[40px] z-10"></div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto">
        <ProPaywall featureName="Time-Machine Backtesting">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-[32px] bg-white/5 border border-[var(--border-base)] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <History className="text-[var(--text-main)]" size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-[var(--text-main)] mb-4"
          >
            Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-600">Machine</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-muted)] max-w-lg text-lg"
          >
            Real historical backtesting. "What if I invested $1,000 into {selectedCoin?.name || 'Bitcoin'} {daysAgo} days ago?"
          </motion.p>
        </div>

        {/* Controls Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[32px] bg-[var(--bg-subtle)]/80 backdrop-blur-2xl border border-[var(--border-base)] p-8 mb-12 shadow-2xl relative z-20 group"
        >
           <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-[32px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
             
             {/* Coin Selector */}
             <div className="flex flex-col gap-3">
               <label className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Asset</label>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search coins..."
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="w-full bg-black/40 border border-[var(--border-base)] rounded-3xl py-3 pl-10 pr-4 text-[var(--text-main)] font-medium outline-none focus:border-purple-500/50 transition-colors mb-3"
                 />
               </div>
               <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                 {filteredCoins.map(c => (
                   <button
                     key={c.id}
                     onClick={() => setSelectedCoinId(c.id)}
                     className={`flex items-center gap-2 py-2 px-3 rounded-3xl font-bold text-xs transition-all ${selectedCoinId === c.id ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg' : 'bg-transparent border-transparent text-[var(--text-muted)] hover:bg-[var(--border-subtle)] border'} `}
                   >
                     <img src={c.image} alt={c.name} className="w-4 h-4 rounded-full" />
                     {c.symbol.toUpperCase()}
                   </button>
                 ))}
               </div>
             </div>

             {/* Investment */}
             <div className="flex flex-col gap-3">
               <label className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Initial Investment ($)</label>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">$</span>
                 <input 
                   type="number" 
                   value={investment}
                   onChange={e => setInvestment(Number(e.target.value))}
                   className="w-full bg-black/40 border border-[var(--border-base)] rounded-3xl py-4 pl-8 pr-4 text-[var(--text-main)] font-mono text-xl outline-none focus:border-purple-500/50 transition-colors"
                 />
               </div>
             </div>

             {/* Timeline Slider */}
             <div className="flex flex-col gap-3">
               <div className="flex justify-between items-center">
                 <label className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Time Travel</label>
                 <span className="text-purple-400 font-bold bg-purple-400/10 px-3 py-1 rounded-2xl text-sm">{daysAgo} Days Ago</span>
               </div>
               <div className="relative pt-4">
                 <input 
                   type="range" 
                   min="1" max="365" 
                   value={daysAgo}
                   onChange={e => setDaysAgo(Number(e.target.value))}
                   className="w-full h-2 bg-black/50 rounded-2xl appearance-none cursor-pointer accent-purple-500"
                 />
                 <div className="flex justify-between mt-2 text-[10px] font-mono text-[var(--text-muted)] uppercase">
                   <span>Yesterday</span>
                   <span>6 Months</span>
                   <span>1 Year</span>
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
            className="md:col-span-2 rounded-[32px] bg-[var(--bg-subtle)]/60 backdrop-blur-xl border border-[var(--border-base)] p-8 relative overflow-hidden group min-h-[300px] flex flex-col justify-center"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Target size={20} className="text-purple-400" />
                <h3 className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-sm">Simulated Return</h3>
              </div>
              {simulation && (
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  Entry Date: {simulation.date}
                </div>
              )}
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
                    <h2 className="text-6xl md:text-7xl font-black text-[var(--text-main)] tracking-tight font-mono">
                      $<NumberFlow value={simulation.simulatedValue} format={{ maximumFractionDigits: 0 }} />
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-lg border ${simulation.pnl >= 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {simulation.pnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      {simulation.pnl > 0 ? '+' : ''}<NumberFlow value={simulation.pnl} format={{ maximumFractionDigits: 2 }} />%
                    </div>
                    <p className="text-[var(--text-muted)] font-medium text-sm md:text-base">
                      If you bought ${investment} of <span className="text-[var(--text-main)] font-bold">{selectedCoin?.name}</span> at <span className="text-[var(--text-main)]">${simulation.oldPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* AI Hindsight Card */}
          <motion.div 
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-[32px] bg-[var(--bg-subtle)]/60 backdrop-blur-xl border border-[var(--border-base)] p-8 relative overflow-hidden group flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none group-hover:from-blue-500/10 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex items-center gap-3 mb-6">
              <Brain size={20} className="text-blue-400" />
              <h3 className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-sm">AI Hindsight</h3>
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col justify-center">
              {isSimulating || !simulation ? (
                 <div className="space-y-3 animate-pulse">
                   <div className="h-4 bg-white/5 rounded w-3/4"></div>
                   <div className="h-4 bg-white/5 rounded w-full"></div>
                   <div className="h-4 bg-white/5 rounded w-5/6"></div>
                 </div>
              ) : (
                <>
                  <p className="text-gray-300 leading-relaxed italic mb-4">
                    "{simulation.pnl > 500 ? "Masterclass execution. Entering the ecosystem right before the major liquidity rotation was the perfect play." : simulation.pnl > 0 ? "A solid, defensive entry. Capital preservation combined with steady upside." : "Caught the top of the local narrative bubble. Classic retail trap."}"
                  </p>
                  <div className="mt-auto flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">CryptoNeko DeepSeek-v3</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

        </div>
        </ProPaywall>

      </div>
    </div>
  );
}
