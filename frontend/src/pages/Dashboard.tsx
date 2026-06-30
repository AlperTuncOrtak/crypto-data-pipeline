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

// ─── ANIMATION VARIANTS ──────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 }
  }
};

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
        <div className="dashboard-header">
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
        </div>

        {/* ── STAT CARDS ──────────────────────────────────── */}
        <motion.div 
          className="stat-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >

          {/* Market Cap */}
          <motion.div className="stat-card" variants={itemVariants} whileHover="hover">
            <div className="stat-label">Global Market Cap</div>
            <div className="stat-value font-mono">{fmt(totalMcap)}</div>
            <div className="stat-sub">
              {(coins || []).length > 0 ? `${(coins || []).length}+ assets tracked` : "Loading..."}
            </div>
          </motion.div>

          {/* 24h Volume */}
          <motion.div className="stat-card" variants={itemVariants} whileHover="hover">
            <div className="stat-label">24h Volume</div>
            <div className="stat-value font-mono">{fmt(totalVolume)}</div>
            <div className="stat-sub">Across all markets</div>
          </motion.div>

          {/* Dominance */}
          <motion.div className="stat-card" variants={itemVariants} whileHover="hover">
            <div className="stat-label">BTC Dominance</div>
            <div className="stat-value accent font-mono">{btcDom}%</div>
            <div className="stat-sub">ETH: <span className="font-mono">{ethDom}%</span></div>
          </motion.div>

          {/* Fear & Greed */}
          <motion.div className="stat-card" variants={itemVariants} whileHover="hover">
            <div className="stat-label">Fear & Greed</div>
            {fngValue !== null ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  className="fng-circle"
                  style={{
                    background: `conic-gradient(${fngColor} 0% ${fngValue}%, rgba(255,255,255,0.05) ${fngValue}% 100%)`,
                    "--fng-glow": `${fngColor}30`,
                  }}
                >
                  <div className="fng-circle-inner">
                    <span className="fng-value font-mono">{fngValue}</span>
                  </div>
                </div>
                <div>
                  <div className="fng-label" style={{ color: fngColor }}>{fngLabel}</div>
                  <div className="fng-desc">Market Sentiment</div>
                </div>
              </div>
            ) : (
              <div className="stat-value" style={{ color: "var(--text-muted)" }}>—</div>
            )}
          </motion.div>
        </motion.div>

        {/* ── TWO-COLUMN LAYOUT ────────────────────────────── */}
        <div className="dashboard-grid">

          {/* ── MAIN TABLE ─────────────────────────────────── */}
          <div className="table-card">
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
              <div className="tab-group">
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
            <div className="table-header">
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
              <div className="th-label">7d</div>
            </div>

            {/* Rows */}
            <motion.div 
              className="table-body"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-20px" }}
            >
              {filtered.length === 0 ? (
                <div className="empty-state">
                  {search ? `No results for "${search}"` : "Loading markets..."}
                </div>
              ) : (
                filtered.slice(0, 50).map((coin: any, i: number) => {
                  const change = Number(coin.price_change_percentage_24h) || 0;
                  const isUp = change >= 0;
                  return (
                    <motion.div
                      variants={itemVariants}
                      whileHover="hover"
                      key={coin.symbol + i}
                      onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                      className="table-row"
                    >
                      <span className="rank-col font-mono">
                        {coin.market_cap_rank || i + 1}
                      </span>

                      <div className="asset-col">
                        {coin.image_url
                          ? <img src={coin.image_url} alt={coin.symbol} className="asset-icon" />
                          : <div className="asset-icon-placeholder">{coin.symbol?.[0]}</div>
                        }
                        <div className="asset-info">
                          <div className="asset-name">{coin.name}</div>
                          <div className="asset-symbol font-mono">{coin.symbol?.toUpperCase()}</div>
                        </div>
                      </div>

                      <div className="price-col">
                        <PriceCell price={coin.current_price} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <ChangeBadge value={change} />
                      </div>

                      <div className="volume-col font-mono">{fmt(coin.total_volume)}</div>

                      <div className="mcap-col font-mono">{fmt(coin.market_cap)}</div>

                      <div className="sparkline-col">
                        <MiniSparkline up={isUp} />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </div>

          {/* ── RIGHT SIDEBAR ───────────────────────────────── */}
          <motion.div 
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-20px" }}
          >

            {/* Trending */}
            <motion.div className="sidebar-card" variants={itemVariants}>
              <div className="sidebar-header">
                <div className="sidebar-title-group">
                  <Flame className="sidebar-icon" size={15} color="#f97316" />
                  <span className="sidebar-title">Trending</span>
                </div>
                <span
                  onClick={() => navigate("/market")}
                  className="sidebar-link"
                >
                  View all →
                </span>
              </div>
              <div className="sidebar-list">
                {(trendingData || []).slice(0, 7).map((coin: any, i: number) => (
                  <div
                    key={coin.symbol || i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    className="sidebar-item"
                  >
                    <span className="sidebar-rank">{i + 1}</span>
                    {coin.image_url
                      ? <img src={coin.image_url} alt={coin.symbol} className="sidebar-item-icon" />
                      : <div className="sidebar-item-icon-placeholder" />
                    }
                    <div className="sidebar-item-info">
                      <div className="sidebar-item-name">{coin.name}</div>
                      <div className="sidebar-item-symbol">{coin.symbol?.toUpperCase()}</div>
                    </div>
                    {coin.price_change_percentage_24h != null && (
                      <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Gainers */}
            <motion.div className="sidebar-card" variants={itemVariants}>
              <div className="sidebar-header" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <div className="sidebar-title-group">
                  <TrendingUp className="sidebar-icon" size={15} color="#22c55e" />
                  <span className="sidebar-title">Top Gainers</span>
                </div>
              </div>
              <div className="sidebar-list">
                {(gainersData || []).slice(0, 5).map((coin: any, i: number) => (
                  <motion.div
                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                    key={coin.symbol + i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    className="sidebar-item"
                  >
                    {coin.image_url
                      ? <img src={coin.image_url} alt={coin.symbol} className="sidebar-item-icon-lg" />
                      : <div className="sidebar-item-icon-placeholder" style={{ width: 26, height: 26 }} />
                    }
                    <div className="sidebar-item-info">
                      <div className="sidebar-item-name">{coin.name}</div>
                      <div className="sidebar-item-price">{fmt(coin.current_price)}</div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Top Losers */}
            <motion.div className="sidebar-card" variants={itemVariants}>
              <div className="sidebar-header" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <div className="sidebar-title-group">
                  <TrendingDown className="sidebar-icon" size={15} color="#ef4444" />
                  <span className="sidebar-title">Top Losers</span>
                </div>
              </div>
              <div className="sidebar-list">
                {(losersData || []).slice(0, 5).map((coin: any, i: number) => (
                  <motion.div
                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                    key={coin.symbol + i}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    className="sidebar-item"
                  >
                    {coin.image_url
                      ? <img src={coin.image_url} alt={coin.symbol} className="sidebar-item-icon-lg" />
                      : <div className="sidebar-item-icon-placeholder" style={{ width: 26, height: 26 }} />
                    }
                    <div className="sidebar-item-info">
                      <div className="sidebar-item-name">{coin.name}</div>
                      <div className="sidebar-item-price">{fmt(coin.current_price)}</div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}