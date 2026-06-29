// ============================================================
// pages/Dashboard.tsx  –  Aave Pro Style
// ============================================================
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMarket,
  useGainers,
  useLosers,
  useMarketStats,
  useTrending,
} from "../hooks/useMarket";
import { useAlerts } from "../hooks/useAlerts";
import { useSparklines } from "../hooks/useSparklines";
import { useFearAndGreed } from "../hooks/useFearAndGreed";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useTranslation } from "react-i18next";
import PriceCell from "../components/ui/PriceCell";
import {
  TrendingUp, TrendingDown, Activity, Brain,
  ArrowRight, Flame, BarChart2, Search,
  ChevronUp, ChevronDown, Star, SlidersHorizontal,
  ArrowUpRight, ArrowDownRight, Info,
} from "lucide-react";

// ─── HELPERS ────────────────────────────────────────────────
function fmt(n: number) {
  if (!n || isNaN(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

function fmtPrice(n: number) {
  if (!n || isNaN(n)) return "—";
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

// ─── SPARKLINE ───────────────────────────────────────────────
function MiniSparkline({ points, up }: { points: number[]; up: boolean }) {
  if (!points || points.length < 2) return <div style={{ width: 80, height: 28 }} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pts = points
    .map((v, i) => `${(i / (points.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(" ");
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <svg width="80" height="28" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-d-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,100 ${pts} 100,100`} fill={`url(#sg-d-${up})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── CHANGE BADGE ────────────────────────────────────────────
function ChangeBadge({ value }: { value: number }) {
  const isUp = value >= 0;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "4px 8px", borderRadius: 6,
      background: isUp ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
      color: isUp ? "#22c55e" : "#ef4444",
      fontSize: 12, fontWeight: 700, fontFamily: "monospace",
    }}>
      {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {isUp ? "+" : ""}{value.toFixed(2)}%
    </div>
  );
}

// ─── STAT CARD (top bar) ─────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      padding: "20px 24px",
      borderRadius: 12,
      background: "#1c1c1e",
      border: "1px solid #2a2a2e",
      minWidth: 180,
      flex: 1,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", fontFamily: "monospace" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#555", marginTop: 4, fontFamily: "monospace" }}>{sub}</div>
      )}
    </div>
  );
}

// ─── FEAR & GREED ────────────────────────────────────────────
function FearGreedBadge({ value }: { value: number }) {
  const color =
    value <= 25 ? "#ef4444" :
    value <= 45 ? "#f97316" :
    value <= 55 ? "#eab308" :
    value <= 75 ? "#22c55e" : "#10b981";
  const label =
    value <= 25 ? "Extreme Fear" :
    value <= 45 ? "Fear" :
    value <= 55 ? "Neutral" :
    value <= 75 ? "Greed" : "Extreme Greed";

  return (
    <div style={{
      padding: "20px 24px",
      borderRadius: 12,
      background: "#1c1c1e",
      border: "1px solid #2a2a2e",
      flex: 1,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        Fear & Greed
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: `conic-gradient(${color} ${value}%, #2a2a2e ${value}%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "#1c1c1e",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>{value}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11, color: "#555" }}>Market Sentiment</div>
        </div>
      </div>
    </div>
  );
}

// ─── SORT ICON ───────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <span style={{ color: active ? "#fff" : "#444", marginLeft: 4 }}>
      {dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
    </span>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
type SortKey = "rank" | "price" | "change" | "volume" | "mcap";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: coins } = useMarket();
  const { data: gainersData } = useGainers();
  const { data: losersData } = useLosers();
  const { data: statsData } = useMarketStats();
  const { data: trendingData } = useTrending();
  const { data: alertsData } = useAlerts();
  const { data: fng } = useFearAndGreed();

  const revealRef = useScrollReveal();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<"all" | "gainers" | "losers" | "trending">("all");

  const calcTotalVolume = coins?.reduce((s: number, c: any) => s + (Number(c.total_volume) || 0), 0) || 0;
  const calcTotalMcap = coins?.reduce((s: number, c: any) => s + (Number(c.market_cap) || 0), 0) || 0;
  const btc = coins?.find((c: any) => c.symbol?.toUpperCase() === "BTC");
  const eth = coins?.find((c: any) => c.symbol?.toUpperCase() === "ETH");
  const calcBtcDom = btc && calcTotalMcap ? ((Number(btc.market_cap) / calcTotalMcap) * 100).toFixed(1) : "0.0";
  const calcEthDom = eth && calcTotalMcap ? ((Number(eth.market_cap) / calcTotalMcap) * 100).toFixed(1) : "0.0";

  const totalMcap = statsData?.data?.total_market_cap?.usd || statsData?.total_market_cap?.usd || calcTotalMcap;
  const totalVolume = statsData?.data?.total_volume?.usd || statsData?.total_volume?.usd || calcTotalVolume;
  const btcDom = statsData?.data?.market_cap_percentage?.btc?.toFixed(1) || statsData?.market_cap_percentage?.btc?.toFixed(1) || calcBtcDom;
  const ethDom = statsData?.data?.market_cap_percentage?.eth?.toFixed(1) || statsData?.market_cap_percentage?.eth?.toFixed(1) || calcEthDom;
  const fngValue = fng ? parseInt(fng.value) : null;

  // build display list based on tab
  const baseList: any[] =
    activeTab === "gainers" ? (gainersData || []) :
    activeTab === "losers"  ? (losersData || []) :
    activeTab === "trending"? (trendingData || []) :
    (coins || []);

  // filter + sort
  const filtered = baseList
    .filter((c: any) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => {
      let av = 0, bv = 0;
      if (sortKey === "rank") { av = a.market_cap_rank || 9999; bv = b.market_cap_rank || 9999; }
      else if (sortKey === "price") { av = a.current_price || 0; bv = b.current_price || 0; }
      else if (sortKey === "change") { av = a.price_change_percentage_24h || 0; bv = b.price_change_percentage_24h || 0; }
      else if (sortKey === "volume") { av = a.total_volume || 0; bv = b.total_volume || 0; }
      else if (sortKey === "mcap") { av = a.market_cap || 0; bv = b.market_cap || 0; }
      return sortDir === "asc" ? av - bv : bv - av;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const TH = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: string }) => (
    <div
      onClick={() => toggleSort(k)}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        gap: 2,
        userSelect: "none",
        color: sortKey === k ? "#fff" : "#555",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        transition: "color 150ms",
      }}
    >
      {label}
      {sortKey === k && <SortIcon active dir={sortDir} />}
    </div>
  );

  return (
    <div ref={revealRef} style={{
      minHeight: "100vh",
      color: "#fff",
      background: "#111113",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* ─── CONTENT ─── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 32px" }}>

        {/* ─── PAGE TITLE ─── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", margin: 0,
              color: "#fff",
            }}>
              Markets
            </h1>
            <p style={{ fontSize: 13, color: "#555", marginTop: 4, margin: "4px 0 0 0" }}>
              Live crypto market data — sorted by market cap.
            </p>
          </div>
          {/* Live badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#1c1c1e", border: "1px solid #2a2a2e",
            padding: "6px 12px", borderRadius: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", letterSpacing: "0.06em" }}>LIVE</span>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
          </div>
        </div>

        {/* ─── STAT CARDS ─── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard label="Global Market Cap" value={fmt(totalMcap)} sub={`${(coins || []).length}+ assets`} />
          <StatCard label="24h Volume" value={fmt(totalVolume)} sub="across all markets" />
          <StatCard label="BTC Dominance" value={`${btcDom}%`} sub={`ETH: ${ethDom}%`} />
          {fngValue !== null && <FearGreedBadge value={fngValue} />}
        </div>

        {/* ─── SEARCH + FILTERS ─── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 0,
          padding: "12px 16px",
          borderRadius: "12px 12px 0 0",
          background: "#1c1c1e",
          border: "1px solid #2a2a2e",
          borderBottom: "none",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assets..."
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#141414",
                border: "1px solid #2a2a2e",
                borderRadius: 8,
                padding: "8px 12px 8px 32px",
                fontSize: 13, color: "#fff",
                outline: "none",
              }}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#141414", padding: 4, borderRadius: 8, border: "1px solid #2a2a2e" }}>
            {([
              { key: "all",      label: "All Assets" },
              { key: "gainers",  label: "🔥 Gainers" },
              { key: "losers",   label: "📉 Losers" },
              { key: "trending", label: "⚡ Trending" },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  transition: "all 150ms",
                  background: activeTab === tab.key ? "#fff" : "transparent",
                  color: activeTab === tab.key ? "#111" : "#555",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate("/analysis/ai")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #B6509E 0%, #2EBAC6 100%)",
                color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Brain size={14} /> AI Signal
            </button>
          </div>
        </div>

        {/* ─── TABLE ─── */}
        <div style={{
          background: "#1c1c1e",
          border: "1px solid #2a2a2e",
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
        }}>

          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "50px 2.5fr 140px 120px 150px 140px 90px",
            padding: "12px 20px",
            borderBottom: "1px solid #242428",
            gap: 12,
          }}>
            <TH k="rank" label="#" />
            <TH k="rank" label="Asset" />
            <TH k="price" label="Price" align="right" />
            <TH k="change" label="24h %" align="right" />
            <TH k="volume" label="24h Volume" align="right" />
            <TH k="mcap" label="Market Cap" align="right" />
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555" }}>
              7d Chart
            </div>
          </div>

          {/* Table Rows */}
          {filtered.slice(0, 50).map((coin: any, i: number) => {
            const change = Number(coin.price_change_percentage_24h) || 0;
            const isUp = change >= 0;
            return (
              <div
                key={coin.symbol + i}
                onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 2.5fr 140px 120px 150px 140px 90px",
                  padding: "14px 20px",
                  borderBottom: "1px solid #1f1f22",
                  cursor: "pointer",
                  transition: "background 150ms",
                  gap: 12,
                  alignItems: "center",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#242428")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Rank */}
                <span style={{ fontSize: 12, color: "#444", fontFamily: "monospace", textAlign: "center" }}>
                  {coin.market_cap_rank || i + 1}
                </span>

                {/* Asset */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {coin.image_url
                    ? <img src={coin.image_url} alt={coin.symbol} style={{ width: 32, height: 32, borderRadius: "50%", background: "#2a2a2e" }} />
                    : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2a2a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{coin.symbol?.[0]}</div>
                  }
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{coin.name}</div>
                    <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginTop: 1 }}>{coin.symbol?.toUpperCase()}</div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>
                  <PriceCell price={coin.current_price} />
                </div>

                {/* 24h Change */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <ChangeBadge value={change} />
                </div>

                {/* Volume */}
                <div style={{ textAlign: "right", fontSize: 13, color: "#888", fontFamily: "monospace" }}>
                  {fmt(coin.total_volume)}
                </div>

                {/* Market Cap */}
                <div style={{ textAlign: "right", fontSize: 13, color: "#888", fontFamily: "monospace" }}>
                  {fmt(coin.market_cap)}
                </div>

                {/* Mini chart placeholder */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <MiniSparkline points={[0, isUp ? 1 : 0.8, isUp ? 0.9 : 0.6, isUp ? 1.2 : 0.4, isUp ? 1.1 : 0.3, isUp ? 1.3 : 0.2, isUp ? 1.5 : 0.1]} up={isUp} />
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "#444", fontSize: 14 }}>
              No assets found matching "{search}"
            </div>
          )}
        </div>

        {/* ─── BOTTOM ROW: Trending + Recent Activity ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>

          {/* Trending */}
          <div style={{ background: "#1c1c1e", border: "1px solid #2a2a2e", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Flame size={16} color="#f97316" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Trending</span>
              </div>
              <span onClick={() => navigate("/market")} style={{ fontSize: 12, color: "#555", cursor: "pointer" }}>
                View all →
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {(trendingData || []).slice(0, 6).map((coin: any, i: number) => (
                <div
                  key={coin.symbol || i}
                  onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 0",
                    borderBottom: i < 5 ? "1px solid #1f1f22" : "none",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 11, color: "#333", fontFamily: "monospace", width: 16 }}>{i + 1}</span>
                  {coin.image_url
                    ? <img src={coin.image_url} alt={coin.symbol} style={{ width: 24, height: 24, borderRadius: "50%" }} />
                    : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2a2a2e" }} />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{coin.name}</div>
                    <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>{coin.symbol?.toUpperCase()}</div>
                  </div>
                  {coin.price_change_percentage_24h != null && (
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top Gainers & Losers */}
          <div style={{ background: "#1c1c1e", border: "1px solid #2a2a2e", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
              {[
                { key: "gainers", label: "Top Gainers", icon: <TrendingUp size={14} color="#22c55e" />, data: gainersData },
                { key: "losers", label: "Top Losers", icon: <TrendingDown size={14} color="#ef4444" />, data: losersData },
              ].map(({ key, label, icon, data }, si) => (
                <div key={key} style={{ flex: 1, paddingRight: si === 0 ? 16 : 0, paddingLeft: si === 1 ? 16 : 0, borderLeft: si === 1 ? "1px solid #2a2a2e" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    {icon}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{label}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {(data || []).slice(0, 5).map((coin: any, ci: number) => (
                      <div
                        key={coin.symbol + ci}
                        onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "7px 0",
                          borderBottom: ci < 4 ? "1px solid #1f1f22" : "none",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          {coin.image_url
                            ? <img src={coin.image_url} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: "50%" }} />
                            : <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2a2a2e" }} />
                          }
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>{coin.symbol?.toUpperCase()}</span>
                        </div>
                        <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
