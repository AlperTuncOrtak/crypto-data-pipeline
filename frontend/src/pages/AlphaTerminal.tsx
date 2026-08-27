import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, BrainCircuit, X, ArrowRightLeft, Clock, TrendingUp, TrendingDown, Radio } from "lucide-react";
import { LiFiWidget, WidgetConfig } from "@lifi/widget";
import { useAuth } from "../hooks/useAuth";
import { useConnectModal } from "@rainbow-me/rainbowkit";

// MOCK DATA for the Feed
const FEED_ITEMS = [
  {
    id: 1,
    type: "ON-CHAIN ANOMALY",
    typeColor: "#10b981", // Emerald
    time: "2 mins ago",
    title: "Massive accumulation on FET by Smart Money",
    content: "Our Isolation Forest model detected a 400% volume spike on Fetch.ai (FET). 3 wallets with a historical 82% win-rate have accumulated $2.4M worth of tokens in the last 15 minutes. Price has not yet reacted.",
    confidence: 92,
    actionToken: "FET",
    actionType: "BUY",
  },
  {
    id: 2,
    type: "AI NEWS SENTIMENT",
    typeColor: "#8b5cf6", // Purple
    time: "14 mins ago",
    title: "OpenAI 'Sora' Update triggers AI sector rotation",
    content: "Breaking news sentiment analysis shows extreme bullish divergence for AI tokens. Historical correlation suggests Render (RNDR) will be the primary beneficiary of this narrative shift within the next 4 hours.",
    confidence: 85,
    actionToken: "RNDR",
    actionType: "BUY",
  },
  {
    id: 3,
    type: "WHALE DUMP WARNING",
    typeColor: "#f43f5e", // Rose
    time: "1 hour ago",
    title: "Early VC wallets moving PEPE to Binance",
    content: "Two genesis wallets just transferred 4 Trillion PEPE ($3.2M) to Binance Hot Wallets. This usually precedes a -15% correction. Recommended to derisk or open short positions.",
    confidence: 78,
    actionToken: "PEPE",
    actionType: "SELL",
  }
];

export default function AlphaTerminal() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const { openConnectModal } = useConnectModal();

  // Widget config for the slide-out drawer
  const widgetConfig: WidgetConfig = {
    integrator: "crypto-data-pipeline",
    variant: "compact",
    appearance: "dark",
    hiddenUI: ["appearance", "language", "poweredBy"],
    fee: 0.005,
    walletConfig: { onConnect: () => openConnectModal?.() },
    theme: {
      palette: {
        mode: "dark",
        primary: { main: "#6366f1" },
        background: { paper: "#09090b", default: "#000000" },
      },
      shape: { borderRadius: 16 },
    },
  };

  return (
    <div className="min-h-screen bg-[#020204] text-white flex justify-center relative overflow-hidden font-sans pt-20 pb-32">
      
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[var(--accent)]/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-4 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
              <Activity className="text-[var(--accent)] animate-pulse" /> 
              Alpha Feed
            </h1>
            <p className="text-sm text-white/50">Actionable intelligence from our ML pipeline.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold tracking-widest uppercase">
            <Radio size={12} className="animate-pulse" /> Live
          </div>
        </div>

        {/* Feed Cards */}
        {FEED_ITEMS.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08] rounded-[32px] p-5 sm:p-7 transition-all flex flex-col gap-5 shadow-2xl"
          >
            {/* Top Row: Coin Info & Signal */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Beautiful Coin Icon */}
                <div className="relative w-14 h-14 rounded-full p-[2px] shadow-xl" style={{ background: `linear-gradient(135deg, ${item.typeColor}, transparent)` }}>
                  <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center border border-white/10">
                    <span className="font-black text-white text-[15px]">{item.actionToken}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#020204] flex items-center justify-center" style={{ backgroundColor: item.typeColor }}>
                    {item.actionType === 'BUY' ? <TrendingUp size={12} className="text-black" strokeWidth={3}/> : <TrendingDown size={12} className="text-black" strokeWidth={3}/>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[18px] sm:text-[20px] text-white tracking-tight">{item.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-white/50">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {item.time}</span>
                    <span>&bull;</span>
                    <span style={{ color: item.typeColor }}>{item.type}</span>
                  </div>
                </div>
              </div>

              {/* Conviction Score */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <BrainCircuit size={12} /> AI Score
                </span>
                <span className="text-2xl font-black text-white leading-none">
                  {item.confidence}<span className="text-sm text-white/30">/100</span>
                </span>
              </div>
            </div>

            {/* Analysis Content */}
            <div className="bg-black/30 border border-white/5 rounded-[20px] p-5">
              <p className="text-[14px] sm:text-[15px] text-white/70 leading-relaxed font-medium">
                {item.content}
              </p>
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedToken(item.actionToken)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-[18px] font-bold text-[15px] transition-all hover:scale-[1.02] active:scale-95"
                style={{ 
                  backgroundColor: "white",
                  color: "black",
                  boxShadow: `0 10px 30px rgba(255,255,255,0.15)`
                }}
              >
                {item.actionType === 'BUY' ? `Buy ${item.actionToken}` : `Sell ${item.actionToken}`}
                <ArrowRightLeft size={16} />
              </button>
              
              <button className="px-6 py-3.5 rounded-[18px] bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 font-semibold transition-all">
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}

      </div>

      {/* Slide-out Swap Drawer */}
      <AnimatePresence>
        {selectedToken && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedToken(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-[440px] bg-[#09090b] border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] z-50 flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="text-[var(--accent)]" size={18} />
                  <span className="font-bold text-[15px]">Instant Execution</span>
                </div>
                <button onClick={() => setSelectedToken(null)} className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                {/* Note: In a real app we'd pass selectedToken to LiFiWidget config to pre-fill the 'To' token! */}
                <div className="mb-4 px-4 py-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[13px] text-white/80">
                  Executing AI Trade Signal for <strong>{selectedToken}</strong>
                </div>
                <div className="rounded-[16px] overflow-hidden border border-white/5">
                  <LiFiWidget integrator="crypto-data-pipeline" config={widgetConfig} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
