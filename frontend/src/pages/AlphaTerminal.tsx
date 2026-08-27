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

        {/* Feed Cards - CSS GRID like 21st.dev */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {FEED_ITEMS.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex flex-col rounded-[24px] overflow-hidden bg-[#151419] transition-all hover:-translate-y-1 shadow-lg"
              style={{ minHeight: "320px" }}
            >
              {/* Top Right Ambient Glow (The signature 21st.dev effect) */}
              <div 
                className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[60px] opacity-40 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${item.typeColor} 0%, transparent 70%)`, transform: "translate(20%, -20%)" }}
              />

              {/* Card Header (Date & 3 Dots) */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2 relative z-10">
                <span className="text-[13px] font-medium text-white/70">
                  {item.time} &bull; <span style={{ color: item.typeColor, fontWeight: 700 }}>{item.type}</span>
                </span>
                <button className="text-white/50 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Card Body (Center Aligned) */}
              <div className="px-6 py-6 flex-1 flex flex-col justify-center items-center text-center relative z-10">
                <h3 className="text-[22px] font-bold text-white mb-1 leading-tight">{item.title}</h3>
                <p className="text-[14px] text-white/50 mb-8 max-w-[90%]">
                  {item.content.substring(0, 80)}...
                </p>

                {/* Progress Bar (Minimalist) */}
                <div className="w-full flex flex-col gap-2 mt-auto">
                  <div className="flex justify-between items-center text-[13px] font-semibold">
                    <span className="text-white">AI Conviction</span>
                    <span className="text-white/70">{item.confidence}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.confidence}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.typeColor }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer (Darker, Avatars & Outline Button) */}
              <div className="mt-auto px-6 py-5 bg-[#100f13] border-t border-white/5 flex items-center justify-between relative z-10">
                
                {/* Coin Logo (replacing avatars) */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-[10px] shadow-lg ring-2 ring-[#100f13]" style={{ backgroundColor: item.typeColor }}>
                    {item.actionToken.substring(0,3)}
                  </div>
                  <span className="text-[13px] font-bold text-white/80">{item.actionToken}</span>
                </div>

                {/* Execute Button (replacing countdown) */}
                <button
                  onClick={() => setSelectedToken(item.actionToken)}
                  className="px-5 py-2 rounded-full text-[13px] font-semibold transition-all hover:bg-white hover:text-black border border-white/20 text-white"
                >
                  Execute ⇄
                </button>
              </div>
            </motion.div>
          ))}
        </div>

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
