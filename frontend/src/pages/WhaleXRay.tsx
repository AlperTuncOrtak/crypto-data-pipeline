import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Filter, Search, ChevronDown, Activity, ArrowUpRight, ArrowDownRight, Wallet, Eye, AlertTriangle, CheckCircle2, TrendingUp, Layers, ShieldAlert, ExternalLink } from "lucide-react";
import { CardSkeleton } from "../components/ui/Skeleton";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/client";

export default function WhaleXRay() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState<any>(null);
  const [hasResult, setHasResult] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasResult(false);
    setData(null);
    
    try {
      // apiClient VITE_API_URL'i kullanir (api.cryptoneko.online).
      // Onceden window.location.host'a istek atiliyordu; prod'da bu
      // www.cryptoneko.online demekti ve istek HER ZAMAN basarisiz olup
      // asagidaki sabit sahte veriye dusuyordu.
      const { data: result } = await apiClient.get(
        `/api/whales/analyze/${searchQuery.trim()}`
      );
      setData(result);
      setHasResult(true);
    } catch (error: any) {
      console.error("Failed to fetch whale data:", error);
      // Sahte veriye DUSMUYORUZ — ne oldugunu durustce soyluyoruz.
      setData({
        address: searchQuery,
        available: false,
        reason:
          error?.response?.data?.detail ||
          "Could not reach the on-chain data service. Please try again.",
        assets: [],
        transactions: [],
      });
      setHasResult(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] text-[var(--text-main)] pt-24 pb-20 px-6 lg:px-12 relative overflow-hidden">
      
      {/* Background Cinematic Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-[var(--positive-muted)]/10 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.3, 1] }} 
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 -left-1/4 w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[120px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[var(--bg-base)]/60 backdrop-blur-[50px] z-10"></div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto">
          
        {/* Header & Search Bar */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-16 h-16 rounded-[32px] bg-white/5 border border-[var(--border-base)] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <Eye className="text-[var(--text-main)]" size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-[var(--text-main)] mb-4"
          >
            Whale <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]">X-Ray</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-muted)] max-w-lg text-lg mb-10"
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
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)]/20 via-white/10 to-[var(--accent)]/20 rounded-full blur-lg opacity-50 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
            
            <div className="relative flex items-center bg-[var(--bg-base)]/80 backdrop-blur-2xl border border-[var(--border-base)] rounded-full p-2 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-colors hover:border-[var(--accent)]/50">
              <div className="pl-4 pr-2 flex items-center justify-center">
                <Search size={20} className="text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="0x... or solana address"
                className="w-full bg-transparent border-none outline-none text-[var(--text-main)] px-2 py-3 font-mono text-lg placeholder:text-[var(--text-muted)]"
              />
              <button 
                type="submit"
                disabled={isSearching}
                className="px-8 py-3 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] border-none font-bold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          {isSearching && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="md:col-span-2">
                <CardSkeleton />
              </div>
              <div className="md:col-span-1">
                <CardSkeleton />
              </div>
            </motion.div>
          )}

          {/* Zincir verisi alinamadi: sahte portfoy uydurmak yerine nedeni soyle */}
          {hasResult && !isSearching && data?.available === false && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] p-10 text-center"
            >
              <ShieldAlert size={28} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <h3 className="text-[var(--text-main)] font-semibold text-lg mb-2">
                No on-chain data for this address
              </h3>
              <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
                {data?.reason}
              </p>
              <p className="text-[var(--text-muted)] text-xs mt-4 opacity-60">
                Ethereum mainnet only. Check the address and try again.
              </p>
            </motion.div>
          )}

          {hasResult && !isSearching && data?.available !== false && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              
              {/* Portfolio Net Worth */}
              <motion.div whileHover={{ y: -4 }} className="md:col-span-2 rounded-[32px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] p-8 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--positive-muted)]/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-[var(--positive-muted)]/20 transition-colors duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Wallet size={20} className="text-[var(--accent)]" />
                    <h3 className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-sm">Portfolio Net Worth</h3>
                  </div>
                  <div className="flex items-end gap-4 mb-2">
                    <h2 className="text-5xl font-black text-[var(--text-main)] tracking-tight">
                      ${data?.assets?.reduce((sum: number, a: any) => sum + Number(a.value.replace(/[^0-9.-]+/g,"")), 0).toLocaleString(undefined, {maximumFractionDigits: 0}) || "0"}
                    </h2>
                    <div className="flex items-center gap-1 text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 rounded-full font-bold text-sm mb-2 border border-[var(--accent)]/20">
                      <ArrowUpRight size={16} /> +12.4% (24h)
                    </div>
                  </div>
                  <p className="text-[var(--text-muted)] font-mono text-sm">{data?.address.slice(0, 6)}...{data?.address.slice(-4)} • Active recently</p>
                </div>

                <div className="relative z-10 mt-10 w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                  {data?.assets?.map((asset: any, i: number) => (
                    <div key={i} style={{ width: `${asset.percentage}%` }} className={`h-full ${asset.color}`} />
                  ))}
                </div>
                
                <div className="relative z-10 mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data?.assets?.map((asset: any, i: number) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${asset.color}`}></span>
                        <span className="text-[var(--text-main)] font-bold">{asset.coin}</span>
                      </div>
                      <span className="text-[var(--text-muted)] text-sm font-mono">{asset.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* AI Risk Score */}
              <motion.div whileHover={{ y: -4 }} className="rounded-[32px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] p-8 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[var(--negative)]/5 to-transparent pointer-events-none group-hover:from-[var(--negative)]/10 transition-colors duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldAlert size={20} className="text-[var(--negative)]" />
                    <h3 className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-sm">AI Risk Profiler</h3>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                    <div className="w-24 h-24 rounded-full border-[6px] border-[var(--negative)]/20 flex items-center justify-center mb-4 relative">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="#ef4444" strokeWidth="6" strokeDasharray="100 100" strokeDashoffset={100 - (data?.risk_score || 0)} strokeLinecap="round" />
                      </svg>
                      <span className="text-3xl font-black text-[var(--text-main)]">{data?.risk_score || 50}</span>
                    </div>
                    <h4 className="text-[var(--negative)] font-bold text-lg mb-1">{data?.risk_score > 70 ? "High Risk Degen" : data?.risk_score > 40 ? "Moderate Trader" : "Conservative"}</h4>
                    <p className="text-[var(--text-muted)] text-sm">{data?.ai_summary}</p>
                  </div>
                </div>
              </motion.div>

              {/* Recent Moves */}
              <motion.div whileHover={{ y: -4 }} className="md:col-span-3 rounded-[32px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] p-8 relative overflow-hidden group shadow-2xl">
                 <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Activity size={20} className="text-[var(--accent)]" />
                      <h3 className="text-[var(--text-main)] font-bold text-xl">Recent Moves</h3>
                    </div>
                    <button className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">View All on Etherscan</button>
                  </div>

                  <div className="space-y-3">
                    {data?.transactions?.map((tx: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-3xl bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'buy' ? 'bg-[var(--positive)]/10 text-[var(--positive)]' : tx.type === 'sell' ? 'bg-[var(--negative)]/10 text-[var(--negative)]' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
                            {tx.type === 'buy' ? <ArrowDownRight size={18} /> : tx.type === 'sell' ? <ArrowUpRight size={18} /> : <TrendingUp size={18} />}
                          </div>
                          <div>
                            <p className="text-[var(--text-main)] font-bold capitalize">{tx.type} {tx.token}</p>
                            <p className="text-xs text-[var(--text-muted)]">{tx.dex}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[var(--text-main)] font-mono font-bold">{tx.amount}</p>
                          <p className="text-xs text-[var(--text-muted)]">{tx.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
