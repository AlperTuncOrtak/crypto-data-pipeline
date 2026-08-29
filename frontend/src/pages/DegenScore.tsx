import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BrainCircuit, Share2, Wallet, RefreshCcw, Fingerprint, Activity } from "lucide-react";
import AnimatedLogo from "../components/layout/AnimatedLogo";
import { useNavigate } from "react-router-dom";

const RANKS = [
  { name: "Diamond Hands", color: "#60a5fa", desc: "You hold through -80% drawdowns. A true believer (or clinically insane).", shadow: "rgba(96,165,250,0.5)" },
  { name: "Paper Hands", color: "#f43f5e", desc: "You sell the moment your portfolio drops 2%. The liquidity provider for whales.", shadow: "rgba(244,63,94,0.5)" },
  { name: "Ape Sniper", color: "#10b981", desc: "You buy meme coins 2 seconds after liquidity is added. Godspeed.", shadow: "rgba(16,185,129,0.5)" },
  { name: "Yield Boomer", color: "#f59e0b", desc: "Farming 4% APY on stablecoins while the market does 10x. Very safe, very boring.", shadow: "rgba(245,158,11,0.5)" },
];

export default function DegenScore() {
  const [address, setAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || address.length < 5) return;
    
    setIsScanning(true);
    setResult(null);
    setScanStep(0);

    const steps = 4;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      setScanStep(currentStep);
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setTimeout(() => {
          generateMockResult(address);
          setIsScanning(false);
        }, 600);
      }
    }, 800);
  };

  const generateMockResult = (wallet: string) => {
    const hash = wallet.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    const rankIndex = Math.abs(hash) % RANKS.length;
    const rank = RANKS[rankIndex];
    
    setResult({
      wallet: wallet,
      rank: rank,
      score: Math.floor(Math.abs(hash % 100)),
      fomoRate: Math.floor(Math.abs((hash * 2) % 100)),
      panicRate: Math.floor(Math.abs((hash * 3) % 100)),
      topToken: ["PEPE", "SHIB", "DOGE", "ETH", "LINK", "SOL"][Math.abs(hash) % 6],
    });
  };

  const shareOnX = () => {
    const text = encodeURIComponent(`I got ranked as a ${result?.rank.name} with a Degen Score of ${result?.score} on CryptoNeko! 🐈‍⬛🔥\n\nCheck your wallet's on-chain score:`);
    const url = encodeURIComponent(`https://cryptoneko.com/degen-score`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const shareOnFarcaster = () => {
    const text = encodeURIComponent(`I got ranked as a ${result?.rank.name} with a Degen Score of ${result?.score} on CryptoNeko! 🐈‍⬛🔥\n\nCheck your wallet's on-chain score:`);
    const embedUrl = encodeURIComponent(`https://cryptoneko.com/degen-score`);
    window.open(`https://warpcast.com/~/compose?text=${text}&embeds[]=${embedUrl}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#020204] text-[var(--text-main)] font-sans relative flex flex-col items-center overflow-x-hidden selection:bg-[var(--accent)] selection:text-white pb-20">
      
      <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="cursor-pointer" onClick={() => navigate("/")}>
          <AnimatedLogo />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto mt-12 px-4 flex flex-col items-center">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <BrainCircuit size={14} className="text-[var(--accent)]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">AI Wallet Profiler</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
            What's Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Degen Score?</span>
          </h1>
          <p className="text-[15px] text-white/50 max-w-md mx-auto leading-relaxed">
            Connect your wallet or enter an address. Our AI will analyze your on-chain history and roast your trading habits.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="w-full relative">
          <form onSubmit={handleScan} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-[20px] blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative flex items-center bg-[#0a0a0f] border border-white/10 rounded-[20px] p-2 shadow-2xl">
              <div className="pl-4 pr-2 text-white/40">
                <Wallet size={20} />
              </div>
              <input
                type="text"
                placeholder="Enter 0x address or ENS..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-[15px] font-mono h-12"
              />
              <button
                type="submit"
                disabled={isScanning || !address}
                className="h-12 px-6 rounded-[14px] bg-white text-black font-bold text-[14px] hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isScanning ? <RefreshCcw size={16} className="animate-spin" /> : "Scan Wallet"}
              </button>
            </div>
          </form>
        </motion.div>

        <AnimatePresence mode="wait">
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full mt-12 flex flex-col items-center justify-center gap-4 overflow-hidden"
            >
              <Fingerprint size={48} className="text-[var(--accent)] animate-pulse" />
              <div className="flex flex-col items-center gap-2">
                <p className="text-[13px] font-mono text-white/60">
                  {scanStep === 0 && "Connecting to node..."}
                  {scanStep === 1 && "Fetching transaction history..."}
                  {scanStep === 2 && "Analyzing FOMO indices..."}
                  {scanStep === 3 && "Running LLM behavioral models..."}
                  {scanStep >= 4 && "Generating verdict..."}
                </p>
                <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[var(--accent)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(scanStep / 4) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {result && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full mt-12 relative"
            >
              <div className="absolute -inset-1 rounded-[32px] blur-xl opacity-30" style={{ background: result.rank.color }} />
              
              <div className="relative bg-[#0d0d12] border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border-[4px]" style={{ borderColor: `${result.rank.color}40`, background: `${result.rank.color}10`, boxShadow: `0 0 30px ${result.rank.shadow}` }}>
                    <Activity size={36} color={result.rank.color} />
                  </div>
                  
                  <h3 className="text-[12px] font-mono text-white/50 mb-2">{result.wallet.slice(0,6)}...{result.wallet.slice(-4)}</h3>
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight" style={{ textShadow: `0 0 20px ${result.rank.shadow}` }}>
                    {result.rank.name}
                  </h2>
                  <p className="text-[15px] text-white/70 max-w-sm mb-10">
                    {result.rank.desc}
                  </p>

                  <div className="grid grid-cols-2 gap-4 w-full mb-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Degen Score</span>
                      <span className="text-3xl font-black text-white">{result.score}<span className="text-sm text-white/30">/100</span></span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">FOMO Rate</span>
                      <span className="text-3xl font-black" style={{ color: result.fomoRate > 70 ? "#f43f5e" : "#10b981" }}>{result.fomoRate}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                    <button onClick={shareOnX} className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-black text-white font-bold hover:bg-zinc-900 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
                      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className="w-4 h-4"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
                      Share on X
                    </button>
                    <button onClick={shareOnFarcaster} className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#855DCD] text-white font-bold hover:bg-[#724bb8] transition-colors shadow-[0_0_20px_rgba(133,93,205,0.3)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.24.24H5.76A5.76 5.76 0 0 0 0 6v12a5.76 5.76 0 0 0 5.76 5.76h12.48A5.76 5.76 0 0 0 24 18V6a5.76 5.76 0 0 0-5.76-5.76zM15 16.5a1.5 1.5 0 0 1-3 0v-1.5h-3a1.5 1.5 0 0 1 0-3h6a1.5 1.5 0 0 1 0 3h-3v1.5zm1.5-6h-9a1.5 1.5 0 0 1 0-3h9a1.5 1.5 0 0 1 0 3z" fill="currentColor"/></svg>
                      Warpcast
                    </button>
                    <button onClick={() => setResult(null)} className="w-12 flex-shrink-0 flex items-center justify-center h-12 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 font-bold transition-colors">
                      <RefreshCcw size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
