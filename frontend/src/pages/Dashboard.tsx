import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMarket,
  useGainers,
  useLosers,
  useVolume,
  useTrending,
  useMarketStats,
} from "../hooks/useMarket";
import CoinListCard from "../components/market/CoinListCard";
import VolumeSpikeRadar from "../components/market/VolumeSpikeRadar";
import MarketOracle from "../components/market/MarketOracle";
import HeatmapWidget from "../components/market/HeatmapWidget";
import { TableRowSkeleton } from "../components/ui/Skeleton";
import { TrendingUp, Activity, DollarSign, Flame, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

function formatLargeNumber(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
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

// ─── BENTO CARD BASE ────────────────────────────────────────────
const bentoBase = {
  backgroundColor: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 24,
  overflow: "hidden",
  position: "relative",
  transition: "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
  transform: "translateZ(0)",
};

function BentoCard({ children, style = {}, className = "", onMouseEnter, onMouseLeave }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className={className}
      style={{
        ...bentoBase,
        borderColor: hov ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
        backgroundColor: hov ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.02)",
        transform: hov ? "scale(1.01)" : "scale(1)",
        ...style,
      }}
      onMouseEnter={(e) => { setHov(true); if(onMouseEnter) onMouseEnter(e); }}
      onMouseLeave={(e) => { setHov(false); if(onMouseLeave) onMouseLeave(e); }}
    >
      {children}
    </div>
  );
}

// ─── STAT CARD (Zerion Style) ──────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent = false, trend }) {
  const [hovered, setHovered] = useState(false);
  return (
    <BentoCard style={{ padding: 0 }}>
      {/* Zerion-style ambient glow in the corner */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          background: accent 
            ? "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)" 
            : "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
          filter: "blur(20px)",
          transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
          transform: hovered ? "scale(1.5) translate(-10px, 10px)" : "scale(1)",
          pointerEvents: "none",
        }}
      />
      
      <div
        style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 2, height: "100%" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          {/* Polished Icon Container */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: accent
                ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))"
                : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
              border: accent 
                ? "1px solid rgba(245,166,35,0.2)" 
                : "1px solid rgba(255,255,255,0.05)",
              color: accent ? "var(--accent)" : "var(--text-secondary)",
              boxShadow: accent ? "0 4px 12px rgba(245,158,11,0.1)" : "0 4px 12px rgba(0,0,0,0.2)",
              transition: "all 0.4s ease",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
          >
            <Icon size={20} style={{ opacity: 0.9 }} />
          </div>
          
          {/* Trend Pill */}
          {trend !== undefined && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: trend >= 0 ? "var(--positive)" : "var(--negative)",
                backgroundColor: trend >= 0 ? "rgba(46,204,113,0.1)" : "rgba(231,76,60,0.1)",
                padding: "4px 8px",
                borderRadius: 100,
                display: "flex",
                alignItems: "center",
                gap: 4,
                border: trend >= 0 ? "1px solid rgba(46,204,113,0.15)" : "1px solid rgba(231,76,60,0.15)",
              }}
            >
              {trend >= 0 ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        
        {/* Text Content */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.02em" }}>
            {label}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              fontFamily: "Inter, sans-serif",
              color: accent ? "var(--text-primary)" : "var(--text-primary)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              textShadow: accent ? "0 0 24px rgba(245,166,35,0.2)" : "none",
            }}
          >
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, fontWeight: 500 }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  );
}

// ─── LAST UPDATED ────────────────────────────────────────────────
function LastUpdated({ marketData }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setSeconds(0);
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [marketData]);
  const label =
    seconds < 60
      ? `${seconds}s ago`
      : `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  return (
    <div
      className="flex items-center gap-1.5"
      style={{ color: "var(--text-muted)", fontSize: 12 }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "var(--accent)",
          boxShadow: "0 0 6px var(--accent)",
          animation: "pulse 2s infinite",
        }}
      />
      <Clock size={11} />
      <span>Updated {label}</span>
    </div>
  );
}

// ─── FEAR & GREED ────────────────────────────────────────────────
function FearGreedGauge({ coins }) {
  const [score, setScore] = useState(50);
  const [text, setText] = useState("Neutral");
  const [color, setColor] = useState("var(--accent)");
  const [bg, setBg] = useState("rgba(245,158,11,0.1)");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFnG() {
      try {
        const res = await fetch("https://api.alternative.me/fng/?limit=1");
        const json = await res.json();
        if (json && json.data && json.data.length > 0) {
          const val = parseInt(json.data[0].value, 10);
          setScore(val);
          if (val <= 20) { setText("Extreme Fear"); setColor("#e74c3c"); setBg("rgba(231,76,60,0.1)"); }
          else if (val <= 40) { setText("Fear"); setColor("#e67e22"); setBg("rgba(230,126,34,0.1)"); }
          else if (val <= 60) { setText("Neutral"); setColor("var(--accent)"); setBg("rgba(245,158,11,0.1)"); }
          else if (val <= 80) { setText("Greed"); setColor("#2ecc71"); setBg("rgba(46,204,113,0.1)"); }
          else { setText("Extreme Greed"); setColor("#27ae60"); setBg("rgba(39,174,96,0.1)"); }
        }
      } catch (err) {
        console.error("Failed to fetch Fear and Greed index", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFnG();
  }, []);

  const up = coins?.filter((c) => Number(c.price_change_percentage_24h) > 0).length || 0;
  const down = coins?.filter((c) => Number(c.price_change_percentage_24h) < 0).length || 0;
  const total = up + down || 1;

  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = isLoading ? circumference : circumference - (score / 100) * circumference;

  return (
    <BentoCard style={{ padding: 0, background: "linear-gradient(180deg, rgba(12,12,22,1) 0%, var(--bg-surface) 100%)", overflow: "hidden" }}>
      {/* Dynamic Background Glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 200,
          height: 100,
          background: `radial-gradient(ellipse, ${color}22, transparent 70%)`,
          filter: "blur(40px)",
          pointerEvents: "none",
          transition: "background 1s ease",
        }}
      />
      
      <div style={{ padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Market Sentiment
          </span>
          {!isLoading && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 100,
                backgroundColor: bg,
                color,
                border: `1px solid ${color}44`,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                boxShadow: `0 0 12px ${color}22`,
              }}
            >
              {text}
            </span>
          )}
        </div>

        {/* SVG Gauge */}
        <div style={{ position: "relative", width: "100%", maxWidth: 220, margin: "0 auto 20px" }}>
          <svg viewBox="0 0 200 115" style={{ width: "100%", overflow: "visible" }}>
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Colored Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={isLoading ? "rgba(255,255,255,0.1)" : color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 1.5s cubic-bezier(0.25, 1, 0.5, 1), stroke 1s ease",
                filter: `drop-shadow(0 0 8px ${color}66)`,
              }}
            />
          </svg>
          
          {/* Score Text in Center */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "monospace", color: isLoading ? "var(--text-muted)" : color, lineHeight: 1, letterSpacing: "-0.04em", textShadow: `0 0 20px ${color}44` }}>
              {isLoading ? "--" : score}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>/100</div>
          </div>
        </div>

        {/* Up/Down stats */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          <div style={{ flex: 1, backgroundColor: "rgba(46,204,113,0.06)", border: "1px solid rgba(46,204,113,0.1)", borderRadius: 16, padding: "12px 10px", textAlign: "center", transition: "all 0.3s ease" }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: "var(--positive)" }}>↑ {up}</div>
            <div style={{ fontSize: 11, color: "rgba(46,204,113,0.6)", marginTop: 4, fontWeight: 600 }}>Gaining</div>
          </div>
          <div style={{ flex: 1, backgroundColor: "rgba(231,76,60,0.06)", border: "1px solid rgba(231,76,60,0.1)", borderRadius: 16, padding: "12px 10px", textAlign: "center", transition: "all 0.3s ease" }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: "var(--negative)" }}>↓ {down}</div>
            <div style={{ fontSize: 11, color: "rgba(231,76,60,0.6)", marginTop: 4, fontWeight: 600 }}>Losing</div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

// ─── TRENDING MINI CARD ──────────────────────────────────────────
function TrendingCoinCard({ coin, navigate }) {
  const change = Number(coin.price_change_percentage_24h);
  const isPos = change >= 0;
  return (
    <div
      onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 16,
        cursor: "pointer",
        backgroundColor: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.03)",
        transition: "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
        position: "relative",
        overflow: "hidden",
        transform: "translateZ(0)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "scale(1.01)";
        const glow = e.currentTarget.querySelector('.feat-bg-glow');
        if (glow) { glow.style.transform = "translateY(-50%) scale(1.5)"; glow.style.opacity = "1"; }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.015)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.03)";
        e.currentTarget.style.transform = "scale(1)";
        const glow = e.currentTarget.querySelector('.feat-bg-glow');
        if (glow) { glow.style.transform = "translateY(-50%) scale(1)"; glow.style.opacity = "0"; }
      }}
    >
      <div className="feat-bg-glow" style={{
        position: "absolute", top: "50%", right: -20, width: 80, height: 80,
        borderRadius: "50%", background: `radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)`,
        filter: "blur(12px)", pointerEvents: "none", zIndex: 0,
        transform: "translateY(-50%) scale(1)", opacity: 0,
        transition: "all .4s cubic-bezier(0.25, 1, 0.5, 1)",
      }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      {coin.image_url ? (
        <img src={coin.image_url} alt={coin.symbol} style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", color: "var(--accent)", fontSize: 12, fontWeight: 700 }}>
          {coin.symbol?.slice(0, 1)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{coin.symbol?.toUpperCase()}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formatPrice(coin.current_price)}</div>
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "monospace",
          color: isPos ? "var(--positive)" : "var(--negative)",
          padding: "2px 7px",
          borderRadius: 6,
          backgroundColor: isPos ? "rgba(46,204,113,0.1)" : "rgba(231,76,60,0.1)",
        }}
      >
        {isPos ? "+" : ""}{change.toFixed(2)}%
      </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────
export default function Dashboard() {
  const market = useMarket(500);
  const gainers = useGainers(5);
  const losers = useLosers(5);
  const volume = useVolume(5);
  const trending = useTrending();
  const stats = useMarketStats();
  const navigate = useNavigate();

  const coins = market.data || [];
  const totalVolume = coins.reduce((s, c) => s + (Number(c.total_volume) || 0), 0) || 0;
  const allMarketCap = market.data?.reduce((s, c) => s + (Number(c.market_cap) || 0), 0) || 0;
  const btcData = market.data?.find((c) => c.symbol === "BTC");
  const ethData = market.data?.find((c) => c.symbol === "ETH");
  const btcDom = allMarketCap && btcData ? ((Number(btcData.market_cap) / allMarketCap) * 100).toFixed(1) : "—";
  const ethDom = allMarketCap && ethData ? ((Number(ethData.market_cap) / allMarketCap) * 100).toFixed(1) : "—";

  const top10 = market.data
    ? [...market.data]
        .filter((c) => Number(c.market_cap) > 0)
        .sort((a, b) => Number(b.market_cap) - Number(a.market_cap))
        .slice(0, 10)
    : [];

  return (
    <div style={{ color: "var(--text-primary)" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1.1 }}>
            Dashboard
          </h1>
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>Live data from</span>
            {[{ label: "Gate.io", href: "https://www.gate.io/" }, { label: "Bybit", href: "https://www.bybit.com/" }, { label: "OKX", href: "https://www.okx.com/" }].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ color: "rgba(245,166,35,0.7)", textDecoration: "none", fontWeight: 600, transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,166,35,0.7)")}
              >
                {s.label}
              </a>
            ))}
          </p>
        </div>
        <LastUpdated marketData={market.data} />
      </div>

      {/* ── BENTO GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4">
        {/* ── ROW 1: 4 Stat cards ── */}
        <div className="col-span-1 md:col-span-3 lg:col-span-3">
          <StatCard
            icon={DollarSign}
            label="Total 24h Volume"
            value={formatLargeNumber(totalVolume)}
            accent={true}
          />
        </div>
        <div className="col-span-1 md:col-span-3 lg:col-span-3">
          <StatCard
            icon={Activity}
            label="BTC Dominance"
            value={`${btcDom}%`}
            sub="by market cap"
          />
        </div>
        <div className="col-span-1 md:col-span-3 lg:col-span-3">
          <StatCard
            icon={TrendingUp}
            label="ETH Dominance"
            value={`${ethDom}%`}
            sub="by market cap"
          />
        </div>
        <div className="col-span-1 md:col-span-3 lg:col-span-3">
          <StatCard
            icon={Flame}
            label="Coins Tracked"
            value={`${stats.data?.coin_count || market.data?.length || 0}+`}
            sub="live data"
          />
        </div>

        {/* ── ROW 2: Trending (8) + Fear&Greed (4) — always full 12 cols ── */}
        <div className="col-span-1 md:col-span-6 lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trending */}
          <BentoCard className="lg:col-span-2" style={{ padding: "22px 24px", minHeight: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,158,11,0.05))", border: "1px solid rgba(245,166,35,0.2)" }}>
                <Flame size={13} style={{ color: "var(--accent)" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Trending Now
              </span>
            </div>
            {trending.isLoading || !trending.data || trending.data.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ height: 52, borderRadius: 12, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {trending.data.map((coin) => (
                  <TrendingCoinCard key={coin.symbol} coin={coin} navigate={navigate} />
                ))}
              </div>
            )}
          </BentoCard>

          {/* Fear & Greed */}
          {coins.length > 0 ? (
            <div className="lg:col-span-1">
              <FearGreedGauge coins={coins} />
            </div>
          ) : (
            <BentoCard className="lg:col-span-1" style={{ padding: "22px 24px", minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading…</div>
            </BentoCard>
          )}
        </div>

        {/* ── ROW 3: Top 10 Table (8) + Gainers/Losers stacked (4) ── */}
        <div className="col-span-1 md:col-span-6 lg:col-span-8">
          <BentoCard style={{ padding: "22px 24px", overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Activity size={13} style={{ color: "var(--text-muted)" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Top 10 by Market Cap
                </span>
              </div>
              <span
                onClick={() => navigate("/market")}
                style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer", fontWeight: 600, opacity: 0.7, transition: "opacity 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.7)}
              >
                View all →
              </span>
            </div>

            {(market.isLoading || (!market.isLoading && top10.length === 0)) && (
              <table className="w-full">
                <tbody>{Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}</tbody>
              </table>
            )}
            {top10.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["#", "Asset", "Price", "24h", "Market Cap"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          paddingBottom: 10,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          textAlign: i <= 1 ? "left" : "right",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {top10.map((coin, idx) => {
                    const change = Number(coin.price_change_percentage_24h);
                    const isPos = change >= 0;
                    return (
                      <tr
                        key={coin.symbol}
                        onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                        style={{ cursor: "pointer", transition: "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
                          e.currentTarget.style.transform = "scale(1.006) translateX(2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.transform = "scale(1) translateX(0)";
                        }}
                      >
                        <td style={{ padding: "11px 12px 11px 0", width: 28 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                            {idx + 1}
                          </span>
                        </td>
                        <td style={{ padding: "11px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {coin.image_url ? (
                              <img src={coin.image_url} alt={coin.symbol} style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-elevated)", color: "var(--accent)", fontSize: 10, fontWeight: 700 }}>
                                {coin.symbol?.slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{coin.symbol?.toUpperCase()}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{coin.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "11px 0", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                          {formatPrice(coin.current_price)}
                        </td>
                        <td style={{ padding: "11px 0", textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              fontFamily: "monospace",
                              color: isPos ? "var(--positive)" : "var(--negative)",
                              backgroundColor: isPos ? "rgba(46,204,113,0.08)" : "rgba(231,76,60,0.08)",
                              padding: "2px 7px",
                              borderRadius: 6,
                            }}
                          >
                            {isPos ? "+" : ""}{change.toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ padding: "11px 0 11px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>
                          {formatLargeNumber(coin.market_cap)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </BentoCard>
        </div>

        {/* Gainers + Losers stacked in right col */}
        <div className="col-span-1 md:col-span-6 lg:col-span-4" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CoinListCard
            title="Top Gainers (24h)"
            accent="orange"
            data={gainers.data}
            isLoading={gainers.isLoading}
            isError={gainers.isError}
            renderValue={(coin) => {
              const pct = Number(coin.price_change_percentage_24h);
              return <span style={{ color: "var(--positive)" }}>+{pct.toFixed(2)}%</span>;
            }}
          />
          <CoinListCard
            title="Top Losers (24h)"
            accent="red"
            data={losers.data}
            isLoading={losers.isLoading}
            isError={losers.isError}
            renderValue={(coin) => {
              const pct = Number(coin.price_change_percentage_24h);
              return <span style={{ color: "var(--negative)" }}>{pct.toFixed(2)}%</span>;
            }}
          />
          <CoinListCard
            title="Highest Volume (24h)"
            accent="blue"
            data={volume.data}
            isLoading={volume.isLoading}
            isError={volume.isError}
            renderValue={(coin) => (
              <span style={{ color: "var(--text-secondary)" }}>{formatLargeNumber(coin.total_volume)}</span>
            )}
          />
        </div>

        {/* ── ROW 4: Heatmap (12 cols) ── */}
        <div className="col-span-1 md:col-span-6 lg:col-span-12">
          <HeatmapWidget limit={50} />
        </div>

        {/* ── ROW 5: Volume Spike (6) + Market Oracle (6) ── */}
        <div className="col-span-1 md:col-span-6 lg:col-span-6">
          <VolumeSpikeRadar />
        </div>
        <div className="col-span-1 md:col-span-6 lg:col-span-6">
          <MarketOracle />
        </div>
      </div>
    </div>
  );
}
