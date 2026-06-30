// ============================================================
// pages/Dashboard.tsx  –  Premium Linear.app Style (Full Rewrite)
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  useMarket,
  useGainers,
  useLosers,
  useMarketStats,
  useTrending,
} from "../hooks/useMarket";
import { useFearAndGreed } from "../hooks/useFearAndGreed";
import PriceCell from "../components/ui/PriceCell";
import { FadeIn } from "../components/ui/FadeIn";
import {
  TrendingUp, TrendingDown, Brain, Flame, Search,
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight,
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
    <svg className="mini-sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
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
    <span className={`change-badge ${isUp ? "up" : "down"} font-mono`}>
      {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {isUp ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

// ─── TH COMPONENT ────────────────────────────────────────────
function TH({
  key,
  label,
  align = "left",
  active,
  direction,
  onClick
}: {
  key: string;
  label: string;
  align?: "left" | "right";
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      key={key}
      onClick={onClick}
      className={`th-btn ${active ? "active" : ""} ${align === "right" ? "align-right" : ""}`}
    >
      {label}
      {active && (
        <span style={{ opacity: 0.7 }}>
          {direction === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </span>
      )}
    </button>
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

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* ── PAGE HEADER ─────────────────────────────────── */}
        <FadeIn className="dashboard-header" delay={0}>
          <div>
            <h1 className="dashboard-title">Markets</h1>
            <p className="dashboard-subtitle">Real-time crypto market data</p>
          </div>
          <div className="dashboard-header-actions">
            <div className="live-badge">
              <span className="live-dot" />
              <span className="live-text">LIVE</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/analysis/ai")}
              className="btn-ghost"
            >
              <Brain size={14} />
              AI Signals
            </motion.button>
          </div>
        </FadeIn>

        {/* ── STAT CARDS ──────────────────────────────────── */}
        <div className="stat-grid">

          {/* Market Cap */}
          <FadeIn className="aave-card px-6 py-5" delay={0.1} whileHover="hover">
            <div className="stat-label text-zinc-400">Global Market Cap</div>
            <div className="stat-value font-mono text-zinc-100">{fmt(totalMcap)}</div>
            <div className="stat-sub text-zinc-500">
              {(coins || []).length > 0 ? `${(coins || []).length}+ assets tracked` : "Loading..."}
            </div>
          </FadeIn>

          {/* 24h Volume */}
          <FadeIn className="aave-card px-6 py-5" delay={0.2} whileHover="hover">
            <div className="stat-label text-zinc-400">24h Volume</div>
            <div className="stat-value font-mono text-zinc-100">{fmt(totalVolume)}</div>
            <div className="stat-sub text-zinc-500">Across all markets</div>
          </FadeIn>

          {/* Dominance */}
          <FadeIn className="aave-card px-6 py-5" delay={0.3} whileHover="hover">
            <div className="stat-label text-zinc-400">BTC Dominance</div>
            <div className="stat-value accent font-mono text-[#F59E0B]">{btcDom}%</div>
            <div className="stat-sub text-zinc-500">ETH: <span className="font-mono text-zinc-300">{ethDom}%</span></div>
          </FadeIn>

          {/* Fear & Greed */}
          <FadeIn className="aave-card px-6 py-5" delay={0.4} whileHover="hover">
            <div className="stat-label text-zinc-400">Fear & Greed</div>
            {fngValue !== null ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  className="fng-circle"
                  style={{
                    background: `conic-gradient(${fngColor} 0% ${fngValue}%, rgba(255,255,255,0.05) ${fngValue}% 100%)`,
                    "--fng-glow": `${fngColor}30`,
                  }}
                >
                  <div className="fng-circle-inner bg-[#0A0A0A]">
                    <span className="fng-value font-mono text-zinc-100">{fngValue}</span>
                  </div>
                </div>
                <div>
                  <div className="fng-label" style={{ color: fngColor }}>{fngLabel}</div>
                  <div className="fng-desc text-zinc-500">Market Sentiment</div>
                </div>
              </div>
            ) : (
              <div className="stat-value text-zinc-500">—</div>
            )}
          </FadeIn>
        </div>

        {/* ── TWO-COLUMN LAYOUT ────────────────────────────── */}
        <div className="dashboard-grid">

          {/* ── MAIN TABLE ─────────────────────────────────── */}
          <div className="aave-card flex flex-col overflow-hidden h-[700px]">
            {/* Toolbar */}
            <div className="table-toolbar">
              {/* Search */}
              <div className="search-wrapper">
                <Search className="search-icon" size={13} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search assets..."
                  className="search-input"
                />
              </div>

              {/* Tabs */}
              <div className="tab-group flex-shrink-0">
                {([
                  { key: "all",      label: "All" },
                  { key: "gainers",  label: "Gainers" },
                  { key: "losers",   label: "Losers" },
                  { key: "trending", label: "Trending" },
                ] as const).map(tab => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Table Header */}
            <div className="table-header flex-shrink-0 bg-white/[0.02]">
              <TH
                key="rank"
                label="#"
                active={sortKey === "rank"}
                direction={sortDir}
                onClick={() => toggleSort("rank")}
              />
              <TH
                key="asset"
                label="Asset"
                active={sortKey === "rank"}
                direction={sortDir}
                onClick={() => toggleSort("rank")}
              />
              <TH
                key="price"
                label="Price"
                align="right"
                active={sortKey === "price"}
                direction={sortDir}
                onClick={() => toggleSort("price")}
              />
              <TH
                key="change"
                label="24h %"
                align="right"
                active={sortKey === "change"}
                direction={sortDir}
                onClick={() => toggleSort("change")}
              />
              <TH
                key="volume"
                label="Volume"
                align="right"
                active={sortKey === "volume"}
                direction={sortDir}
                onClick={() => toggleSort("volume")}
              />
              <TH
                key="mcap"
                label="Mkt Cap"
                align="right"
                active={sortKey === "mcap"}
                direction={sortDir}
                onClick={() => toggleSort("mcap")}
              />
              <div className="th-label text-[11px] text-zinc-500 font-semibold uppercase tracking-wider text-right pr-4">7d</div>
            </div>

            {/* Rows (Scrollable Area) */}
            <div className="table-body flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  {search ? `No results for "${search}"` : "Loading markets..."}
                </div>
              ) : (
                filtered.slice(0, 50).map((coin: any, i: number) => {
                  const change = Number(coin.price_change_percentage_24h) || 0;
                  const isUp = change >= 0;
                  return (
                    <FadeIn
                      delay={0.1 + (i * 0.05)}
                      key={coin.symbol + i}
                      onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                      className="table-row grid grid-cols-[56px_2.2fr_130px_110px_140px_130px_80px] items-center gap-2 px-5 py-3 border-b border-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <span className="rank-col font-mono text-zinc-600 text-[12px] group-hover:text-zinc-400 transition-colors">
                        {coin.market_cap_rank || i + 1}
                      </span>

                      <div className="asset-col flex items-center gap-3">
                        {coin.image_url
                          ? <img src={coin.image_url} alt={coin.symbol} className="asset-icon w-8 h-8 rounded-full shadow-sm" />
                          : <div className="asset-icon-placeholder w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center font-bold text-zinc-500">{coin.symbol?.[0]}</div>
                        }
                        <div className="asset-info flex flex-col justify-center">
                          <div className="asset-name text-[14px] font-semibold text-zinc-100 group-hover:text-white transition-colors">{coin.name}</div>
                          <div className="asset-symbol font-mono text-[11px] text-zinc-500 uppercase">{coin.symbol?.toUpperCase()}</div>
                        </div>
                      </div>

                      <div className="price-col font-mono text-[14px] text-zinc-100 text-right pr-4">
                        <PriceCell price={coin.current_price} />
                      </div>

                      <div className="text-right pr-4">
                        <ChangeBadge value={change} />
                      </div>

                      <div className="volume-col font-mono text-[13px] text-zinc-400 text-right pr-4">{fmt(coin.total_volume)}</div>

                      <div className="mcap-col font-mono text-[13px] text-zinc-400 text-right pr-4">{fmt(coin.market_cap)}</div>

                      <div className="sparkline-col pr-4">
                        <MiniSparkline up={isUp} />
                      </div>
                    </FadeIn>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ───────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Trending */}
            <FadeIn className="aave-card p-4" delay={0.1}>
              <div className="sidebar-header flex items-center justify-between pb-3 border-b border-white/[0.04]">
                <div className="sidebar-title-group flex items-center gap-2">
                  <Flame className="sidebar-icon" size={15} color="#f97316" />
                  <span className="sidebar-title text-[13px] font-semibold text-zinc-200">Trending</span>
                </div>
                <span
                  onClick={() => navigate("/market")}
                  className="sidebar-link text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors"
                >
                  View all →
                </span>
              </div>
              <div className="sidebar-list flex flex-col gap-1 pt-2">
                {(trendingData || []).slice(0, 7).map((coin: any, i: number) => (
                  <FadeIn
                    delay={0.1 + i * 0.05}
                    key={coin.symbol || i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    className="sidebar-item flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <span className="sidebar-rank text-[11px] font-mono text-zinc-600 w-3">{i + 1}</span>
                    {coin.image_url
                      ? <img src={coin.image_url} alt={coin.symbol} className="sidebar-item-icon w-6 h-6 rounded-full" />
                      : <div className="sidebar-item-icon-placeholder w-6 h-6 rounded-full bg-white/[0.08]" />
                    }
                    <div className="sidebar-item-info flex-1">
                      <div className="sidebar-item-name text-[13px] font-medium text-zinc-200">{coin.name}</div>
                      <div className="sidebar-item-symbol text-[11px] text-zinc-500 uppercase">{coin.symbol?.toUpperCase()}</div>
                    </div>
                    {coin.price_change_percentage_24h != null && (
                      <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                    )}
                  </FadeIn>
                ))}
              </div>
            </FadeIn>

            {/* Top Gainers */}
            <FadeIn className="aave-card p-4" delay={0.2}>
              <div className="sidebar-header pb-3 border-b border-white/[0.04]">
                <div className="sidebar-title-group flex items-center gap-2">
                  <TrendingUp className="sidebar-icon" size={15} color="#22c55e" />
                  <span className="sidebar-title text-[13px] font-semibold text-zinc-200">Top Gainers</span>
                </div>
              </div>
              <div className="sidebar-list flex flex-col gap-1 pt-2">
                {(gainersData || []).slice(0, 5).map((coin: any, i: number) => (
                  <FadeIn
                    delay={0.2 + i * 0.05}
                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                    key={coin.symbol + i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    className="sidebar-item flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    {coin.image_url
                      ? <img src={coin.image_url} alt={coin.symbol} className="sidebar-item-icon-lg w-7 h-7 rounded-full" />
                      : <div className="sidebar-item-icon-placeholder w-7 h-7 rounded-full bg-white/[0.08]" />
                    }
                    <div className="sidebar-item-info flex-1">
                      <div className="sidebar-item-name text-[13px] font-medium text-zinc-200">{coin.name}</div>
                      <div className="sidebar-item-price text-[11px] font-mono text-zinc-400">{fmt(coin.current_price)}</div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </FadeIn>
                ))}
              </div>
            </FadeIn>

            {/* Top Losers */}
            <FadeIn className="aave-card p-4" delay={0.3}>
              <div className="sidebar-header pb-3 border-b border-white/[0.04]">
                <div className="sidebar-title-group flex items-center gap-2">
                  <TrendingDown className="sidebar-icon" size={15} color="#ef4444" />
                  <span className="sidebar-title text-[13px] font-semibold text-zinc-200">Top Losers</span>
                </div>
              </div>
              <div className="sidebar-list flex flex-col gap-1 pt-2">
                {(losersData || []).slice(0, 5).map((coin: any, i: number) => (
                  <FadeIn
                    delay={0.3 + i * 0.05}
                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                    key={coin.symbol + i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    className="sidebar-item flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    {coin.image_url
                      ? <img src={coin.image_url} alt={coin.symbol} className="sidebar-item-icon-lg w-7 h-7 rounded-full" />
                      : <div className="sidebar-item-icon-placeholder w-7 h-7 rounded-full bg-white/[0.08]" />
                    }
                    <div className="sidebar-item-info flex-1">
                      <div className="sidebar-item-name text-[13px] font-medium text-zinc-200">{coin.name}</div>
                      <div className="sidebar-item-price text-[11px] font-mono text-zinc-400">{fmt(coin.current_price)}</div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </FadeIn>
                ))}
              </div>
            </FadeIn>

          </div>
        </div>
      </div>
    </div>
  );
}