import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMarket, useGainers, useLosers, useVolume, useTrending, useMarketStats } from "../hooks/useMarket";
import { getCoinColor } from "../utils/colors";
import CoinListCard from "../components/market/CoinListCard";
import VolumeSpikeRadar from "../components/market/VolumeSpikeRadar";
import MarketOracle from "../components/market/MarketOracle";
import HeatmapWidget from "../components/market/HeatmapWidget";
import Reveal from "../components/ui/Reveal";
import { TrendingUp, Activity, DollarSign, Flame, Clock, ArrowUpRight, ArrowDownRight, BarChart2, Bell, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

// ─── THEME TOKENS ────────────────────────────────────────────────
const T = {
  bg:           "var(--bg-base)",
  card:         "var(--bg-card)",
  cardHov:      "var(--bg-elevated)",
  purple:       "var(--accent)",
  purpleLight:  "var(--accent-hover)",
  green:        "#2dd4bf",
  greenBg:      "rgba(45,212,191,0.1)",
  greenBorder:  "rgba(45,212,191,0.2)",
  red:          "#f43f5e",
  redBg:        "rgba(244,63,94,0.1)",
  redBorder:    "rgba(244,63,94,0.2)",
  textPrimary:  "var(--text-primary)",
  textSecondary:"var(--text-secondary)",
  textMuted:    "var(--text-muted)",
  border:       "var(--border)",
  borderFeat:   "var(--accent-border)",
};

function formatLargeNumber(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(0)}`;
}

function formatPrice(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(4)}`;
  if (num >= 0.0001) return `$${num.toFixed(6)}`;
  return `<$0.000001`;
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
    <div
      onClick={onClick}
      style={{
        background: T.card,
        border: `1px solid ${hov ? (featured ? "rgba(0,240,255,0.3)" : "rgba(255,255,255,0.08)") : (featured ? "rgba(0,240,255,0.15)" : "transparent")}`,
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
        transition: "all 200ms ease",
        cursor: onClick ? "pointer" : "default",
        ...(featured && {
          background: "rgba(0,240,255,0.04)",
          boxShadow: "none",
        }),
        ...(hov && !featured && { background: T.cardHov }),
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </div>
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
function HeroStat({ label, value, sub, color = T.purple }) {
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
        background: `radial-gradient(circle, ${featured ? "rgba(0,240,255,0.15)" : color + "15"} 0%, transparent 60%)`,
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
                background: `${featured ? "rgba(0,240,255,0.15)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: featured ? T.purple : T.textMuted,
              }}>
                {coin.symbol?.slice(0, 1)}
              </div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: getCoinColor(coin.symbol), textShadow: `0 0 10px ${getCoinColor(coin.symbol)}40` }}>{coin.symbol?.toUpperCase()}</div>
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
            {isPos ? "+" : ""}{change.toFixed(2)}%
          </div>
        </div>

        {/* Price + sparkline */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em", fontFamily: "monospace" }}>
              {formatPrice(coin.current_price)}
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

// ─── FEAR & GREED ────────────────────────────────────────────────
function FearGreedGauge({ coins }) {
  const { t } = useTranslation();
  const [score, setScore] = useState(50);
  const [text, setText] = useState(t('dashboard.neutral'));
  const [color, setColor] = useState(T.purple);

  useEffect(() => {
    if (!coins || coins.length === 0) return;
    const up = coins.filter(c => Number(c.price_change_percentage_24h) > 0).length;
    const total = coins.length || 1;
    const btc = coins.find(c => c.symbol.toLowerCase() === "btc");
    const btcChange = btc ? Number(btc.price_change_percentage_24h) : 0;
    const val = Math.max(0, Math.min(100, Math.round((up / total) * 100 + btcChange * 4)));
    setScore(val);
    if (val <= 20) { setText(t('dashboard.extreme_fear')); setColor(T.red); }
    else if (val <= 40) { setText(t('dashboard.fear')); setColor("#f97316"); }
    else if (val <= 60) { setText(t('dashboard.neutral')); setColor(T.purple); }
    else if (val <= 80) { setText(t('dashboard.greed')); setColor(T.green); }
    else { setText(t('dashboard.extreme_greed')); setColor("#10b981"); }
  }, [coins, t]);

  const up = coins?.filter(c => Number(c.price_change_percentage_24h) > 0).length || 0;
  const down = coins?.filter(c => Number(c.price_change_percentage_24h) < 0).length || 0;
  const radius = 68;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <Card style={{ padding: "24px" }}>
      <SectionLabel>{t('dashboard.sentiment')}</SectionLabel>

      {/* Gauge */}
      <div style={{ position: "relative", width: 180, margin: "0 auto 20px" }}>
        <svg viewBox="0 0 160 95" style={{ width: "100%", overflow: "visible" }}>
          <path d="M 14 80 A 68 68 0 0 1 146 80" fill="none" stroke={T.border} strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 14 80 A 68 68 0 0 1 146 80"
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.25,1,0.5,1), stroke 0.8s ease", filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ fontSize: 40, fontWeight: 900, color, letterSpacing: "-0.04em", fontFamily: "monospace", textShadow: `0 0 20px ${color}66` }}>
            {score}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>/ 100 · {text}</div>
        </div>
      </div>

      {/* Up / Down pills */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, padding: "10px", borderRadius: 12, background: T.greenBg, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.green, fontFamily: "monospace" }}>↑ {up}</div>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t('dashboard.gaining')}</div>
        </div>
        <div style={{ flex: 1, padding: "10px", borderRadius: 12, background: T.redBg, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.red, fontFamily: "monospace" }}>↓ {down}</div>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t('dashboard.losing')}</div>
        </div>
      </div>
    </Card>
  );
}

// ─── ALERTS WIDGET ───────────────────────────────────────────────
function AlertsWidget() {
  const { t } = useTranslation();
  const alerts = [
    { dot: T.purple, msg: "BTC crossed $100K threshold", time: `2${t('dashboard.minutes_ago')} ${t('dashboard.seconds_ago')}`.replace('s ago', 'ago') },
    { dot: T.green, msg: "ETH whale wallet moved 12,400 ETH", time: `8${t('dashboard.minutes_ago')} ${t('dashboard.seconds_ago')}`.replace('s ago', 'ago') },
    { dot: "#f59e0b", msg: "SOL volume spike detected (+340%)", time: `15${t('dashboard.minutes_ago')} ${t('dashboard.seconds_ago')}`.replace('s ago', 'ago') },
    { dot: T.red, msg: "DOGE dropped below $0.15 support", time: `22${t('dashboard.minutes_ago')} ${t('dashboard.seconds_ago')}`.replace('s ago', 'ago') },
    { dot: T.purple, msg: "New listing: MOG/USDT on Gate.io", time: `1h ${t('dashboard.seconds_ago')}`.replace('s ago', 'ago') },
  ];
  return (
    <Card style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <SectionLabel>{t('dashboard.smart_alerts')}</SectionLabel>
        <span style={{ fontSize: 10, color: T.purple, fontWeight: 700, cursor: "pointer" }}>{t('dashboard.view_all')}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {alerts.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0",
              borderBottom: i < alerts.length - 1 ? `1px solid ${T.border}` : "none",
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.dot, boxShadow: `0 0 6px ${a.dot}`, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: T.textSecondary, lineHeight: 1.4 }}>{a.msg}</div>
            <div style={{ fontSize: 11, color: T.textMuted, flexShrink: 0, fontFamily: "monospace" }}>{a.time}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

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
    <div style={{ color: T.textPrimary, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes dash-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.purple, marginBottom: 8 }}>
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
                  style={{ fontSize: 11, color: T.purple, cursor: "pointer", fontWeight: 700, opacity: 0.8, transition: "opacity 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "0.8"}
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
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,240,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.purple }}>
                                  {coin.symbol?.slice(0, 1)}
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: getCoinColor(coin.symbol), textShadow: `0 0 10px ${getCoinColor(coin.symbol)}40` }}>{coin.symbol?.toUpperCase()}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{coin.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 0", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: T.textPrimary, fontWeight: 600 }}>
                            {formatPrice(coin.current_price)}
                          </td>
                          <td style={{ padding: "16px 0", textAlign: "right" }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                              color: isPos ? T.green : T.red,
                              background: isPos ? "rgba(52, 211, 153, 0.08)" : "rgba(239, 68, 68, 0.08)",
                              padding: "3px 8px", borderRadius: 8,
                            }}>
                              {isPos ? "+" : ""}{change.toFixed(2)}%
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

          {/* Heatmap */}
          <Reveal delay={0.2}>
            <HeatmapWidget limit={50} />
          </Reveal>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Fear & Greed */}
          <Reveal delay={0.1}>
            {coins.length > 0 ? <FearGreedGauge coins={coins} /> : (
              <Card style={{ padding: "24px", height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 12, color: T.textMuted }}>{t('dashboard.loading_sentiment')}</div>
              </Card>
            )}
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
                return <span style={{ color: T.green }}>+{pct.toFixed(2)}%</span>;
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
                return <span style={{ color: T.red }}>{pct.toFixed(2)}%</span>;
              }}
            />
          </Reveal>

          {/* Smart Alerts */}
          <Reveal delay={0.25}>
            <AlertsWidget />
          </Reveal>

          {/* Volume Spike */}
          <Reveal delay={0.3}>
            <VolumeSpikeRadar />
          </Reveal>

          {/* Market Oracle */}
          <Reveal delay={0.35}>
            <MarketOracle />
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
            onMouseEnter={e => { e.currentTarget.style.color = T.purple; }}
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
