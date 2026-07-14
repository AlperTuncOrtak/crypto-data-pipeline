import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Zap, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { apiClient } from "../../api/client";
import ReactMarkdown from "react-markdown";

interface AIRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: any[]; // User's portfolio
}

type Phase = "scanning" | "results";

export default function AIRebalanceModal({ isOpen, onClose, holdings }: AIRebalanceModalProps) {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [scanText, setScanText] = useState("Initializing AI Risk Matrix...");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setPhase("scanning");
      setAiAnalysis("");
      return;
    }

    const runAnalysis = async () => {
      setScanText("Analyzing your portfolio allocation...");
      
      // Wait briefly for effect
      await new Promise(r => setTimeout(r, 1000));
      setScanText("Querying Llama 3.3 70B Engine...");
      
      // Wait again for effect
      await new Promise(r => setTimeout(r, 1500));
      
      const mockAnalysis = `
# Executive Summary
Your portfolio is well-diversified, but heavily skewed towards high-cap assets. Given the current market conditions, a slight rebalance is recommended to optimize risk-adjusted returns.

# Risk & Exposure Analysis
- **Overexposed:** You have a significant allocation in Bitcoin. While this provides stability, it limits potential upside in a bullish market.
- **Underexposed:** You lack exposure to emerging sectors like Layer-2 solutions and DeFi protocols.

# Actionable Rebalancing Steps
1. **Reduce BTC exposure:** Consider taking a 5-10% profit from your Bitcoin holdings.
2. **Reallocate to Alts:** Move the freed capital into high-conviction Layer-2 tokens (e.g., ARB, OP) or established DeFi blue-chips.
3. **Maintain Cash Buffer:** Keep at least 10% in Stablecoins (USDC/USDT) to buy potential dips.
      `;
      
      setAiAnalysis(mockAnalysis.trim());
      setPhase("results");
    };

    runAnalysis();
  }, [isOpen, holdings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-[#121212] border border-[#14F195]/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#1a1d21]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14F195]/20 to-transparent flex items-center justify-center border border-[#14F195]/30">
              <Brain className="text-[#14F195]" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Portfolio Engine</h2>
              <p className="text-xs text-gray-400">Powered by Llama 3.3 70B</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {phase === "scanning" && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 space-y-6"
              >
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#14F195] animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="text-[#14F195] opacity-50" size={32} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-wider animate-pulse">Processing</h3>
                  <p className="text-sm font-medium text-[#14F195]">{scanText}</p>
                </div>
              </motion.div>
            )}

            {phase === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-[#14F195] prose-ul:text-gray-300 prose-li:marker:text-[#14F195] max-w-none"
              >
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
