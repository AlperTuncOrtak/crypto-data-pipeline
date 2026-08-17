import React, { useMemo } from "react";
import { AlertCircle, Activity, MessageCircle, Info } from "lucide-react";
import { motion } from "framer-motion";

export interface HypeRealityData {
  socialHypeScore: number;
  onChainActivityScore: number;
  aiVerdict: string;
}

// Simulated mock generator based on symbol
const generateMockData = (symbol: string): HypeRealityData => {
  const seed = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const isMeme = ["DOGE", "SHIB", "PEPE", "FLOKI", "BONK", "WIF"].includes(symbol.toUpperCase());
  const isSolid = ["BTC", "ETH", "SOL", "LINK", "AVAX"].includes(symbol.toUpperCase());
  
  let socialHypeScore = (seed % 60) + 40; 
  let onChainActivityScore = ((seed * 13) % 70) + 30;

  if (isMeme) {
    socialHypeScore = 92;
    onChainActivityScore = 25;
  } else if (isSolid) {
    socialHypeScore = 85;
    onChainActivityScore = 88;
  }

  const diff = socialHypeScore - onChainActivityScore;
  let aiVerdict = "";

  if (diff > 30) {
    aiVerdict = "High social volume but flat on-chain growth. High risk of a synthetic pump driven by retail sentiment.";
  } else if (onChainActivityScore >= socialHypeScore) {
    aiVerdict = "Strong fundamental adoption backing social mentions. Healthy and sustainable growth profile.";
  } else {
    aiVerdict = "Social hype outpaces on-chain metrics slightly, but remains within normal retail bounds.";
  }

  return { socialHypeScore, onChainActivityScore, aiVerdict };
};

interface HypeRealityWidgetProps {
  symbol?: string;
}

export default function HypeRealityWidget({ symbol = "BTC" }: HypeRealityWidgetProps) {
  const data = useMemo(() => generateMockData(symbol), [symbol]);
  
  const diff = data.socialHypeScore - data.onChainActivityScore;
  const isWarning = diff > 30;
  const isHealthy = data.onChainActivityScore >= data.socialHypeScore;

  return (
    <div className="bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-2xl rounded-2xl p-6 flex flex-col gap-6 w-full relative overflow-hidden group">
      
      {/* Background ambient glow based on health */}
      <div 
        className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 transition-colors duration-1000 ${
          isWarning ? 'bg-red-500' : isHealthy ? 'bg-green-500' : 'bg-blue-500'
        }`}
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[var(--text-muted)]" />
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
            Hype vs. Reality
          </h3>
        </div>
        {isWarning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-2xl text-[11px] font-bold uppercase tracking-wider"
          >
            <AlertCircle size={14} />
            <span>Bubble Risk</span>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col gap-5 relative z-10">
        {/* Social Hype Bar */}
        <div>
          <div className="flex justify-between text-[13px] mb-2 text-[var(--text-muted)] font-medium">
            <div className="flex items-center gap-2">
              <MessageCircle size={15} /> <span>Social Hype</span>
            </div>
            <span className="font-bold text-[var(--text-main)] font-mono text-[14px]">
              {data.socialHypeScore}<span className="text-gray-600 text-[11px]">/100</span>
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${data.socialHypeScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${isWarning ? 'bg-red-500' : 'bg-[var(--accent)]'}`} 
            />
          </div>
        </div>

        {/* On-Chain Reality Bar */}
        <div>
          <div className="flex justify-between text-[13px] mb-2 text-[var(--text-muted)] font-medium">
            <div className="flex items-center gap-2">
              <Activity size={15} /> <span>On-Chain Reality</span>
            </div>
            <span className="font-bold text-[var(--text-main)] font-mono text-[14px]">
              {data.onChainActivityScore}<span className="text-gray-600 text-[11px]">/100</span>
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${data.onChainActivityScore}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className={`h-full rounded-full ${isWarning ? 'bg-gray-600' : 'bg-[var(--positive)]'}`} 
            />
          </div>
        </div>
      </div>

      {/* AI Verdict */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className={`bg-[var(--bg-subtle)] rounded-3xl p-4 mt-1 border-l-4 relative z-10 ${
          isWarning ? 'border-red-500' : isHealthy ? 'border-[var(--positive)]' : 'border-[var(--accent)]'
        }`}
      >
        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed m-0 flex gap-3 items-start">
          <Info size={18} className={`shrink-0 mt-0.5 ${
            isWarning ? 'text-red-400' : isHealthy ? 'text-[var(--positive)]' : 'text-[var(--accent)]'
          }`} />
          <span>
            <strong className="text-[var(--text-main)] font-semibold">AI Verdict: </strong> 
            {data.aiVerdict}
          </span>
        </p>
      </motion.div>
    </div>
  );
}
