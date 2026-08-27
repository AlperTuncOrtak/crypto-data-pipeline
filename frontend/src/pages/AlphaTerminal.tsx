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
            className="relative flex flex-col rounded-[28px] overflow-hidden bg-[#0c0c12] border border-white/5 transition-all hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1"
          >
            {/* Dynamic Accent Color Border Top/Glow */}
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: item.typeColor }} />
            <div className="absolute top-0 left-0 w-full h-32 opacity-10 pointer-events-none" style={{ background: `linear-gradient(180deg, ${item.typeColor} 0%, transparent 100%)` }} />

            {/* Card Header (Date & Type) */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <span className="text-[12px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-white/5" style={{ color: item.typeColor }}>
                {item.type}
              </span>
              <span className="text-[12px] font-medium text-white/40 flex items-center gap-1.5">
                <Clock size={13} /> {item.time}
              </span>
            </div>

            {/* Card Body (Title, Desc, Progress) */}
            <div className="px-6 py-4 flex-1">
              <h2 className="text-xl font-bold text-white mb-2 leading-snug">{item.title}</h2>
              <p className="text-[14px] text-white/60 leading-relaxed font-medium mb-6">
                {item.content}
              </p>

              {/* Progress Bar (AI Conviction) */}
              <div className="flex flex-col gap-2 bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center text-[12px] font-bold">
                  <span className="text-white/50 flex items-center gap-1"><BrainCircuit size={14}/> AI Conviction</span>
                  <span style={{ color: item.typeColor }}>{item.confidence}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
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

            {/* Card Footer (Coin Logo Left, Swap Button Right) */}
            <div className="mt-2 p-4 mx-2 mb-2 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-between">
              
              {/* Bottom Left: Coin Identifiers */}
              <div className="flex items-center gap-3 pl-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-[12px] shadow-lg border border-white/10" style={{ backgroundColor: item.typeColor }}>
                  {item.actionToken.substring(0,3)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-white">{item.actionToken}</span>
                  <span className="text-[11px] text-white/40 uppercase font-semibold">{item.actionType} Target</span>
                </div>
              </div>

              {/* Bottom Right: Execute Button (Like countdownText) */}
              <button
                onClick={() => setSelectedToken(item.actionToken)}
                className="flex items-center gap-2 px-6 py-3 rounded-[14px] font-bold text-[14px] transition-all hover:scale-[1.02] active:scale-95 text-black"
                style={{ 
                  backgroundColor: "white",
                  boxShadow: `0 8px 20px rgba(255,255,255,0.15)`
                }}
              >
                Execute <ArrowRightLeft size={16} />
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
