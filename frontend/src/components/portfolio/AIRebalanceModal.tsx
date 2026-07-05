import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Zap, ArrowRight, ShieldCheck, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";

interface AIRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: any[]; // User's portfolio
}

type Phase = "scanning" | "results" | "executing";

export default function AIRebalanceModal({ isOpen, onClose, holdings }: AIRebalanceModalProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("scanning");
  const [scanText, setScanText] = useState("Initializing AI Risk Matrix...");
  
  // Dummy AI logic for demo purposes
  const volatileAsset = holdings.find(h => h.symbol === "PEPE" || h.symbol === "DOGE" || h.symbol === "SHIB") || { symbol: "Altcoins" };
  const safeAsset = { symbol: "ETH" };

  useEffect(() => {
    if (!isOpen) {
      setPhase("scanning");
      return;
    }

    // Sequence the scanning animation
    let t1, t2, t3;
    if (phase === "scanning") {
      t1 = setTimeout(() => setScanText(`Analyzing volatility of ${volatileAsset.symbol}...`), 1500);
      t2 = setTimeout(() => setScanText("Calculating Sharpe Ratio & Sentiment..."), 3000);
      t3 = setTimeout(() => {
        setPhase("results");
      }, 4500);
    }
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, phase, volatileAsset.symbol]);

  const handleExecute = () => {
    setPhase("executing");
    setTimeout(() => {
      onClose();
      navigate("/portfolio?tab=swap");
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0a0b0d]/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-[600px] bg-[#16181c] border border-blue-500/20 rounded-[32px] p-1 shadow-2xl overflow-hidden"
        >
          {/* Glowing Orbs */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

          <div className="relative z-10 bg-[#0a0b0d] rounded-[28px] overflow-hidden border border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-blue-900/10 to-purple-900/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Brain className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">AI Smart Rebalance</h2>
                  <div className="text-xs text-blue-400 font-mono flex items-center gap-1">
                    <Zap size={10} /> ENGINE V2 ACTIVE
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              
              {/* PHASE 1: SCANNING */}
              {phase === "scanning" && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="relative w-24 h-24 mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-[3px] border-transparent border-t-blue-500 border-b-purple-500 rounded-full"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-2 border-[2px] border-transparent border-l-blue-400 border-r-purple-400 rounded-full opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain size={32} className="text-white animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Scanning Portfolio</h3>
                  <div className="text-sm text-blue-400 font-mono tracking-wider">{scanText}</div>
                </motion.div>
              )}

              {/* PHASE 2: RESULTS */}
              {phase === "results" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* AI Logic Explanation */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                    <div className="mt-1">
                      <AlertTriangle className="text-blue-400" size={20} />
                    </div>
                    <div>
                      <h4 className="text-blue-300 font-bold mb-1">AI Audit Report</h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Your portfolio shows an over-exposure to high-volatility assets ({volatileAsset.symbol}). Network sentiment indicates a short-term correction. 
                        I recommend locking in profits by migrating a portion of your risk assets to {safeAsset.symbol}.
                      </p>
                    </div>
                  </div>

                  {/* Allocation Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Current */}
                    <div className="bg-[#16181c] border border-white/5 rounded-2xl p-4">
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">Current Allocation</div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> {volatileAsset.symbol}
                          </span>
                          <span className="font-mono text-white">45%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: '45%' }}></div></div>
                        
                        <div className="flex justify-between items-center text-sm pt-2">
                          <span className="text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> {safeAsset.symbol}
                          </span>
                          <span className="font-mono text-white">20%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '20%' }}></div></div>
                      </div>
                    </div>

                    {/* AI Recommended */}
                    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                        <TrendingUp size={10} /> OPTIMIZED
                      </div>
                      <div className="text-xs text-green-400 font-bold uppercase tracking-wider mb-4">Target Allocation</div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> {volatileAsset.symbol}
                          </span>
                          <span className="font-mono text-white">15% <span className="text-red-400 text-xs">(-30%)</span></span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: '15%' }}></div></div>
                        
                        <div className="flex justify-between items-center text-sm pt-2">
                          <span className="text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> {safeAsset.symbol}
                          </span>
                          <span className="font-mono text-white">50% <span className="text-green-400 text-xs">(+30%)</span></span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '50%' }}></div></div>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-2">
                    <button 
                      onClick={handleExecute}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
                    >
                      <ShieldCheck size={18} />
                      Execute 1-Click Rebalance
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* PHASE 3: EXECUTING */}
              {phase === "executing" && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                    className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
                  >
                    <CheckCircle2 size={40} className="text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Preparing Transaction</h3>
                  <div className="text-sm text-gray-400">Opening Swap interface to lock in profits...</div>
                </motion.div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
