import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMarket } from "../hooks/useMarket";
import { useSparklines } from "../hooks/useSparklines";
import Sparkline from "../components/market/Sparkline";
import PriceCell from "../components/ui/PriceCell";
import GasHeatmap from "../components/market/GasHeatmap";
import { ChevronLeft, ChevronRight, Search, Star, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

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

export default function Market({ isWatched, toggleWatchlist }: any) {
  const { t } = useTranslation();
  const { data: marketData, isLoading, isError, error } = useMarket(10000);
  const [search, setSearch] = useState("");
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
    const term = search.trim().toLowerCase();
    let rows = marketData as any[];
    if (term) rows = rows.filter(c => (c.symbol || "").toLowerCase().includes(term) || (c.name || "").toLowerCase().includes(term));
    return sortRows(rows, sort.key, sort.direction);
  }, [marketData, search, sort]);

  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE);
  const paginated = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const symbols = useMemo(() => paginated.map((c: any) => c.symbol).filter(Boolean), [paginated]);
  const { data: sparklineData } = useSparklines(symbols, 24);

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
        style={{
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: align === "right" ? "flex-end" : "flex-start",
          gap: 3, userSelect: "none",
          fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.08em", whiteSpace: "nowrap",
          color: active ? "var(--text-primary)" : "var(--text-muted)",
          transition: "color 120ms",
        }}
      >
        {label}
        {active && <span style={{ opacity: 0.6 }}>
          {sort.direction === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </span>}
      </div>
    );
  }

  // Pagination
  function getPages() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  }

  const Pagination = () => totalPages <= 1 ? null : (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)",
          background: "var(--bg-surface)", color: page === 1 ? "var(--text-muted)" : "var(--text-primary)",
          fontSize: 12, fontWeight: 600, cursor: page === 1 ? "not-allowed" : "pointer",
          opacity: page === 1 ? 0.5 : 1, transition: "all 120ms",
        }}
      >
        <ChevronLeft size={13} /> Prev
      </button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} style={{ width: 28, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(Number(p))}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
              background: p === page ? "var(--text-primary)" : "var(--bg-surface)",
              color: p === page ? "var(--bg-base)" : "var(--text-muted)",
              fontSize: 12, fontWeight: p === page ? 700 : 400,
              cursor: "pointer", transition: "all 120ms",
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)",
          background: "var(--bg-surface)", color: page === totalPages ? "var(--text-muted)" : "var(--text-primary)",
          fontSize: 12, fontWeight: 600, cursor: page === totalPages ? "not-allowed" : "pointer",
          opacity: page === totalPages ? 0.5 : 1, transition: "all 120ms",
        }}
      >
        Next <ChevronRight size={13} />
      </button>
    </div>
  );

  return (
    <div style={{ color: "var(--text-primary)", fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 1320, margin: "0 auto", padding: "40px 32px" }}>

      {/* ── HEADER ──────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.05em", margin: 0 }}>
            {t("market.title")}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "6px 0 0", fontWeight: 400 }}>
            {filteredAndSorted.length.toLocaleString()} assets · Page {page}/{totalPages || 1}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8,
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block" }} />
            <style>{`@keyframes mk-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", letterSpacing: "0.06em" }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── GAS HEATMAP ─────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <GasHeatmap />
      </div>

      {/* ── MAIN TABLE CARD ─────────────────────────────── */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-soft)",
        borderRadius: 16, overflow: "hidden",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, padding: "14px 20px",
          borderBottom: "1px solid var(--border-soft)",
          flexWrap: "wrap",
        }}>
          {/* Search */}
          <div style={{ position: "relative", width: 300 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("market.search_placeholder")}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "7px 12px 7px 30px",
                fontSize: 13, color: "var(--text-primary)", outline: "none",
                transition: "border-color 120ms",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <Pagination />
        </div>

        {/* Column Headers */}
        <div style={{
          display: "grid", gridTemplateColumns: COL,
          padding: "10px 20px", gap: 8, alignItems: "center",
          borderBottom: "1px solid var(--border-soft)",
          background: "rgba(255,255,255,0.01)",
        }}>
          <div />
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>#</div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            {t("market.table.name")}
          </div>
          <TH label={t("market.table.price")} sortKey="current_price" />
          <TH label={t("market.table.change")} sortKey="price_change_percentage_24h" />
          <TH label={t("market.table.volume")} sortKey="total_volume" />
          <TH label={t("market.table.mcap")} sortKey="market_cap" />
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", textAlign: "right" }}>
            {t("market.table.sparkline")}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", textAlign: "right" }}>
            {t("market.table.updated")}
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div style={{ padding: "8px 0" }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                height: 56, margin: "0 20px",
                borderBottom: "1px solid var(--border-soft)",
                background: `rgba(255,255,255,${0.015 - i * 0.001})`,
                borderRadius: 4,
                animation: "skeleton-pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={{ margin: 20, padding: "14px 18px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#ef4444", fontSize: 13 }}>
            {t("market.error_loading", { error: (error as any)?.message })}
          </div>
        )}

        {/* Empty state */}
        {marketData && filteredAndSorted.length === 0 && (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            {t("market.no_results", { search })}
          </div>
        )}

        {/* Rows */}
        {paginated.map((coin: any, idx: number) => {
          const change = Number(coin.price_change_percentage_24h);
          const isUp = change >= 0;
          const changeColor = isUp ? "#22c55e" : "#ef4444";
          const sparkPrices = sparklineData?.[coin.symbol] || [];
          const rank = (page - 1) * PAGE_SIZE + idx + 1;
          const watched = isWatched?.(coin.symbol);

          // freshness
          const secs = coin.last_updated ? Math.floor((Date.now() - new Date(coin.last_updated).getTime()) / 1000) : null;
          const mins = secs != null ? Math.floor(secs / 60) : null;
          const live = coin.data_source === "binance" && secs != null && secs < 120;
          const freshnessColor = live ? "#22c55e" : mins != null && mins < 10 ? "var(--accent)" : mins != null && mins < 60 ? "#e67e22" : "#666";
          const freshnessLabel = live ? "LIVE" : mins != null && mins < 60 ? `${mins}m ago` : secs != null ? `${Math.floor((mins ?? 0) / 60)}h ago` : "—";

          return (
            <div
              key={coin.symbol + idx}
              onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
              style={{
                display: "grid", gridTemplateColumns: COL,
                padding: "11px 20px", gap: 8, alignItems: "center",
                borderBottom: "1px solid var(--border-soft)",
                cursor: coin.slug ? "pointer" : "default",
                transition: "background 100ms",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Star */}
              <div onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => toggleWatchlist?.(coin.symbol)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: 2,
                    color: watched ? "#f59e0b" : "var(--text-muted)",
                    display: "flex", alignItems: "center",
                    transition: "color 120ms, transform 120ms",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f59e0b"; (e.currentTarget as HTMLElement).style.transform = "scale(1.2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = watched ? "#f59e0b" : "var(--text-muted)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                >
                  <Star size={13} fill={watched ? "#f59e0b" : "none"} />
                </button>
              </div>

              {/* Rank */}
              <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {rank}
              </span>

              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {coin.image_url
                  ? <img src={coin.image_url} alt={coin.symbol} style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0 }} onError={(e: any) => (e.target.style.display = "none")} />
                  : <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>{coin.symbol?.[0]}</div>
                }
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coin.name}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{coin.symbol?.toUpperCase()}</div>
                </div>
              </div>

              {/* Price */}
              <div className="font-mono" style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                <PriceCell price={coin.current_price} />
              </div>

              {/* 24h % */}
              <div style={{ textAlign: "right" }}>
                <span className="font-mono" style={{
                  display: "inline-flex", alignItems: "center", gap: 2,
                  fontSize: 12, fontWeight: 700,
                  padding: "3px 7px", borderRadius: 5,
                  background: isUp ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
                  color: changeColor,
                }}>
                  {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                </span>
              </div>

              {/* Volume */}
              <div className="font-mono" style={{ textAlign: "right", fontSize: 12, color: "var(--text-secondary)" }}>
                {fmt(coin.total_volume)}
              </div>

              {/* Market Cap */}
              <div className="font-mono" style={{ textAlign: "right", fontSize: 12, color: "var(--text-secondary)" }}>
                {fmt(coin.market_cap)}
              </div>

              {/* Sparkline */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Sparkline prices={sparkPrices} width={80} height={30} trendOverride={isUp ? "up" : "down"} />
              </div>

              {/* Updated */}
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, color: freshnessColor, fontFamily: "monospace", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                  {live && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />}
                  {freshnessLabel}
                </span>
              </div>
            </div>
          );
        })}

        {/* Bottom pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", padding: "16px 20px", borderTop: "1px solid var(--border-soft)" }}>
            <Pagination />
          </div>
        )}
      </div>
    </div>
  );
}
