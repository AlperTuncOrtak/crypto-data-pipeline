import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  X,
  Search,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Plus,
  Crown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCoinColor } from "../../utils/colors";
import PriceCell from "../ui/PriceCell";

function Sparkline({ symbol, isUp }) {
  const seed = symbol.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const pts = Array.from({ length: 12 }, (_, i) => {
    const noise = Math.sin(seed * 0.1 + i * 1.3) * 0.4 + Math.cos(i * 0.7 + seed) * 0.3;
    const trend = isUp ? i * 0.06 : -i * 0.06;
    return 20 + (noise + trend) * 8;
  });
  const min = Math.min(...pts), max = Math.max(...pts);
  const norm = pts.map((p) => 28 - ((p - min) / (max - min + 0.01)) * 24);
  const path = norm.map((y, i) => `${i === 0 ? "M" : "L"} ${i * 8} ${y}`).join(" ");
  return (
    <svg width={88} height={30} className="block opacity-80 group-hover:opacity-100 transition-opacity">
      <path
        d={path}
        stroke={isUp ? "#10b981" : "#ef4444"}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SORT_OPTIONS = [
  { id: "added", label: "Added Order" },
  { id: "change", label: "24h Change" },
  { id: "price", label: "Price" },
  { id: "alpha", label: "A–Z" },
];

export default function WatchlistPanel({
  watchlist,
  removeFromWatchlist,
  safeMarketData,
  onClose,
  addToWatchlist,
  isAtLimit,
  limit,
}) {
  const navigate = useNavigate();
  const [sort, setSort] = useState("added");
  const [showSort, setShowSort] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const watchedCoins = useMemo(() => {
    const coins = watchlist
      .map((symbol) => safeMarketData.find((c) => c.symbol === symbol))
      .filter(Boolean);

    return [...coins].sort((a, b) => {
      if (sort === "change")
        return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0);
      if (sort === "price") return (b.current_price || 0) - (a.current_price || 0);
      if (sort === "alpha") return a.symbol.localeCompare(b.symbol);
      return 0; // added order
    });
  }, [watchlist, safeMarketData, sort]);

  const searchResults = useMemo(() => {
    if (!addSearch.trim() || !safeMarketData) return [];
    const term = addSearch.toLowerCase();
    return safeMarketData
      .filter(
        (c) =>
          (c.symbol?.toLowerCase().includes(term) || c.name?.toLowerCase().includes(term)) &&
          !watchlist.includes(c.symbol)
      )
      .slice(0, 6);
  }, [addSearch, safeMarketData, watchlist]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]/50">
      <div className="px-6 py-5 border-b border-[var(--border-base)] bg-[var(--bg-subtle)]/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20">
              <Star size={16} className="text-[var(--accent)]" fill="currentColor" />
            </div>
            <span className="font-bold text-lg text-[var(--text-main)] tracking-tight">Watchlist</span>
            {watchlist.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-[var(--border-base)] text-gray-300 font-mono font-medium">
                {watchlist.length}
              </span>
            )}
          </div>
          
          <div className="flex gap-2 relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSort((s) => !s)}
              className={`w-9 h-9 rounded-3xl flex items-center justify-center border transition-all ${
                showSort ? "bg-white/10 border-white/20 text-[var(--text-main)]" : "bg-white/5 border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <ArrowUpDown size={14} />
            </motion.button>

            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-12 right-12 w-40 bg-[var(--bg-subtle)]/95 backdrop-blur-xl border border-[var(--border-base)] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-2"
                >
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => { setSort(o.id); setShowSort(false); }}
                      className={`w-full text-left px-3 py-2 text-sm font-medium rounded-3xl transition-all ${
                        sort === o.id ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!isAtLimit) setShowAdd((s) => !s);
                else setShowLimitAlert(true);
              }}
              className={`w-9 h-9 rounded-3xl flex items-center justify-center border transition-all ${
                isAtLimit ? "bg-red-500/10 border-red-500/30 text-red-400" :
                showAdd ? "bg-[var(--accent)]/20 border-[var(--accent)]/40 text-[var(--accent)] shadow-[0_0_15px_rgba(83,58,253,0.3)]" : "bg-white/5 border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <Plus size={16} />
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative overflow-visible"
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-base)]/50 border border-[var(--accent)]/30 rounded-3xl shadow-[inset_0_0_10px_rgba(83,58,253,0.1)]">
                <Search size={14} className="text-[var(--accent)]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search coins to add..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-[var(--text-main)] text-sm w-full placeholder-gray-500 font-medium"
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-subtle)]/95 backdrop-blur-xl border border-[var(--border-base)] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-2">
                  {searchResults.map((coin) => (
                    <div
                      key={coin.symbol}
                      onClick={() => { addToWatchlist(coin.symbol); setAddSearch(""); setShowAdd(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--border-subtle)] rounded-3xl cursor-pointer transition-colors group"
                    >
                      {coin.image_url ? (
                        <img src={coin.image_url} className="w-8 h-8 rounded-full shadow-lg" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold" style={{ color: getCoinColor(coin.symbol) }}>
                          {coin.symbol[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-sm text-[var(--text-main)]">{coin.symbol}</div>
                        <div className="text-xs text-[var(--text-muted)] truncate w-32">{coin.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-gray-300"><PriceCell price={coin.current_price} /></div>
                        <div className={`text-xs font-mono font-medium ${Number(coin.price_change_percentage_24h) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {Number(coin.price_change_percentage_24h) >= 0 ? "+" : ""}{Number(coin.price_change_percentage_24h).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <Star size={48} className="text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">Your Watchlist is Empty</h3>
            <p className="text-sm text-[var(--text-muted)] text-center max-w-[200px]">Use the + button above to start tracking your favorite coins.</p>
          </div>
        ) : (
          <AnimatePresence>
            {watchedCoins.map((coin, i) => {
              const change = Number(coin.price_change_percentage_24h);
              const isUp = change >= 0;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  key={coin.symbol}
                  className="group relative flex items-center gap-3 p-3 bg-[var(--bg-subtle)] border border-white/[0.05] rounded-2xl hover:bg-[var(--bg-subtle)] hover:border-[var(--accent)]/30 hover:shadow-[0_0_30px_rgba(83,58,253,0.1)] transition-all cursor-pointer"
                  onClick={() => { if (coin.slug) { navigate(`/coin/${coin.slug}`); onClose(); } }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--accent)]/0 via-[var(--accent)]/5 to-[var(--accent)]/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="relative">
                    {coin.image_url ? (
                      <img src={coin.image_url} className="w-10 h-10 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold" style={{ color: getCoinColor(coin.symbol) }}>
                        {coin.symbol.slice(0, 2)}
                      </div>
                    )}
                    {coin.market_cap_rank && (
                      <div className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-[var(--bg-base)] border border-[var(--border-base)] px-1 rounded text-[var(--text-muted)]">
                        {coin.market_cap_rank}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base tracking-tight text-[var(--text-main)] font-mono flex items-center gap-2">
                      <span style={{ color: getCoinColor(coin.symbol) }}>{coin.symbol}</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">{coin.name}</div>
                  </div>

                  <div className="hidden sm:block">
                    <Sparkline symbol={coin.symbol} isUp={isUp} />
                  </div>

                  <div className="text-right">
                    <div className="font-bold font-mono text-sm text-[var(--text-main)]">
                      <PriceCell price={coin.current_price} />
                    </div>
                    <div className={`flex items-center justify-end gap-1 text-xs font-mono font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isUp ? "+" : ""}{change.toFixed(2)}%
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromWatchlist(coin.symbol); }}
                    className="absolute -right-2 -top-2 w-7 h-7 bg-[var(--bg-base)] border border-[var(--border-base)] rounded-full flex items-center justify-center text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all shadow-lg"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showLimitAlert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="m-4 p-4 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-[var(--accent)]/30 rounded-2xl shadow-[0_0_40px_rgba(83,58,253,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-[var(--accent)]" />
                  <span className="font-bold text-sm text-[var(--accent)]">Limit Reached</span>
                </div>
                <button onClick={() => setShowLimitAlert(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">Free plan includes up to {limit} coins. Upgrade to Pro for unlimited tracking.</p>
              <button
                onClick={() => navigate("/pricing")}
                className="w-full py-2 bg-[var(--accent)] text-[var(--text-main)] font-bold text-xs rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Upgrade to Pro
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {watchlist.length > 0 && (
        <div className="px-6 py-4 border-t border-[var(--border-base)] bg-[var(--bg-subtle)]/80 backdrop-blur-md flex items-center justify-between">
          <div className="text-xs font-medium text-[var(--text-muted)]">
            <span className="text-[var(--text-main)] font-mono">{watchlist.length}</span> {limit ? `/ ${limit}` : ""} Tracked
          </div>
          <button
            onClick={() => { if (window.confirm("Clear all coins from watchlist?")) watchlist.forEach((s) => removeFromWatchlist(s)); }}
            className="text-xs font-bold text-red-500/70 hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
