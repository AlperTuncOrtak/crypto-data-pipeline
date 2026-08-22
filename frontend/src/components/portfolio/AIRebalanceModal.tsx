import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X } from "lucide-react";
import { apiClient } from "../../api/client";
import ReactMarkdown from "react-markdown";
import type { Holding } from "./PortfolioUtils";

interface AIRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Holding[];
  totalValue: number;
  totalPnl: number;
  /** False when no trade history is imported, so P&L is marked to market. */
  hasCostBasis: boolean;
}

type Phase = "scanning" | "results";

export default function AIRebalanceModal({
  isOpen,
  onClose,
  holdings,
  totalValue,
  totalPnl,
  hasCostBasis,
}: AIRebalanceModalProps) {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [scanText, setScanText] = useState("Initializing AI Risk Matrix...");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");

  // Holdings are rebuilt on every market tick. Without this snapshot the
  // effect re-fired every few seconds and hit the paid LLM endpoint each time.
  const snapshot = useRef({ holdings, totalValue, totalPnl, hasCostBasis });
  if (!isOpen) snapshot.current = { holdings, totalValue, totalPnl, hasCostBasis };

  useEffect(() => {
    if (!isOpen) {
      setPhase("scanning");
      setAiAnalysis("");
      return;
    }

    const runAnalysis = async () => {
      const { holdings: snap, totalValue: snapValue, totalPnl: snapPnl, hasCostBasis: snapHasCost } =
        snapshot.current;
      try {
        setScanText("Analyzing your portfolio allocation...");
        
        // Wait briefly for effect
        await new Promise(r => setTimeout(r, 500));
        setScanText("Querying Llama 3.3 70B Engine...");
        
        const response = await apiClient.post("/ai/portfolio", {
          holdings: snap.map(h => ({
            symbol: h.symbol,
            value: h.value || 0,
            pnl_pct: snapHasCost ? h.pnl_pct || 0 : 0,
            quantity: h.quantity || 0,
            avg_cost: h.avg_cost || 0,
          })),
          total_value: snapValue,
          total_pnl: snapHasCost ? snapPnl : 0,
        });

        if (response.data && response.data.risk_score) {
          const d = response.data;
          const md = `### 📊 Portfolio AI Analysis
**Risk Score:** ${d.risk_score}/10 (${d.risk_label})
**Diversification:** ${d.diversification_score}/10 | **Dominant Sector:** ${d.dominant_sector}

${d.summary}

#### 💡 Recommendations
${d.recommendations.map((r: string) => `- ${r}`).join("\n")}

#### 🟢 Strengths
${d.strengths.map((s: string) => `- ${s}`).join("\n")}

#### 🔴 Risks
${d.risks.map((r: string) => `- ${r}`).join("\n")}

**Best Performer:** ${d.best_position}
**Needs Attention:** ${d.worst_position}
${snapHasCost ? "" : "\n> _No trade history imported, so profit/loss is unknown. Import a CSV or sync an exchange for P&L-aware analysis._"}
`;
          setAiAnalysis(md);
        } else {
          throw new Error("Failed to analyze portfolio structure");
        }
      } catch (err: any) {
        const detail = err.response?.data?.detail || err.message;
        setAiAnalysis(`### 🚨 Analysis Failed\n\nCould not connect to the AI Engine. Please check your network or try again later.\n\n**Error Details:** ${detail}`);
      } finally {
        setPhase("results");
      }
    };

    runAnalysis();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-[#09090b]/90 backdrop-blur-3xl border border-white/[0.04] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.04] bg-[#09090b]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-3xl bg-gradient-to-br from-[var(--positive)]/20 to-transparent flex items-center justify-center border border-[var(--positive)]/30">
              <Brain className="text-[var(--positive)]" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Portfolio Engine</h2>
              <p className="text-xs text-white/40">Powered by Llama 3.3 70B</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-2xl">
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
                  <div className="absolute inset-0 rounded-full border-t-2 border-[var(--positive)] animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="text-[var(--positive)] opacity-50" size={32} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-wider animate-pulse">Processing</h3>
                  <p className="text-sm font-medium text-[var(--positive)]">{scanText}</p>
                </div>
              </motion.div>
            )}

            {phase === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-[var(--positive)] prose-ul:text-gray-300 prose-li:marker:text-[var(--positive)] max-w-none"
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

