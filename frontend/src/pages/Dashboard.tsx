// ============================================================
// pages/Dashboard.tsx  –  Premium Linear.app Style (Full Rewrite)
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMarket,
  useGainers,
  useLosers,
  useMarketStats,
  useTrending,
} from "../hooks/useMarket";
import { useFearAndGreed } from "../hooks/useFearAndGreed";
import PriceCell from "../components/ui/PriceCell";
import {
  TrendingUp, TrendingDown, Brain, Flame, Search,
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight,
  BarChart2,
} from "lucide-react";

// ─── HELPERS ────────────────────────────────────────────────
function fmt(n: number) {
  if (!n || isNaN(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

// ─── SPARKLINE ───────────────────────────────────────────────
function MiniSparkline({ up }: { up: boolean }) {
  const color = up ? "#22c55e" : "#ef4444";
  const points = up
    ? "0,80 20,65 35,70 50,45 65,50 80,30 100,20"
    : "0,20 20,35 35,30 50,55 65,50 80,70 100,80";
  return (
    <svg width="72" height="32" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,100 ${points} 100,100`}
        fill={`url(#g-${up})`} stroke="none"
      />
      <polyline
        points={points}
        fill="none" stroke={color} strokeWidth="3.5"
        strokeLinejoin="round" strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ─── CHANGE BADGE ────────────────────────────────────────────
function ChangeBadge({ value }: { value: number }) {
  const isUp = value >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      padding: "3px 8px", borderRadius: 6,
      background: isUp ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
      color: isUp ? "#22c55e" : "#ef4444",
      fontSize: 12, fontWeight: 700, fontFamily: "monospace",
      letterSpacing: "-0.01em",
    }}>
      {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {isUp ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
type SortKey = "rank" | "price" | "change" | "volume" | "mcap";

const s = {
  page: {
    minHeight: "100vh",
    color: "var(--text-primary)",
    fontFamily: "'Inter', -apple-system, sans-serif",
  } as React.CSSProperties,
  container: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: "40px 32px",
  } as React.CSSProperties,
};

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: coins } = useMarket();
  const { data: gainersData } = useGainers();
  const { data: losersData } = useLosers();
  const { data: statsData } = useMarketStats();
  const { data: trendingData } = useTrending();
  const { data: fng } = useFearAndGreed();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<"all" | "gainers" | "losers" | "trending">("all");

  // ─── Derived stats ───────────────────────────────────────────
  const calcTotalVolume = coins?.reduce((s: number, c: any) => s + (Number(c.total_volume) || 0), 0) || 0;
  const calcTotalMcap = coins?.reduce((s: number, c: any) => s + (Number(c.market_cap) || 0), 0) || 0;
  const btc = coins?.find((c: any) => c.symbol?.toUpperCase() === "BTC");
  const eth = coins?.find((c: any) => c.symbol?.toUpperCase() === "ETH");
  const calcBtcDom = btc && calcTotalMcap ? ((Number(btc.market_cap) / calcTotalMcap) * 100).toFixed(1) : "—";
  const calcEthDom = eth && calcTotalMcap ? ((Number(eth.market_cap) / calcTotalMcap) * 100).toFixed(1) : "—";

  const totalMcap = statsData?.data?.total_market_cap?.usd || statsData?.total_market_cap?.usd || calcTotalMcap;
  const totalVolume = statsData?.data?.total_volume?.usd || statsData?.total_volume?.usd || calcTotalVolume;
  const btcDom = statsData?.data?.market_cap_percentage?.btc?.toFixed(1) || calcBtcDom;
  const ethDom = statsData?.data?.market_cap_percentage?.eth?.toFixed(1) || calcEthDom;
  const fngValue = fng ? parseInt(fng.value) : null;
  const fngColor = fngValue == null ? "#888"
    : fngValue <= 25 ? "#ef4444"
    : fngValue <= 45 ? "#f97316"
    : fngValue <= 55 ? "#eab308"
    : fngValue <= 75 ? "#22c55e" : "#10b981";
  const fngLabel = fngValue == null ? "—"
    : fngValue <= 25 ? "Extreme Fear"
    : fngValue <= 45 ? "Fear"
    : fngValue <= 55 ? "Neutral"
    : fngValue <= 75 ? "Greed" : "Extreme Greed";

  // ─── List ────────────────────────────────────────────────────
  const baseList: any[] =
    activeTab === "gainers" ? (gainersData || []) :
    activeTab === "losers"  ? (losersData  || []) :
    activeTab === "trending"? (trendingData || []) :
    (coins || []);

  const filtered = baseList
    .filter((c: any) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => {
      let av = 0, bv = 0;
      if (sortKey === "rank")   { av = a.market_cap_rank || 9999; bv = b.market_cap_rank || 9999; }
      if (sortKey === "price")  { av = a.current_price || 0; bv = b.current_price || 0; }
      if (sortKey === "change") { av = a.price_change_percentage_24h || 0; bv = b.price_change_percentage_24h || 0; }
      if (sortKey === "volume") { av = a.total_volume || 0; bv = b.total_volume || 0; }
      if (sortKey === "mcap")   { av = a.market_cap || 0; bv = b.market_cap || 0; }
      return sortDir === "asc" ? av - bv : bv - av;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const COL = "56px 2.2fr 130px 110px 140px 130px 80px";

  function TH({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) {
    const active = sortKey === k;
    return (
      <div
        onClick={() => toggleSort(k)}
        style={{
          cursor: "pointer", display: "flex",
          alignItems: "center",
          justifyContent: align === "right" ? "flex-end" : "flex-start",
          gap: 3, userSelect: "none",
          color: active ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.08em", transition: "color 120ms",
          whiteSpace: "nowrap",
        }}
      >
        {label}
        {active && (
          <span style={{ opacity: 0.7 }}>
            {sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </span>
        )}
      </div>
    );
  }

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ── PAGE HEADER ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.05em", margin: 0, color: "var(--text-primary)" }}>
              Markets
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "6px 0 0", fontWeight: 400 }}>
              Real-time crypto market data
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.18)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block" }} />
              <style>{`@keyframes db-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", letterSpacing: "0.06em" }}>LIVE</span>
            </div>
            <button
              onClick={() => navigate("/analysis/ai")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)",
                background: "var(--bg-surface)", color: "var(--text-primary)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 150ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
            >
              <Brain size={14} />
              AI Signals
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ──────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>

          {/* Market Cap */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, padding: "20px 22px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Global Market Cap
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", fontFamily: "monospace" }}>
              {fmt(totalMcap)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              {(coins || []).length > 0 ? `${(coins || []).length}+ assets tracked` : "Loading..."}
            </div>
          </div>

          {/* 24h Volume */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, padding: "20px 22px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              24h Volume
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", fontFamily: "monospace" }}>
              {fmt(totalVolume)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Across all markets</div>
          </div>

          {/* Dominance */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, padding: "20px 22px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              BTC Dominance
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f7931a", letterSpacing: "-0.03em", fontFamily: "monospace" }}>
              {btcDom}%
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>ETH: {ethDom}%</div>
          </div>

          {/* Fear & Greed */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, padding: "20px 22px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Fear & Greed
            </div>
            {fngValue !== null ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                  background: `conic-gradient(${fngColor} 0% ${fngValue}%, rgba(255,255,255,0.05) ${fngValue}% 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 18px ${fngColor}30`,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: "var(--bg-card)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", fontFamily: "monospace" }}>{fngValue}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: fngColor }}>{fngLabel}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Market Sentiment</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-muted)", fontFamily: "monospace" }}>—</div>
            )}
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

          {/* ── MAIN TABLE ─────────────────────────────────── */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            {/* Toolbar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-soft)",
            }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: 180, maxWidth: 280 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search assets..."
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "7px 12px 7px 30px",
                    fontSize: 13, color: "var(--text-primary)",
                    outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 2, background: "var(--bg-surface)", padding: 3, borderRadius: 8, border: "1px solid var(--border)" }}>
                {([
                  { key: "all",      label: "All" },
                  { key: "gainers",  label: "🔥 Gainers" },
                  { key: "losers",   label: "📉 Losers" },
                  { key: "trending", label: "⚡ Trending" },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 600, transition: "all 120ms",
                      background: activeTab === tab.key ? "rgba(255,255,255,0.09)" : "transparent",
                      color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Header */}
            <div style={{
              display: "grid", gridTemplateColumns: COL,
              padding: "10px 20px", gap: 8, alignItems: "center",
              borderBottom: "1px solid var(--border-soft)",
              background: "rgba(255,255,255,0.01)",
            }}>
              <TH k="rank" label="#" />
              <TH k="rank" label="Asset" />
              <TH k="price" label="Price" align="right" />
              <TH k="change" label="24h %" align="right" />
              <TH k="volume" label="Volume" align="right" />
              <TH k="mcap" label="Mkt Cap" align="right" />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>7d</div>
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                {search ? `No results for "${search}"` : "Loading markets..."}
              </div>
            ) : (
              filtered.slice(0, 50).map((coin: any, i: number) => {
                const change = Number(coin.price_change_percentage_24h) || 0;
                const isUp = change >= 0;
                return (
                  <div
                    key={coin.symbol + i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    style={{
                      display: "grid", gridTemplateColumns: COL,
                      padding: "12px 20px", gap: 8, alignItems: "center",
                      borderBottom: "1px solid var(--border-soft)",
                      cursor: "pointer", transition: "background 100ms",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace", textAlign: "center" }}>
                      {coin.market_cap_rank || i + 1}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      {coin.image_url
                        ? <img src={coin.image_url} alt={coin.symbol} style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0 }} />
                        : <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-elevated)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{coin.symbol?.[0]}</div>
                      }
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coin.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginTop: 1 }}>{coin.symbol?.toUpperCase()}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace" }}>
                      <PriceCell price={coin.current_price} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <ChangeBadge value={change} />
                    </div>

                    <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                      {fmt(coin.total_volume)}
                    </div>

                    <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                      {fmt(coin.market_cap)}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <MiniSparkline up={isUp} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── RIGHT SIDEBAR ───────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Trending */}
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-soft)",
              borderRadius: 16, overflow: "hidden",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderBottom: "1px solid var(--border-soft)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Flame size={15} color="#f97316" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Trending</span>
                </div>
                <span
                  onClick={() => navigate("/market")}
                  style={{ fontSize: 12, color: "var(--text-muted)", cursor: "pointer", transition: "color 120ms" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  View all →
                </span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {(trendingData || []).slice(0, 7).map((coin: any, i: number) => (
                  <div
                    key={coin.symbol || i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 20px", cursor: "pointer", transition: "background 100ms",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                    {coin.image_url
                      ? <img src={coin.image_url} alt={coin.symbol} style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0 }} />
                      : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--bg-elevated)", flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coin.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{coin.symbol?.toUpperCase()}</div>
                    </div>
                    {coin.price_change_percentage_24h != null && (
                      <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Gainers */}
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-soft)",
              borderRadius: 16, overflow: "hidden",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "16px 20px", borderBottom: "1px solid var(--border-soft)",
              }}>
                <TrendingUp size={15} color="#22c55e" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Top Gainers</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {(gainersData || []).slice(0, 5).map((coin: any, i: number) => (
                  <div
                    key={coin.symbol + i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 20px", cursor: "pointer", transition: "background 100ms",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {coin.image_url
                      ? <img src={coin.image_url} alt={coin.symbol} style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0 }} />
                      : <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--bg-elevated)", flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coin.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{fmt(coin.current_price)}</div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-soft)",
              borderRadius: 16, overflow: "hidden",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "16px 20px", borderBottom: "1px solid var(--border-soft)",
              }}>
                <TrendingDown size={15} color="#ef4444" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Top Losers</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {(losersData || []).slice(0, 5).map((coin: any, i: number) => (
                  <div
                    key={coin.symbol + i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 20px", cursor: "pointer", transition: "background 100ms",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {coin.image_url
                      ? <img src={coin.image_url} alt={coin.symbol} style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0 }} />
                      : <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--bg-elevated)", flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coin.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{fmt(coin.current_price)}</div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
