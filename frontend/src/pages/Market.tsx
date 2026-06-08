import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMarket } from "../hooks/useMarket";
import { useSparklines } from "../hooks/useSparklines";
import Sparkline from "../components/market/Sparkline";
import { TableRowSkeleton } from "../components/ui/Skeleton";
import { ChevronLeft, ChevronRight, Search, Star } from "lucide-react";

const PAGE_SIZE = 100;

function formatLargeNumber(n) {
  const num = Number(n);
  if (isNaN(num) || num === 0) return "—";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPrice(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1000)
    return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(4)}`;
  if (num >= 0.0001) return `$${num.toFixed(6)}`;
  if (num >= 0.000001) return `$${num.toFixed(8)}`;
  return `<$0.000001`;
}

function sortRows(rows, key, direction) {
  if (!key) return rows;
  return [...rows].sort((a, b) => {
    const av = Number(a[key]);
    const bv = Number(b[key]);
    if (isNaN(av)) return 1;
    if (isNaN(bv)) return -1;
    return direction === "asc" ? av - bv : bv - av;
  });
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  align = "right",
}) {
  const isActive = currentSort.key === sortKey;
  const arrow = isActive ? (currentSort.direction === "asc" ? "▲" : "▼") : "";
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors"
      style={{
        padding: "12px 16px",
        textAlign: align,
        color: isActive ? "var(--accent)" : "var(--text-muted)",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      {label}{" "}
      {arrow && (
        <span style={{ color: "var(--accent)", fontSize: 10 }}>{arrow}</span>
      )}
    </th>
  );
}

function CoinLogo({ imageUrl, symbol }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={symbol}
        className="w-8 h-8 rounded-full shrink-0"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold font-mono"
      style={{ backgroundColor: "var(--bg-elevated)", color: "var(--accent)" }}
    >
      {symbol?.slice(0, 2)?.toUpperCase()}
    </div>
  );
}

function DataFreshness({ lastUpdated, dataSource }) {
  if (!lastUpdated)
    return <span style={{ fontSize: 10, color: "var(--text-muted)" }}>—</span>;

  const seconds = Math.floor(
    (Date.now() - new Date(lastUpdated).getTime()) / 1000,
  );
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  let label,
    color,
    live = false;

  if (dataSource === "binance" && seconds < 120) {
    label = "Live";
    color = "#2ecc71";
    live = true;
  } else if (minutes < 10) {
    label = `${minutes}m ago`;
    color = "var(--accent)";
  } else if (hours < 1) {
    label = `${minutes}m ago`;
    color = "#e67e22";
  } else {
    label = `${hours}h ago`;
    color = "#888";
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {live && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: color,
            display: "inline-block",
            animation: "pulse 2s infinite",
          }}
        />
      )}
      <span style={{ fontSize: 11, color, fontFamily: "monospace" }}>
        {label}
      </span>
    </div>
  );
}

import GasHeatmap from "../components/market/GasHeatmap";

export default function Market({ isWatched, toggleWatchlist }) {
  const { data: marketData, isLoading, isError, error } = useMarket(10000);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "total_volume", direction: "desc" });
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sortParam = searchParams.get("sort");
    if (sortParam === "gain")
      setSort({ key: "price_change_percentage_24h", direction: "desc" });
    else if (sortParam === "loss")
      setSort({ key: "price_change_percentage_24h", direction: "asc" });
    else if (sortParam === "vol")
      setSort({ key: "total_volume", direction: "desc" });
  }, [searchParams]);

  const filteredAndSorted = useMemo(() => {
    if (!marketData) return [];
    const term = search.trim().toLowerCase();
    let rows = marketData;
    if (term) {
      rows = marketData.filter(
        (c) =>
          (c.symbol || "").toLowerCase().includes(term) ||
          (c.name || "").toLowerCase().includes(term),
      );
    }
    return sortRows(rows, sort.key, sort.direction);
  }, [marketData, search, sort]);

  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE);
  const paginated = filteredAndSorted.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const symbols = useMemo(
    () => paginated.map((c) => c.symbol).filter(Boolean),
    [paginated],
  );
  const { data: sparklineData } = useSparklines(symbols, 24);

  function handleSort(key) {
    setPage(1);
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    );
  }

  function handleSearch(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  const PaginationButtons = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
      
      if (page <= 4) {
        return [1, 2, 3, 4, 5, '...', totalPages];
      }
      if (page >= totalPages - 3) {
        return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      }
      return [1, '...', page - 1, page, page + 1, '...', totalPages];
    };

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: page === 1 ? "var(--text-muted)" : "var(--text-primary)",
            cursor: page === 1 ? "not-allowed" : "pointer",
            opacity: page === 1 ? 0.5 : 1,
          }}
        >
          <ChevronLeft size={14} /> Prev
        </button>
        {getVisiblePages().map((p, idx) => (
          p === '...' ? (
             <span key={`ellipsis-${idx}`} className="w-8 text-center text-gray-500">...</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="w-8 h-8 rounded-lg text-sm font-mono transition-all"
              style={{
                backgroundColor: p === page ? "var(--accent)" : "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: p === page ? "#111" : "var(--text-muted)",
                fontWeight: p === page ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          )
        ))}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color:
              page === totalPages ? "var(--text-muted)" : "var(--text-primary)",
            cursor: page === totalPages ? "not-allowed" : "pointer",
            opacity: page === totalPages ? 0.5 : 1,
          }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    );
  };

  return (
    <div style={{ color: "var(--text-primary)" }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Explorer</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {filteredAndSorted.length} coins — page {page}/{totalPages || 1}
          </p>
        </div>
      </div>

      {/* GAS HEATMAP */}
      <GasHeatmap />

      {/* SEARCH + PAGINATION */}
      <div
        className="flex items-center justify-between gap-4"
        style={{ marginBottom: 16 }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass-panel"
          style={{ width: 300, transition: "var(--transition-smooth)" }}
          onFocusCapture={(e) => {
            e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-soft)";
            e.currentTarget.style.borderColor = "var(--accent-border)";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={search}
            onChange={handleSearch}
            className="bg-transparent outline-none text-sm w-full"
            style={{
              color: "var(--text-primary)",
              caretColor: "var(--accent)",
            }}
          />
        </div>
        <PaginationButtons />
      </div>

      {/* LOADING */}
      {isLoading && (
        <div
          className="overflow-x-auto rounded-2xl glass-panel"
        >
          <table className="w-full">
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={9} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ERROR */}
      {isError && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "var(--negative)",
          }}
        >
          Failed to load market data: {error?.message}
        </div>
      )}

      {/* TABLE */}
      {paginated.length > 0 && (
        <div
          className="overflow-x-auto rounded-2xl glass-panel shadow-2xl"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        >
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              >
                <th style={{ padding: "16px 4px 16px 20px", width: 40 }}></th>
                <th
                  className="text-xs font-semibold uppercase tracking-wider text-left"
                  style={{
                    padding: "16px",
                    color: "var(--text-muted)",
                    width: 48,
                  }}
                >
                  #
                </th>
                <th
                  className="text-xs font-semibold uppercase tracking-wider text-left"
                  style={{ padding: "16px", color: "var(--text-muted)" }}
                >
                  Name
                </th>
                <SortableHeader
                  label="Price"
                  sortKey="current_price"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="24h %"
                  sortKey="price_change_percentage_24h"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Volume"
                  sortKey="total_volume"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Market Cap"
                  sortKey="market_cap"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <th
                  className="text-xs font-semibold uppercase tracking-wider text-right"
                  style={{ padding: "16px", color: "var(--text-muted)" }}
                >
                  Last 24h
                </th>
                <th
                  className="text-xs font-semibold uppercase tracking-wider text-right"
                  style={{ padding: "16px 20px 16px 16px", color: "var(--text-muted)" }}
                >
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((coin, idx) => {
                const change = Number(coin.price_change_percentage_24h);
                const changeColor =
                  change >= 0 ? "var(--positive)" : "var(--negative)";
                const sparkPrices = sparklineData?.[coin.symbol] || [];
                const rank = (page - 1) * PAGE_SIZE + idx + 1;
                const watched = isWatched?.(coin.symbol);

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    style={{
                      borderTop: "1px solid var(--border-soft)",
                      cursor: coin.slug ? "pointer" : "default",
                      transition: "var(--transition-smooth)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.transform = "translateY(-1px) scale(1.002)";
                      e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.3)";
                      e.currentTarget.style.position = "relative";
                      e.currentTarget.style.zIndex = "10";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.zIndex = "1";
                    }}
                  >
                    {/* YILDIZ */}
                    <td
                      style={{ padding: "16px 4px 16px 20px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleWatchlist?.(coin.symbol)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 2,
                          display: "flex",
                          alignItems: "center",
                          color: watched
                            ? "var(--accent)"
                            : "var(--text-muted)",
                          transition: "color 0.15s, transform 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--accent)";
                          e.currentTarget.style.transform = "scale(1.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = watched
                            ? "var(--accent)"
                            : "var(--text-muted)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <Star
                          size={14}
                          fill={watched ? "var(--accent)" : "none"}
                        />
                      </button>
                    </td>

                    {/* RANK */}
                    <td
                      style={{
                        padding: "16px",
                        color: "var(--text-muted)",
                        fontSize: 13,
                      }}
                    >
                      {rank}
                    </td>

                    {/* NAME */}
                    <td style={{ padding: "16px" }}>
                      <div className="flex items-center gap-3">
                        <CoinLogo
                          imageUrl={coin.image_url}
                          symbol={coin.symbol}
                        />
                        <div className="flex flex-col min-w-0">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {coin.name}
                          </span>
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {coin.symbol?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* PRICE */}
                    <td
                      className="text-right font-mono text-sm"
                      style={{
                        padding: "16px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {formatPrice(coin.current_price)}
                    </td>

                    {/* 24H % */}
                    <td
                      className="text-right font-mono text-sm font-semibold"
                      style={{ padding: "16px", color: changeColor }}
                    >
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(2)}%
                    </td>

                    {/* VOLUME */}
                    <td
                      className="text-right font-mono text-sm"
                      style={{
                        padding: "16px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {formatLargeNumber(coin.total_volume)}
                    </td>

                    {/* MARKET CAP */}
                    <td
                      className="text-right font-mono text-sm"
                      style={{
                        padding: "16px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {formatLargeNumber(coin.market_cap)}
                    </td>

                    {/* SPARKLINE */}
                    <td style={{ padding: "16px" }}>
                      <div className="flex justify-end">
                        <Sparkline
                          prices={sparkPrices}
                          width={100}
                          height={32}
                          trendOverride={change >= 0 ? "up" : "down"}
                        />
                      </div>
                    </td>

                    {/* UPDATED */}
                    <td style={{ padding: "16px 20px 16px 16px" }}>
                      <DataFreshness
                        lastUpdated={coin.last_updated}
                        dataSource={coin.data_source}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* EMPTY */}
      {marketData && filteredAndSorted.length === 0 && (
        <div
          className="p-8 text-center rounded-xl"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          No coins found matching "{search}"
        </div>
      )}

      {/* PAGINATION ALT */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-center gap-2"
          style={{ marginTop: 24 }}
        >
          <PaginationButtons />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
