import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, Zap, Target, Activity } from "lucide-react";

export default function AITradeInsights({ onApplySuggestion }: { onApplySuggestion: (tokenSymbol: string) => void }) {
  const suggestions = [
    {
      id: 1,
      type: "opportunity",
      title: "Volume Anomaly Detected",
      desc: "LINK is seeing a 300% increase in whale accumulation over the last hour. Breakout imminent.",
      token: "LINK",
      actionText: "Buy LINK",
      conviction: "High",
      expectedMove: "+12.4%",
      color: "emerald",
      bgClass: "from-emerald-500/10 to-transparent",
      borderClass: "group-hover:border-emerald-500/50",
      textClass: "text-emerald-400",
      icon: <TrendingUp size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
    },
    {
      id: 2,
      type: "risk",
      title: "Overbought Warning",
      desc: "WIF RSI is above 85. Smart money is distributing. High risk of short-term correction.",
      token: "USDC", // Suggest swapping to stablecoin
      actionText: "Hedge to USDC",
      conviction: "Very High",
      expectedMove: "-18.2%",
      color: "rose",
      bgClass: "from-rose-500/10 to-transparent",
      borderClass: "group-hover:border-rose-500/50",
      textClass: "text-rose-400",
      icon: <AlertTriangle size={20} className="text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
    },
    {
      id: 3,
      type: "trend",
      title: "AI Sector Rotation",
      desc: "Capital is aggressively rotating into AI. FET and AGIX are exhibiting strong relative strength.",
      token: "FET",
      actionText: "Swap to FET",
      conviction: "Medium",
      expectedMove: "+8.5%",
      color: "cyan",
      bgClass: "from-cyan-500/10 to-transparent",
      borderClass: "group-hover:border-cyan-500/50",
      textClass: "text-cyan-400",
      icon: <Sparkles size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
    }
  ];

  return (
    <div className="w-full h-full bg-[#050505] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col group/container">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none group-hover/container:bg-cyan-500/10 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none group-hover/container:bg-purple-500/10 transition-colors duration-700" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center relative">
            <Sparkles size={20} className="text-cyan-400" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full animate-ping" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full" />
          </div>
          <div>
            <h3 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
              Alpha Signals
            </h3>
            <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Live AI Analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
          <Activity size={12} className="text-green-400 animate-pulse" />
          <span className="text-xs font-mono text-gray-300">Scanning</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-4 relative z-10 pr-2 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {suggestions.map((s, i) => (
          <motion.div 
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
            className={`relative p-5 rounded-2xl bg-[#0d0d0d] border border-white/10 hover:bg-[#121212] hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden ${s.borderClass}`}
            onClick={() => onApplySuggestion(s.token)}
          >
            {/* Card Hover Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${s.bgClass}`} />
            
            <div className="relative z-10 flex flex-col gap-3">
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-gray-200 transition-colors">{s.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 ${s.textClass}`}>
                        {s.expectedMove}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        {s.conviction} Conviction
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Card Body */}
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                {s.desc}
              </p>
              
              {/* Action Button */}
              <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                  <Target size={12} /> Model Conf: &gt;90%
                </span>
                
                <button 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 relative z-20 ${
                    s.color === "emerald" ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white" :
                    s.color === "rose" ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white" :
                    "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                  }`}
                  onClick={(e) => { e.stopPropagation(); onApplySuggestion(s.token); }}
                >
                  <Zap size={14} className="animate-pulse" />
                  {s.actionText}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-2 pt-4 border-t border-white/10 text-center relative z-10">
        <div className="text-[10px] text-gray-500 font-mono flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_cyan]" />
          Powered by CryptoNeko Neural Engine v2.4
        </div>
      </div>
    </div>
  );
}
