import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Filter, Search, ChevronDown, Activity, ArrowUpRight, ArrowDownRight, Wallet, Eye, AlertTriangle, CheckCircle2, TrendingUp, Layers, ShieldAlert, ExternalLink } from "lucide-react";
import ProPaywall from "../components/layout/ProPaywall";
import { useTranslation } from "react-i18next";

export default function WhaleXRay() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  // Simulation data
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasResult(false);
    
    setTimeout(() => {
      setIsSearching(false);
      setHasResult(true);
    }, 2000); // simulate 2s loading
  };

  const MOCK_ASSETS = [
    { coin: "ETH", amount: "1,450.00", value: ",930,000", percentage: 45, color: "bg-blue-500" },
    { coin: "PEPE", amount: "450B", value: ",150,000", percentage: 30, color: "bg-green-500" },
    { coin: "LINK", amount: "85,000", value: ",615,000", percentage: 15, color: "bg-purple-500" },
    { coin: "USDC", amount: "1,000,000", value: ",000,000", percentage: 10, color: "bg-gray-400" },
  ];

  const MOCK_TXS = [
    { type: "buy", token: "PEPE", amount: "", time: "2 mins ago", dex: "Uniswap" },
    { type: "sell", token: "WIF", amount: ".2M", time: "4 hours ago", dex: "Raydium" },
    { type: "buy", token: "ETH", amount: "", time: "12 hours ago", dex: "1inch" },
    { type: "transfer", token: "USDC", amount: "", time: "1 day ago", dex: "Binance" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white pt-24 pb-20 px-6 lg:px-12 relative overflow-hidden">
      
      {/* Background Cinematic Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.3, 1] }} 
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 -left-1/4 w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[120px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[#0a0b0d]/60 backdrop-blur-[50px] z-10"></div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto">
        <ProPaywall featureName="Whale X-Ray">
          
        {/* Header & Search Bar */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-16 h-16 rounded-[32px] bg-white/5 border border-[#273951]/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <Eye className="text-white" size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4"
          >
            Whale <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">X-Ray</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-lg text-lg mb-10"
          >
            Paste any EVM or Solana wallet address to scan its portfolio, PnL, and AI risk profile.
          </motion.p>

          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSearch}
            className="w-full max-w-2xl relative group"
          >
            {/* Search Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-white/10 to-emerald-500/20 rounded-full blur-lg opacity-50 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
            
            <div className="relative flex items-center bg-[#16181c]/80 backdrop-blur-2xl border border-[#273951]/50 rounded-full p-2 overflow-hidden shadow-2xl transition-colors hover:border-emerald-500/30">
              <div className="pl-4 pr-2 flex items-center justify-center">
                <Search size={20} className="text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="0x... or solana address"
                className="w-full bg-transparent border-none outline-none text-white px-2 py-3 font-mono text-lg placeholder:text-gray-500"
              />
              <button 
                type="submit"
                disabled={isSearching}
                className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full" />
                    Scanning
                  </>
                ) : "Scan Wallet"}
              </button>
            </div>
          </motion.form>
        </div>

        {/* Results Area */}
        <AnimatePresence>
          {hasResult && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              
              {/* Portfolio Net Worth */}
              <motion.div whileHover={{ y: -4 }} className="md:col-span-2 rounded-[32px] bg-[#16181c]/60 backdrop-blur-xl border border-[#273951]/50 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Wallet size={20} className="text-emerald-400" />
                    <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-sm">Portfolio Net Worth</h3>
                  </div>
                  <div className="flex items-end gap-4 mb-2">
                    <h2 className="text-5xl font-black text-white tracking-tight">,695,000</h2>
                    <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full font-bold text-sm mb-2 border border-emerald-400/20">
                      <ArrowUpRight size={16} /> +12.4% (24h)
                    </div>
                  </div>
                  <p className="text-gray-500 font-mono text-sm">0x71c...9A2b • Active 2 mins ago</p>
                </div>

                <div className="relative z-10 mt-10 w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                  {MOCK_ASSETS.map((asset, i) => (
                    <div key={i} style={{ width: `${asset.percentage}%` }} className={`h-full ${asset.color}`} />
                  ))}
                </div>
                
                <div className="relative z-10 mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {MOCK_ASSETS.map((asset, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${asset.color}`}></span>
                        <span className="text-white font-bold">{asset.coin}</span>
                      </div>
                      <span className="text-gray-400 text-sm font-mono">{asset.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* AI Risk Score */}
              <motion.div whileHover={{ y: -4 }} className="rounded-[32px] bg-[#16181c]/60 backdrop-blur-xl border border-[#273951]/50 p-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none group-hover:from-red-500/10 transition-colors duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldAlert size={20} className="text-red-400" />
                    <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-sm">AI Risk Profiler</h3>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                    <div className="w-24 h-24 rounded-full border-[6px] border-red-500/20 flex items-center justify-center mb-4 relative">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="#ef4444" strokeWidth="6" strokeDasharray="100 100" strokeDashoffset="25" strokeLinecap="round" />
                      </svg>
                      <span className="text-3xl font-black text-white">85</span>
                    </div>
                    <h4 className="text-red-400 font-bold text-lg mb-1">High Risk Degen</h4>
                    <p className="text-gray-500 text-sm">High allocation to unverified memecoins. Extreme volatility detected.</p>
                  </div>
                </div>
              </motion.div>

              {/* Recent Moves */}
              <motion.div whileHover={{ y: -4 }} className="md:col-span-3 rounded-[32px] bg-[#16181c]/60 backdrop-blur-xl border border-[#273951]/50 p-8 relative overflow-hidden group">
                 <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Activity size={20} className="text-blue-400" />
                      <h3 className="text-white font-bold text-xl">Recent Moves</h3>
                    </div>
                    <button className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">View All on Etherscan</button>
                  </div>

                  <div className="space-y-3">
                    {MOCK_TXS.map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white-[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'buy' ? 'bg-green-500/10 text-green-400' : tx.type === 'sell' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {tx.type === 'buy' ? <ArrowDownRight size={18} /> : tx.type === 'sell' ? <ArrowUpRight size={18} /> : <TrendingUp size={18} />}
                          </div>
                          <div>
                            <p className="text-white font-bold capitalize">{tx.type} {tx.token}</p>
                            <p className="text-xs text-gray-500">{tx.dex}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-mono font-bold">{tx.amount}</p>
                          <p className="text-xs text-gray-500">{tx.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
        </ProPaywall>

      </div>
    </div>
  );
}

