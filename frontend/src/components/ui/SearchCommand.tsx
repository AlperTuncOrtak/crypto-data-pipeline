import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Command, X, TrendingUp, TrendingDown, Home, Eye, History, Brain, LineChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMarket } from "../../hooks/useMarket";

interface SearchCommandProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchCommand({ isOpen, onClose }: SearchCommandProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: coins } = useMarket(2000); // Fetch top 2000 for search

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Combine static links and API results
  const allResults = useMemo(() => {
    const staticLinks = [
      { id: 'home', type: 'page', name: 'Home Dashboard', symbol: 'APP', path: '/', icon: <Home size={16} className="text-zinc-400" /> },
      { id: 'whale', type: 'page', name: 'Whale X-Ray', symbol: 'TOOL', path: '/whale', icon: <Eye size={16} className="text-zinc-400" /> },
      { id: 'time', type: 'page', name: 'Time Machine', symbol: 'TOOL', path: '/timemachine', icon: <History size={16} className="text-zinc-400" /> },
      { id: 'ai', type: 'page', name: 'AI Analysis', symbol: 'TOOL', path: '/analysis/ai', icon: <Brain size={16} className="text-zinc-400" /> },
      { id: 'heatmap', type: 'page', name: 'Market Heatmap', symbol: 'TOOL', path: '/heatmap', icon: <LineChart size={16} className="text-zinc-400" /> }
    ];

    const lowerQuery = query.toLowerCase();
    
    // Filter static links
    const filteredPages = staticLinks.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || p.symbol.toLowerCase().includes(lowerQuery)
    );

    // Filter coins (max 8)
    const filteredCoins = coins
      ? coins.filter(
          (c: any) =>
            c.name?.toLowerCase().includes(lowerQuery) ||
            c.symbol?.toLowerCase().includes(lowerQuery)
        ).slice(0, 8).map((c: any) => ({ ...c, type: 'coin' }))
      : [];

    return [...filteredPages, ...filteredCoins];
  }, [query, coins]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (allResults.length > 0 && allResults[selectedIndex]) {
          const selected = allResults[selectedIndex];
          if (selected.type === 'page') {
            navigate(selected.path);
          } else {
            navigate(`/coin/${selected.slug || selected.id}`);
          }
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allResults, selectedIndex, navigate, onClose]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isOpen]);

  // Reset index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: any) => {
    if (item.type === 'page') {
      navigate(item.path);
    } else {
      navigate(`/coin/${item.slug || item.id}`);
    }
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
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-2xl bg-[var(--bg-base)] border border-[var(--border-base)] rounded-[24px] shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
              style={{ fontFamily: "Inter, sans-serif" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input Header */}
              <div className="flex items-center px-4 py-3 border-b border-[var(--border-base)] bg-[var(--bg-base)]">
                <Search size={18} className="text-zinc-400 mr-3 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search coins, tools, or commands..."
                  className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 text-[15px]"
                />
                <button 
                  onClick={onClose}
                  className="p-1.5 ml-2 rounded-2xl hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Results Area */}
              <div ref={scrollRef} className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {query.length === 0 && allResults.length === 0 ? (
                  <div className="px-4 py-12 text-center text-zinc-500 text-[13px]">
                    <Command size={24} className="mx-auto mb-3 opacity-20" />
                    Type to search for anything...
                  </div>
                ) : allResults.length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    {allResults.map((item, index) => {
                      const isSelected = index === selectedIndex;
                      
                      if (item.type === 'page') {
                        return (
                          <button
                            key={item.id}
                            data-selected={isSelected}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-2xl transition-colors text-left ${
                              isSelected ? 'bg-[var(--bg-base)]' : 'hover:bg-[var(--bg-base)]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 flex items-center justify-center bg-[var(--bg-base)] rounded border border-[var(--border-base)]">
                                {item.icon}
                              </div>
                              <span className="text-[14px] font-medium text-zinc-100">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] text-zinc-500 font-mono tracking-wider">{item.symbol}</span>
                              {isSelected && (
                                <kbd className="hidden sm:flex items-center justify-center h-5 px-1.5 rounded-sm bg-gradient-to-b from-[#121212] to-[#0d0d0d] border border-[var(--border-base)] text-[10px] text-zinc-400 font-mono shadow-sm">
                                  ↵
                                </kbd>
                              )}
                            </div>
                          </button>
                        );
                      }

                      // Coin Result
                      const change = Number(item.price_change_percentage_24h) || 0;
                      const isUp = change >= 0;
                      return (
                        <button
                          key={item.id}
                          data-selected={isSelected}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-2xl transition-colors text-left ${
                            isSelected ? 'bg-[var(--bg-base)]' : 'hover:bg-[var(--bg-base)]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-6 h-6 rounded-full border border-[var(--border-base)]" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-center text-[10px] text-zinc-400">
                                {item.symbol?.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="text-[14px] text-zinc-100 font-medium leading-none mb-1">{item.name}</div>
                              <div className="text-[12px] text-zinc-500 font-mono uppercase leading-none">{item.symbol}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div className="flex flex-col items-end">
                              <div className="text-[13px] text-zinc-200 font-mono leading-none mb-1">
                                ${Number(item.current_price).toLocaleString(undefined, { maximumFractionDigits: item.current_price < 1 ? 4 : 2 })}
                              </div>
                              <div className={`text-[11px] flex items-center justify-end gap-1 font-mono leading-none ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(change).toFixed(2)}%
                              </div>
                            </div>
                            {isSelected && (
                               <kbd className="hidden sm:flex items-center justify-center h-5 px-1.5 rounded-sm bg-gradient-to-b from-[#121212] to-[#0d0d0d] border border-[var(--border-base)] text-[10px] text-zinc-400 font-mono shadow-sm">
                                 ↵
                               </kbd>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-12 text-center text-zinc-500 text-[13px]">
                    No results found for "{query}"
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-base)] bg-[var(--bg-base)] text-[12px] text-[#9c9c9d]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      <kbd className="flex items-center justify-center h-5 px-1.5 rounded-sm bg-gradient-to-b from-[#121212] to-[#0d0d0d] border border-[var(--border-base)] text-[#cdcdcd] font-sans shadow-sm">↑</kbd>
                      <kbd className="flex items-center justify-center h-5 px-1.5 rounded-sm bg-gradient-to-b from-[#121212] to-[#0d0d0d] border border-[var(--border-base)] text-[#cdcdcd] font-sans shadow-sm">↓</kbd>
                    </div>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="flex items-center justify-center h-5 px-1.5 rounded-sm bg-gradient-to-b from-[#121212] to-[#0d0d0d] border border-[var(--border-base)] text-[#cdcdcd] font-sans shadow-sm">↵</kbd>
                    <span>Open</span>
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <span>Close</span>
                  <kbd className="flex items-center justify-center h-5 px-1.5 rounded-sm bg-gradient-to-b from-[#121212] to-[#0d0d0d] border border-[var(--border-base)] text-[#cdcdcd] font-sans shadow-sm text-[10px]">ESC</kbd>
                </span>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

