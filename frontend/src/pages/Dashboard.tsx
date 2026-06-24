import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMarket, useGainers, useLosers, useVolume, useTrending, useMarketStats } from "../hooks/useMarket";
import { getCoinColor } from "../utils/colors";
import CoinListCard from "../components/market/CoinListCard";
import VolumeSpikeRadar from "../components/market/VolumeSpikeRadar";
import SentimentSpeedometer from "../components/market/SentimentSpeedometer";
import Reveal from "../components/ui/Reveal";
import { TrendingUp, Activity, DollarSign, Flame, Clock, ArrowUpRight, ArrowDownRight, BarChart2, Bell, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import PriceCell from "../components/ui/PriceCell";

// ─── THEME TOKENS ────────────────────────────────────────────────
const T = {
  bg:           "#000",
  card:         "rgba(10,10,10,0.5)",
  cardHov:      "rgba(20,20,20,0.8)",
  purple:       "#fff",
  purpleLight:  "#eee",
  green:        "#10b981",
  greenBg:      "rgba(16,185,129,0.1)",
  greenBorder:  "rgba(16,185,129,0.2)",
  red:          "#ef4444",
  redBg:        "rgba(239,68,68,0.1)",
  redBorder:    "rgba(239,68,68,0.2)",
  textPrimary:  "#fff",
  textSecondary:"rgba(255,255,255,0.7)",
  textMuted:    "rgba(255,255,255,0.5)",
  border:       "rgba(255,255,255,0.05)",
  borderFeat:   "rgba(255,255,255,0.15)",
};

function formatLargeNumber(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(0)}`;
}



// ─── SPARKLINE ───────────────────────────────────────────────────
function Sparkline({ data, color, width = 80, height = 32 }) {
  if (!data || data.length < 2) {
    // Fake data for demo
    data = Array.from({ length: 12 }, (_, i) => 50 + Math.sin(i * 0.8) * 20 + Math.random() * 10);
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── CARD BASE ───────────────────────────────────────────────────
function Card({ children, style = {}, featured = false, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      whileHover={{ y: onClick ? -2 : 0 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      style={{
        background: featured ? "rgba(15,15,15,0.9)" : T.card,
        border: `1px solid ${hov ? (featured ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)") : (featured ? "rgba(255,255,255,0.1)" : T.border)}`,
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
        transition: "border 200ms ease, background 200ms ease",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "none",
        ...(hov && !featured && { background: T.cardHov }),
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </motion.div>
  );
}

// ─── SECTION LABEL ───────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", color: T.textMuted, marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

// ─── STAT ROW ────────────────────────────────────────────────────
function HeroStat({ label, value, sub }) {
  return (
    <div style={{
      flex: 1, padding: "20px 24px",
      borderRight: `1px solid ${T.border}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

// ─── COIN CARD (2x2) ─────────────────────────────────────────────
function CoinCard({ coin, navigate, featured = false }) {
  const change = Number(coin.price_change_percentage_24h);
  const isPos = change >= 0;
  const color = isPos ? T.green : T.red;
  const bg = isPos ? T.greenBg : T.redBg;
  const border = isPos ? T.greenBorder : T.redBorder;

  // Generate fake sparkline from price change direction
  const fakeSparkline = Array.from({ length: 16 }, (_, i) => {
    const trend = isPos ? i * 2 : (16 - i) * 2;
    return 40 + trend + Math.sin(i * 1.2) * 8;
  });

  return (
    <Card
      featured={featured}
      onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
      style={{ padding: "20px 22px" }}
    >
      {/* Corner glow */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 120, height: 120, borderRadius: "50%",
        background: `radial-gradient(circle, ${featured ? "rgba(255,255,255,0.08)" : color + "15"} 0%, transparent 60%)`,
        filter: "blur(20px)", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {coin.image_url ? (
              <img src={coin.image_url} alt={coin.symbol} style={{ width: 36, height: 36, borderRadius: "50%" }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `${featured ? "#fff" : T.cardHov}`,
                border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: featured ? "#000" : T.textMuted,
              }}>
                {coin.symbol?.slice(0, 1)}
              </div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: getCoinColor(coin.symbol), textShadow: "none" }}>{coin.symbol?.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{coin.name}</div>
            </div>
          </div>
          {/* 24h pill */}
          <div style={{
            fontSize: 12, fontWeight: 700, padding: "4px 10px",
            borderRadius: 100, color, background: bg,
            border: `1px solid ${border}`,
            fontFamily: "monospace",
          }}>
            {isPos ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
          </div>
        </div>

        {/* Price + sparkline */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em", fontFamily: "monospace" }}>
              <PriceCell price={coin.current_price} />
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
              MCap: {formatLargeNumber(coin.market_cap)}
            </div>
          </div>
          <Sparkline data={fakeSparkline} color={color} width={80} height={36} />
        </div>
      </div>
    </Card>
  );
}

// AlertsWidget removed

// ─── LAST UPDATED ────────────────────────────────────────────────
function LastUpdated({ marketData }) {
  const { t } = useTranslation();
  const [sec, setSec] = useState(0);
  useEffect(() => {
    setSec(0);
    const iv = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [marketData]);
  const label = sec < 60 ? `${sec}${t('dashboard.seconds_ago')}` : `${Math.floor(sec / 60)}${t('dashboard.minutes_ago')} ${sec % 60}${t('dashboard.seconds_ago')}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textMuted }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, boxShadow: `0 0 6px ${T.green}`, animation: "dash-pulse 2s infinite" }} />
      <Clock size={11} />
      <span>{t('dashboard.updated')} {label}</span>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useTranslation();
  const market = useMarket(500);
  const gainers = useGainers(5);
  const losers = useLosers(5);
  const volume = useVolume(5);
  const trending = useTrending();
  const stats = useMarketStats();
  const navigate = useNavigate();

  const coins = market.data || [];
  const totalVolume = coins.reduce((s, c) => s + (Number(c.total_volume) || 0), 0);
  const allMCap = coins.reduce((s, c) => s + (Number(c.market_cap) || 0), 0);
  const btcData = coins.find(c => c.symbol === "BTC");
  const ethData = coins.find(c => c.symbol === "ETH");
  const btcDom = allMCap && btcData ? ((Number(btcData.market_cap) / allMCap) * 100).toFixed(1) : "—";
  const ethDom = allMCap && ethData ? ((Number(ethData.market_cap) / allMCap) * 100).toFixed(1) : "—";

  const top10 = coins.length > 0
    ? [...coins].filter(c => Number(c.market_cap) > 0).sort((a, b) => Number(b.market_cap) - Number(a.market_cap)).slice(0, 10)
    : [];

  // Top 4 coins for the 2×2 grid
  const top4 = top10.slice(0, 4);

  return (
    <div style={{ 
      background: "#000",
      backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
      minHeight: "100vh", 
      color: T.textPrimary, 
      fontFamily: "Inter, sans-serif" 
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes dash-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", opacity: 0.6, marginBottom: 8 }}>
            {t('dashboard.live_badge')}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: T.textPrimary, lineHeight: 1.1, margin: 0 }}>
            {t('dashboard.title')}
          </h1>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>
            {t('dashboard.subtitle')}
          </p>
        </div>
        <LastUpdated marketData={market.data} />
      </div>

      {/* ── HERO STAT STRIP ── */}
      <Reveal delay={0.05}>
        <Card style={{ marginBottom: 28, padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <HeroStat label={t('dashboard.total_mcap')} value={formatLargeNumber(allMCap)} sub={t('dashboard.assets_tracked', { count: coins.length })} />
            <HeroStat label={t('dashboard.vol_24h')} value={formatLargeNumber(totalVolume)} sub={t('dashboard.across_pairs')} />
            <HeroStat label={t('dashboard.btc_dom')} value={`${btcDom}%`} sub={t('dashboard.of_total')} />
            <HeroStat label={t('dashboard.eth_dom')} value={`${ethDom}%`} sub={t('dashboard.of_total')} />
            <div style={{ flex: 1, padding: "20px 24px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted, marginBottom: 10 }}>
                {t('dashboard.coins_tracked')}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.purple, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {stats.data?.coin_count || coins.length || 0}+
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>{t('dashboard.live_data')}</div>
            </div>
          </div>
        </Card>
      </Reveal>

      {/* ── MAIN GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 380px", gap: 20 }}>

        {/* ── LEFT + CENTER: 2×2 Coin Cards ── */}
        <div style={{ gridColumn: "1 / 3", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 2×2 Coin Grid */}
          <Reveal delay={0.1}>
            <div>
              <SectionLabel>{t('dashboard.featured')}</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {top4.length > 0 ? top4.map((coin, i) => (
                  <CoinCard key={coin.symbol} coin={coin} navigate={navigate} featured={i === 0} />
                )) : Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 140, borderRadius: 20, background: T.card, border: `1px solid ${T.border}`, animation: "dash-pulse 1.5s infinite" }} />
                ))}
              </div>
            </div>
          </Reveal>

          {/* Top 10 Table */}
          <Reveal delay={0.15}>
            <Card style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <SectionLabel>{t('dashboard.top10')}</SectionLabel>
                <span
                  onClick={() => navigate("/market")}
                  style={{ fontSize: 11, color: "#fff", cursor: "pointer", fontWeight: 700, opacity: 0.5, transition: "opacity 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
                >
                  {t('dashboard.view_all')}
                </span>
              </div>

              {top10.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ height: 44, borderRadius: 12, background: T.card, animation: "dash-pulse 1.5s infinite" }} />
                  ))}
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {[t('dashboard.table.rank'), t('dashboard.table.asset'), t('dashboard.table.price'), t('dashboard.table.change'), t('dashboard.table.mcap')].map((h, i) => (
                        <th key={h} style={{
                          paddingBottom: 12, fontSize: 10, fontWeight: 700, color: T.textMuted,
                          textTransform: "uppercase", letterSpacing: "0.08em",
                          textAlign: i <= 1 ? "left" : "right",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                        }}>
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
                          className="table-row-hover"
                          onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                          style={{ cursor: "pointer", transition: "all 180ms ease", borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.cardHov; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "16px 12px 16px 0", width: 28 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, fontFamily: "monospace" }}>{idx + 1}</span>
                          </td>
                          <td style={{ padding: "16px 0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {coin.image_url ? (
                                <img src={coin.image_url} alt={coin.symbol} style={{ width: 28, height: 28, borderRadius: "50%" }} />
                              ) : (
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fff", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#000" }}>
                                  {coin.symbol?.slice(0, 1)}
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: getCoinColor(coin.symbol), textShadow: "none" }}>{coin.symbol?.toUpperCase()}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{coin.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 0", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: T.textPrimary, fontWeight: 600 }}>
                            <PriceCell price={coin.current_price} />
                          </td>
                          <td style={{ padding: "16px 0", textAlign: "right" }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                              color: isPos ? T.green : T.red,
                              background: isPos ? "rgba(52, 211, 153, 0.08)" : "rgba(239, 68, 68, 0.08)",
                              padding: "3px 8px", borderRadius: 8,
                            }}>
                              {isPos ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                            </span>
                          </td>
                          <td style={{ padding: "12px 0 12px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: T.textMuted }}>
                            {formatLargeNumber(coin.market_cap)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          </Reveal>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* AI Sentiment Speedometer */}
          <Reveal delay={0.1}>
            <SentimentSpeedometer />
          </Reveal>

          {/* Gainers */}
          <Reveal delay={0.15}>
            <CoinListCard
              title={t('dashboard.top_gainers')}
              accent="green"
              data={gainers.data}
              isLoading={gainers.isLoading}
              isError={gainers.isError}
              renderValue={(coin) => {
                const pct = Number(coin.price_change_percentage_24h);
                return <span style={{ color: T.green }}>▲ {pct.toFixed(2)}%</span>;
              }}
            />
          </Reveal>

          {/* Losers */}
          <Reveal delay={0.2}>
            <CoinListCard
              title={t('dashboard.top_losers')}
              accent="red"
              data={losers.data}
              isLoading={losers.isLoading}
              isError={losers.isError}
              renderValue={(coin) => {
                const pct = Number(coin.price_change_percentage_24h);
                return <span style={{ color: T.red }}>▼ {Math.abs(pct).toFixed(2)}%</span>;
              }}
            />
          </Reveal>

          {/* Volume Spike */}
          <Reveal delay={0.25}>
            <VolumeSpikeRadar />
          </Reveal>
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(24px)",
        borderTop: `1px solid ${T.border}`,
        display: "none",
        zIndex: 200,
      }} className="bottom-nav">
        {[
          { icon: BarChart2, label: t('dashboard.bottom_nav.markets'), path: "/market" },
          { icon: DollarSign, label: t('dashboard.bottom_nav.portfolio'), path: "/portfolio" },
          { icon: Bell, label: t('dashboard.bottom_nav.alerts'), path: "/alerts" },
          { icon: Zap, label: t('dashboard.bottom_nav.settings'), path: "/settings" },
        ].map(({ icon: Icon, label, path }) => (
          <div
            key={label}
            onClick={() => navigate(path)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 4, padding: "12px 0",
              cursor: "pointer", color: T.textMuted, transition: "color 150ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; }}
          >
            <Icon size={20} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

