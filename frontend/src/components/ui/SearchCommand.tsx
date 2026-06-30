import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Command, X, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMarket } from "../../hooks/useMarket";

interface SearchCommandProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchCommand({ isOpen, onClose }: SearchCommandProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: coins } = useMarket(2000); // Fetch top 2000 for search

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
    }
  }, [isOpen]);

  // Global CMD+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Just let the parent handle the toggling state, but this component can close itself
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Filter coins
  const results = coins
    ? coins.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(query.toLowerCase()) ||
          c.symbol?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelect = (slug: string) => {
    navigate(`/coin/${slug}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-xl bg-[#121212] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input Header */}
              <div className="flex items-center px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <Search size={18} className="text-zinc-400 mr-3" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search coins, markets, or signals..."
                  className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 text-[15px]"
                />
                <button 
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Results Area */}
              <div className="max-h-[350px] overflow-y-auto p-2">
                {query.length === 0 ? (
                  <div className="px-4 py-8 text-center text-zinc-500 text-[13px]">
                    <Command size={24} className="mx-auto mb-3 opacity-20" />
                    Type a coin name or ticker to search
                  </div>
                ) : results.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {results.map((c: any) => {
                      const change = Number(c.price_change_percentage_24h) || 0;
                      const isUp = change >= 0;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleSelect(c.id)}
                          className="flex items-center justify-between w-full p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            {c.image ? (
                              <img src={c.image} alt={c.name} className="w-6 h-6 rounded-full" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-white/[0.1] flex items-center justify-center text-[10px] text-zinc-400">
                                {c.symbol?.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="text-[14px] text-zinc-100 font-medium">{c.name}</div>
                              <div className="text-[12px] text-zinc-500 uppercase">{c.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[13px] text-zinc-200 font-mono">${Number(c.current_price).toLocaleString()}</div>
                            <div className={`text-[12px] flex items-center justify-end gap-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {Math.abs(change).toFixed(2)}%
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-zinc-500 text-[13px]">
                    No results found for "{query}"
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04] bg-[#0A0A0A] text-[11px] text-zinc-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] font-sans">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] font-sans">↓</kbd>
                    <span>to navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] font-sans">↵</kbd>
                    <span>to select</span>
                  </span>
                </div>
                <span>ESC to close</span>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
