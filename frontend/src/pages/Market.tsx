import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMarket } from "../hooks/useMarket";
import { useSparklines } from "../hooks/useSparklines";
import Sparkline from "../components/market/Sparkline";
import GasHeatmap from "../components/market/GasHeatmap";
import { ChevronLeft, ChevronRight, Search, Star, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import LivePrice from "../components/ui/LivePrice";

const PAGE_SIZE = 100;

function fmt(n: any) {
  const v = Number(n);
  if (isNaN(v) || v === 0) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3)  return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

function sortRows(rows: any[], key: string, dir: string) {
  if (!key) return rows;
  return [...rows].sort((a, b) => {
    const av = Number(a[key]), bv = Number(b[key]);
    if (isNaN(av)) return 1;
    if (isNaN(bv)) return -1;
    return dir === "asc" ? av - bv : bv - av;
  });
}

const COL = "36px 44px 2.2fr 130px 110px 140px 130px 90px 70px";

const FadeIn = ({ children, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default function Market({ isWatched, toggleWatchlist }: any) {
  const { t } = useTranslation();
  const { data: marketData, isLoading, isError, error } = useMarket(10000);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sort, setSort] = useState({ key: "market_cap", direction: "desc" });
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sp = searchParams.get("sort");
    if (sp === "gain") setSort({ key: "price_change_percentage_24h", direction: "desc" });
    else if (sp === "loss") setSort({ key: "price_change_percentage_24h", direction: "asc" });
    else if (sp === "vol") setSort({ key: "total_volume", direction: "desc" });
  }, [searchParams]);

  const filteredAndSorted = useMemo(() => {
    if (!marketData) return [];
    
    let rows = [...(marketData as any[])];
    
    // Tab filters
    if (activeTab === "gainers") {
       rows = rows.filter(c => c.price_change_percentage_24h > 0);
    } else if (activeTab === "losers") {
       rows = rows.filter(c => c.price_change_percentage_24h < 0);
    }
    
    const term = search.trim().toLowerCase();
    if (term) rows = rows.filter(c => (c.symbol || "").toLowerCase().includes(term) || (c.name || "").toLowerCase().includes(term));
    
    return sortRows(rows, sort.key, sort.direction);
  }, [marketData, search, sort, activeTab]);

  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE);
  const paginated = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const symbols = useMemo(() => paginated.map((c: any) => c.symbol).filter(Boolean), [paginated]);
  const { data: sparklineData } = useSparklines(symbols, 24);

  const topGainers = useMemo(() => {
    if (!marketData) return [];
    return [...(marketData as any[])].sort((a, b) => Number(b.price_change_percentage_24h) - Number(a.price_change_percentage_24h)).slice(0, 5);
  }, [marketData]);

  useEffect(() => {
    if (!marketData) return;
    const btc = (marketData as any[]).find(c => c.symbol === "btc");
    if (btc) {
      document.title = `BTC $${Number(btc.current_price).toLocaleString()} | CryptoNeko`;
    }
  }, [marketData]);

  function handleSort(key: string) {
    setPage(1);
    setSort(prev => prev.key === key
      ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      : { key, direction: "desc" }
    );
  }

  function TH({ label, sortKey, align = "right" }: { label: string; sortKey: string; align?: "left" | "right" }) {
    const active = sort.key === sortKey;
    return (
      <div
        onClick={() => handleSort(sortKey)}
        className={`flex items-center gap-1 cursor-pointer select-none text-[11px] font-bold uppercase tracking-widest transition-colors ${active ? "text-[var(--text-main)]" : "text-[var(--text-muted)] hover:text-gray-300"}`}
        style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}
      >
        {label}
        {active && <span className="opacity-60">
          {sort.direction === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </span>}
      </div>
    );
  }

  function getPages() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  }

  const Pagination = () => totalPages <= 1 ? null : (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-2xl border border-[var(--border-base)] bg-white/5 text-xs font-bold transition-all disabled:opacity-50 hover:bg-[var(--border-base)] text-[var(--text-main)]"
      >
        <ChevronLeft size={13} /> Prev
      </button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="w-7 text-center text-[var(--text-muted)] text-xs">…</span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(Number(p))}
            className={`w-8 h-8 rounded-2xl border text-xs font-bold transition-all ${
              p === page 
                ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-md" 
                : "bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-base)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-main)]"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-1.5 rounded-2xl border border-[var(--border-base)] bg-[var(--bg-subtle)] text-xs font-bold transition-all disabled:opacity-50 hover:bg-[var(--bg-overlay)] text-[var(--text-main)]"
      >
        Next <ChevronRight size={13} />
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] pt-24 pb-32 px-6 lg:px-12 overflow-x-hidden font-sans">
      {/* BACKGROUND GLOWS (Stripe inspired mesh at the top) */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40">
        <div className="w-[800px] h-[300px] bg-[var(--accent)] blur-[150px] rounded-[100%] opacity-20 absolute -top-[100px] left-[10%]"></div>
        <div className="w-[600px] h-[250px] bg-[var(--positive)] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div>
      </div>

      <div className="max-w-[1320px] mx-auto relative z-20">
      {/* HEADER */}
      <FadeIn>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight">{t("market.title")}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2 font-medium">
              {filteredAndSorted.length.toLocaleString()} assets · Page {page}/{totalPages || 1}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--positive-muted)] border border-[var(--border-subtle)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] shadow-[0_0_8px_var(--positive)] animate-pulse" />
              <span className="text-[11px] font-black tracking-widest text-[var(--positive)]">LIVE</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* GAS HEATMAP */}
      <FadeIn delay={0.1}>
        <div className="mb-6">
          <GasHeatmap />
        </div>
      </FadeIn>

      {/* LIVE MARQUEE TICKER */}
      <FadeIn delay={0.15}>
        <div className="mb-6 bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] rounded-2xl overflow-hidden flex items-center px-4 py-2 shadow-lg">
          <div className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mr-4 shrink-0 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse" />
            Top Gainers
          </div>
          <div className="flex-1 overflow-hidden relative flex items-center h-6">
            <div className="animate-marquee whitespace-nowrap flex gap-8 items-center absolute">
              {topGainers.map((coin: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-[var(--text-main)]">{coin.symbol.toUpperCase()}</span>
                  <span className="text-[var(--positive)]">+{Number(coin.price_change_percentage_24h).toFixed(2)}%</span>
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {topGainers.map((coin: any, i: number) => (
                <div key={`dup-${i}`} className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-[var(--text-main)]">{coin.symbol.toUpperCase()}</span>
                  <span className="text-[var(--positive)]">+{Number(coin.price_change_percentage_24h).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* MAIN TABLE BENTO BOX */}
      <FadeIn delay={0.2}>
        <div className="bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-2xl rounded-[32px] overflow-hidden">
          
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-[300px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder={t("market.search_placeholder")}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-3xl py-2 pl-9 pr-4 text-[13px] font-medium text-[var(--text-main)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              {/* Segmented Tabs */}
              <div className="flex items-center p-1 bg-[var(--bg-base)] border border-[var(--border-base)] rounded-3xl hidden md:flex">
                {[
                  { id: "all", label: "🔥 All Assets" },
                  { id: "trending", label: "💎 Trending" },
                  { id: "gainers", label: "🚀 Top Gainers" },
                  { id: "losers", label: "🩸 Top Losers" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPage(1);
                      if (tab.id === "gainers") setSort({ key: "price_change_percentage_24h", direction: "desc" });
                      else if (tab.id === "losers") setSort({ key: "price_change_percentage_24h", direction: "asc" });
                      else if (tab.id === "trending") setSort({ key: "total_volume", direction: "desc" });
                      else setSort({ key: "market_cap", direction: "desc" });
                    }}
                    className={`px-4 py-1.5 rounded-2xl text-xs font-bold transition-all ${activeTab === tab.id ? "bg-[var(--bg-elevated)] text-[var(--text-main)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-overlay)]"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <Pagination />
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[950px]">
              {/* Column Headers */}
              <div className="grid grid-cols-[36px_44px_2.2fr_130px_110px_140px_130px_90px_70px] px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] items-center gap-2 sticky top-0 z-10 shadow-sm">
                <div />
                <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">#</div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{t("market.table.name")}</div>
                <TH label={t("market.table.price")} sortKey="current_price" />
                <TH label={t("market.table.change")} sortKey="price_change_percentage_24h" />
                <TH label={t("market.table.volume")} sortKey="total_volume" />
                <TH label={t("market.table.mcap")} sortKey="market_cap" />
                <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">{t("market.table.sparkline")}</div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">{t("market.table.updated")}</div>
              </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-14 mx-5 my-1 rounded-3xl bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="m-5 p-4 rounded-3xl bg-[var(--negative)]/10 border border-[var(--negative)]/20 text-red-500 text-sm font-medium">
              {t("market.error_loading", { error: (error as any)?.message })}
            </div>
          )}

          {/* Empty */}
          {marketData && filteredAndSorted.length === 0 && (
            <div className="py-20 text-center text-[var(--text-muted)] font-medium text-sm">
              {t("market.no_results", { search })}
            </div>
          )}

              {/* Rows */}
              <div className="divide-y divide-[var(--border-subtle)]">
                {paginated.map((coin: any, idx: number) => {
                  const change = Number(coin.price_change_percentage_24h);
                  const isUp = change >= 0;
                  const sparkPrices = sparklineData?.[coin.symbol] || [];
                  const rank = (page - 1) * PAGE_SIZE + idx + 1;
                  const watched = isWatched?.(coin.symbol);

                  // freshness
                  const secs = coin.last_updated ? Math.floor((Date.now() - new Date(coin.last_updated).getTime()) / 1000) : null;
                  const mins = secs != null ? Math.floor(secs / 60) : null;
                  const live = coin.data_source === "binance" && secs != null && secs < 120;
                  const freshnessColor = live ? "text-[var(--accent)]" : mins != null && mins < 10 ? "text-[var(--accent)]" : mins != null && mins < 60 ? "text-orange-500" : "text-[var(--text-muted)]";
                  const freshnessLabel = live ? "LIVE" : mins != null && mins < 60 ? `${mins}m` : secs != null ? `${Math.floor((mins ?? 0) / 60)}h` : "—";

                  return (
                    <motion.div
                      key={coin.symbol}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.01 }}
                      onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                      className={`grid grid-cols-[36px_44px_2.2fr_130px_110px_140px_130px_90px_70px] px-5 py-3 items-center gap-2 group transition-colors ${coin.slug ? "cursor-pointer hover:bg-[var(--bg-overlay)]" : ""}`}
                    >
                      {/* Star */}
                      <div onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleWatchlist?.(coin.symbol)}
                          className={`p-1.5 rounded-2xl transition-all ${watched ? "text-[var(--accent)]" : "text-gray-600 hover:text-[var(--accent)] hover:bg-[var(--border-subtle)]"}`}
                        >
                          <Star size={14} fill={watched ? "currentColor" : "none"} strokeWidth={watched ? 1 : 2} />
                        </button>
                      </div>

                      {/* Rank */}
                      <span className="font-mono text-xs font-bold text-[var(--text-muted)] group-hover:text-gray-300 transition-colors">
                        {rank}
                      </span>

                      {/* Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        {coin.image_url ? (
                          <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full shrink-0" onError={(e: any) => (e.target.style.display = "none")} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-[var(--text-main)] shrink-0">
                            {coin.symbol?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[var(--text-main)] truncate">{coin.name}</div>
                          <div className="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase mt-0.5">{coin.symbol}</div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right font-mono text-sm font-bold text-[var(--text-main)] flex justify-end">
                        <LivePrice 
                          value={Number.isNaN(Number(coin.current_price)) ? 0 : Number(coin.current_price)} 
                          format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: coin.current_price < 0.01 ? 6 : (coin.current_price < 1 ? 4 : 2) }} 
                        />
                      </div>

                      {/* 24h Change */}
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-2xl ${isUp ? "bg-green-500/10 text-[var(--accent)]" : "bg-[var(--negative)]/10 text-[var(--negative)]"}`}>
                          {isUp ? "▲" : "▼"} 
                          <NumberFlow value={Number.isNaN(Number(change)) ? 0 : Math.abs(Number(change))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%
                        </span>
                      </div>

                      {/* Volume */}
                      <div className="text-right font-mono text-xs font-medium text-[var(--text-muted)]">
                        {fmt(coin.total_volume)}
                      </div>

                      {/* Market Cap */}
                      <div className="text-right font-mono text-xs font-medium text-[var(--text-muted)]">
                        {fmt(coin.market_cap)}
                      </div>

                      {/* Sparkline */}
                      <div className="flex justify-end pr-2">
                        <Sparkline prices={sparkPrices} width={70} height={24} trendOverride={isUp ? "up" : "down"} />
                      </div>

                      {/* Updated */}
                      <div className="text-right flex items-center justify-end">
                        <span className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${freshnessColor}`}>
                          {live && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />}
                          {freshnessLabel}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4 border-t border-[var(--border-subtle)] bg-black/20">
              <Pagination />
            </div>
          )}
        </div>
      </FadeIn>
      </div>
    </div>
  );
}

