import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";

export default function AITradeInsights({ onApplySuggestion }: { onApplySuggestion: (tokenSymbol: string) => void }) {
  const suggestions = [
    {
      id: 1,
      type: "opportunity",
      title: "Volume Spike Detected",
      desc: "LINK is seeing a 300% increase in whale accumulation over the last hour.",
      token: "LINK",
      icon: <TrendingUp size={16} className="text-emerald-400" />
    },
    {
      id: 2,
      type: "risk",
      title: "Overbought Warning",
      desc: "WIF RSI is above 85. High risk of short-term correction.",
      token: "USDC", // Suggest swapping to stablecoin
      icon: <AlertTriangle size={16} className="text-amber-400" />
    },
    {
      id: 3,
      type: "trend",
      title: "AI Narrative Heating Up",
      desc: "FET and AGIX are outperforming the market today.",
      token: "FET",
      icon: <Sparkles size={16} className="text-cyan-400" />
    }
  ];

  return (
    <div className="w-full h-full min-h-[300px] bg-[#0a0b0d] border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Sparkles size={20} className="text-cyan-400" />
        <h3 className="text-white font-bold text-lg">AI Trade Signals</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 relative z-10 pr-1">
        {suggestions.map((s, i) => (
          <motion.div 
            key={s.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors group cursor-pointer"
            onClick={() => onApplySuggestion(s.token)}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {s.icon}
              <span className="text-sm font-bold text-slate-200">{s.title}</span>
            </div>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              {s.desc}
            </p>
            <div className="flex justify-end">
              <span className="text-[10px] font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Swap to {s.token} <ArrowRight size={10} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 text-center relative z-10">
        <p className="text-[10px] text-slate-500 font-mono">
          Model Confidence: 87.4% • Updated 1m ago
        </p>
      </div>
    </div>
  );
}
