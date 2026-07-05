import os

with open('frontend/src/components/layout/WatchlistSidebar.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

alerts_panel_code = "".join(lines[733:1270])

modal_code = '''import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Bell, Plus, CheckCircle, Clock, Settings, Crown, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useMarket } from "../../hooks/useMarket";
import WatchlistPanel from "./WatchlistPanel";

function formatPrice(val: number) {
  if (val >= 1) return val.toFixed(2);
  if (val >= 0.01) return val.toFixed(4);
  return val.toFixed(8);
}

''' + alerts_panel_code + '''

export default function WatchlistModal({
  isOpen,
  activePanel,
  onClose,
  onPanelChange,
  watchlist,
  addToWatchlist: addToWatchlistProp,
  removeFromWatchlist,
  toggleWatchlist,
  marketData,
  isAtLimit,
  limit,
}) {
  const { data: fullMarket } = useMarket(3000);
  const market = fullMarket || marketData;

  function addToWatchlist(symbol) {
    if (addToWatchlistProp) addToWatchlistProp(symbol);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0a0b0d]/80 backdrop-blur-sm"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-[500px] h-[85vh] max-h-[800px] flex flex-col bg-[#16181c] border border-[#273951]/80 rounded-[32px] p-2 shadow-2xl overflow-hidden"
        >
          {/* Subtle Glow Background */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />

          {/* Header - Zen Browser Style Tabs */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-3 border-b border-white/5">
            <div className="flex gap-2">
              <button
                onClick={() => onPanelChange("watchlist")}
                className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all " + (activePanel === "watchlist" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/5")}
              >
                <Star size={16} fill={activePanel === "watchlist" ? "currentColor" : "none"} />
                Watchlist
              </button>
              <button
                onClick={() => onPanelChange("alerts")}
                className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all " + (activePanel === "alerts" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/5")}
              >
                <Bell size={16} fill={activePanel === "alerts" ? "currentColor" : "none"} />
                Alerts
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Panel Content container */}
          <div className="relative z-10 flex-1 overflow-hidden rounded-b-[24px]">
            {activePanel === "watchlist" && (
              <WatchlistPanel
                watchlist={watchlist}
                removeFromWatchlist={removeFromWatchlist}
                safeMarketData={market}
                onClose={onClose}
                addToWatchlist={addToWatchlist}
                isAtLimit={isAtLimit}
                limit={limit}
              />
            )}
            {activePanel === "alerts" && (
              <AlertsPanel marketData={market} onClose={onClose} />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
'''

with open('frontend/src/components/layout/WatchlistModal.tsx', 'w', encoding='utf-8') as f:
    f.write(modal_code)

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    app_code = f.read()

app_code = app_code.replace(
    'import RightSidebar from "./components/layout/WatchlistSidebar";',
    'import RightSidebar from "./components/layout/WatchlistModal";'
)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_code)

print("Done")
