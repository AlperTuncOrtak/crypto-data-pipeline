// ============================================================
// pages/Dashboard.tsx — Trading Desk v4
// "30 saniyede piyasayı anla" felsefesiyle tasarlandı.
// ============================================================
import { useState, useEffect, useRef } from "react";
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
  Bell, ArrowRight, Flame, BarChart2, Clock,
} from "lucide-react";

// ─── HELPERS ─────────────────────────────────────────────────
function fmt(n: number) {
  if (!n || isNaN(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

// --- REMOVED GLASS CONSTANT ---
// We will use className="card-clean" instead for a modern minimalist look.

// ─── SPARKLINE ───────────────────────────────────────────────
function MiniChart({ points, up, width = 120, height = 44 }: {
  points: number[]; up: boolean; width?: number; height?: number;
}) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pts = points
    .map((v, i) => `${(i / (points.length - 1)) * width},${height - ((v - min) / range) * height}`)
    .join(" ");
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <svg width={width} height={height} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={`sg-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#sg-${up})`}
        stroke="none"
      />
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

// ─── FEAR & GREED DIAL ───────────────────────────────────────
function FearGreedDial({ value }: { value: number }) {
  const clamp = Math.min(100, Math.max(0, value));
  // angle: 0 = left (-135deg), 100 = right (+135deg)
  const angle = -135 + (clamp / 100) * 270;
  const color =
    clamp <= 25  ? "#ef4444" :
    clamp <= 45  ? "#f97316" :
    clamp <= 55  ? "#eab308" :
    clamp <= 75  ? "#22c55e" :
                   "#10b981";
  const label =
    clamp <= 25  ? "Extreme Fear" :
    clamp <= 45  ? "Fear" :
    clamp <= 55  ? "Neutral" :
    clamp <= 75  ? "Greed" :
                   "Extreme Greed";

  const r = 54;
  const cx = 70, cy = 70;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  // Arc path from -135° to angle
  const startX = cx + r * Math.cos(toRad(-135));
  const startY = cy + r * Math.sin(toRad(-135));
  const endX   = cx + r * Math.cos(toRad(angle));
  const endY   = cy + r * Math.sin(toRad(angle));
  const large  = angle - (-135) > 180 ? 1 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={140} height={90} viewBox="0 0 140 90">
        {/* Track */}
        <path
          d={`M ${cx + r * Math.cos(toRad(-135))} ${cy + r * Math.sin(toRad(-135))} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(toRad(135))} ${cy + r * Math.sin(toRad(135))}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Fill arc */}
        {clamp > 0 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
        {/* Needle dot */}
        <circle cx={endX} cy={endY} r="5" fill={color} />
        {/* Value */}
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800" fontFamily="monospace">
          {clamp}
        </text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

// ─── COIN ROW ────────────────────────────────────────────────
function CoinRow({ coin, rank, onClick }: { coin: any; rank: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const chg = Number(coin.price_change_percentage_24h);
  const up  = chg >= 0;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "24px 36px 1fr auto auto",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderRadius: 12,
        background: hov ? "rgba(255,255,255,0.04)" : "transparent",
        cursor: "pointer",
        transition: "background 150ms ease",
      }}
    >
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", textAlign: "right" }}>{rank}</span>
      {coin.image_url
        ? <img src={coin.image_url} alt={coin.symbol} style={{ width: 28, height: 28, borderRadius: "50%" }} />
        : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>{coin.symbol?.[0]}</div>
      }
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{coin.symbol?.toUpperCase()}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{coin.name}</div>
      </div>
      <PriceCell price={coin.current_price} />
      <div style={{
        fontSize: 12, fontWeight: 700, fontFamily: "monospace",
        color: up ? "#22c55e" : "#ef4444",
        background: up ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
        padding: "3px 8px", borderRadius: 6, textAlign: "right",
        minWidth: 64,
      }}>
        {up ? "+" : ""}{chg.toFixed(2)}%
      </div>
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────
function SectionHeader({ icon: Icon, title, action, onAction }: {
  icon: any; title: string; action?: string; onAction?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={13} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
          {title}
        </span>
      </div>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)",
            transition: "all 150ms ease",
            padding: "4px 8px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          {action} <ArrowRight size={10} />
        </button>
      )}
    </div>
  );
}

// ─── LIVE BADGE ──────────────────────────────────────────────
function LiveBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "blink 2s infinite" }} />
      <Clock size={10} />
      <span>Live</span>
    </div>
  );
}

// ─── GLOW CARD (Raycast-style hover border glow) ──────────────
function GlowCard({ children, style = {}, onClick, glowColor = "94,106,210" }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  glowColor?: string;
}) {
  const [hov, setHov] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseMove={handleMouseMove}
      className="card-clean"
      style={{
        position: "relative",
        border: `1px solid ${hov ? `rgba(${glowColor},0.2)` : "rgba(255,255,255,0.05)"}`,
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Spotlight inside card */}
      {hov && (
        <div
          style={{
            position: "absolute",
            top: pos.y - 120,
            left: pos.x - 120,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${glowColor},0.12) 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 0,
            transition: "opacity 200ms ease",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const revealRef = useScrollReveal();
  const canvasRef = useRef<HTMLDivElement>(null);
  const spotRef   = useRef<HTMLDivElement>(null);

  // Cursor-following spotlight
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!canvasRef.current || !spotRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spotRef.current.style.left = `${x - 300}px`;
      spotRef.current.style.top  = `${y - 300}px`;
      spotRef.current.style.opacity = "1";
    };
    const hide = () => { if (spotRef.current) spotRef.current.style.opacity = "0"; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", hide);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseleave", hide); };
  }, []);

  const { data: marketData } = useMarket(500);
  const { data: gainersData } = useGainers(5);
  const { data: losersData }  = useLosers(5);
  const { data: statsData }   = useMarketStats();
  const { data: trendingData } = useTrending();
  const { data: alertsData }  = useAlerts();
  const { data: fng }         = useFearAndGreed();
  const { data: sparklines }  = useSparklines(["BTC", "ETH"], 48);

  const coins = marketData || [];
  const totalMcap   = coins.reduce((s, c) => s + (Number(c.market_cap) || 0), 0);
  const totalVolume = coins.reduce((s, c) => s + (Number(c.total_volume) || 0), 0);
  const btcCoin = coins.find(c => c.symbol === "BTC");
  const ethCoin = coins.find(c => c.symbol === "ETH");
  const btcDom = totalMcap && btcCoin ? ((Number(btcCoin.market_cap) / totalMcap) * 100).toFixed(1) : "—";

  const top10 = [...coins]
    .filter(c => Number(c.market_cap) > 0)
    .sort((a, b) => Number(b.market_cap) - Number(a.market_cap))
    .slice(0, 10);

  const btcPoints = (sparklines?.["BTC"] || []).map((p: any) => Number(p.price));
  const ethPoints = (sparklines?.["ETH"] || []).map((p: any) => Number(p.price));
  const btcUp = btcPoints.length > 1 ? btcPoints[btcPoints.length - 1] >= btcPoints[0] : true;
  const ethUp = ethPoints.length > 1 ? ethPoints[ethPoints.length - 1] >= ethPoints[0] : true;

  const fngValue = fng ? parseInt(fng.value) : null;
  const recentAlerts = (alertsData || []).slice(0, 4);

  return (
    <div ref={canvasRef} style={{ position: "relative", color: "var(--text-primary)", overflow: "hidden" }}>
      {/* ── CSS KEYFRAMES ── */}
      <style>{`
        @keyframes aurora-a { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(60px,-40px) scale(1.12);} }
        @keyframes aurora-b { 0%,100%{transform:translate(0,0) scale(1.05);} 50%{transform:translate(-50px,50px) scale(0.92);} }
        @keyframes dash-grad { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      `}</style>

      {/* ─── AURORA BACKGROUND (Minimalist) ─── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
        }} />
      </div>

      {/* ── CURSOR SPOTLIGHT ── */}
      <div
        ref={spotRef}
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(94,106,210,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0,
          transition: "opacity 400ms ease",
          filter: "blur(8px)",
        }}
      />

      {/* ── ALL CONTENT (above aurora) ── */}
      <div ref={revealRef} style={{ position: "relative", zIndex: 1 }}>

      {/* ── HEADER ── */}
      <div className="reveal" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, letterSpacing: "-0.04em", margin: 0,
            background: "linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.4) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            Piyasa özetini 30 saniyede kavra.
          </p>
        </div>
        <LiveBadge />
      </div>

      {/* ─── MACRO STRIP ─── */}
      <div
        className="reveal card-clean"
        style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 24, overflow: "hidden", '--reveal-delay': '60ms' } as any}
      >
        {[
          { label: "BTC", value: btcCoin ? <PriceCell price={btcCoin.current_price} /> : "—", sub: `${btcCoin ? (Number(btcCoin.price_change_percentage_24h) >= 0 ? "+" : "") + Number(btcCoin.price_change_percentage_24h).toFixed(2) + "%" : ""}`, subColor: btcCoin && Number(btcCoin.price_change_percentage_24h) >= 0 ? "#22c55e" : "#ef4444" },
          { label: "ETH", value: ethCoin ? <PriceCell price={ethCoin.current_price} /> : "—", sub: `${ethCoin ? (Number(ethCoin.price_change_percentage_24h) >= 0 ? "+" : "") + Number(ethCoin.price_change_percentage_24h).toFixed(2) + "%" : ""}`, subColor: ethCoin && Number(ethCoin.price_change_percentage_24h) >= 0 ? "#22c55e" : "#ef4444" },
          { label: "Market Cap", value: fmt(totalMcap), sub: `${coins.length}+ asset` },
          { label: "BTC Dominance", value: `${btcDom}%`, sub: "of total market" },
          { label: "24h Volume", value: fmt(totalVolume), sub: "global" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              padding: "20px 24px",
              borderRight: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", fontFamily: "monospace" }}>
              {item.value}
            </div>
            {item.sub && (
              <div style={{ fontSize: 11, fontWeight: 600, color: (item as any).subColor || "rgba(255,255,255,0.35)", marginTop: 4, fontFamily: "monospace" }}>
                {item.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── ROW 2: BTC chart | ETH chart | Fear & Greed ── */}
      <div
        className="reveal"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20, '--reveal-delay': '120ms' } as any}
      >
        {/* BTC Mini Chart */}
        {[
          { coin: btcCoin, points: btcPoints, up: btcUp, sym: "BTC" },
          { coin: ethCoin, points: ethPoints, up: ethUp, sym: "ETH" },
        ].map(({ coin, points, up, sym }) => (
          <GlowCard
            key={sym}
            onClick={() => navigate(`/coin/${sym === "BTC" ? "bitcoin" : "ethereum"}`)}
            glowColor={up ? "34,197,94" : "239,68,68"}
            style={{ padding: "20px 24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {coin?.image_url && <img src={coin.image_url} alt={sym} style={{ width: 20, height: 20, borderRadius: "50%" }} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{sym}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "monospace", color: "#fff", letterSpacing: "-0.02em" }}>
                  {coin ? <PriceCell price={coin.current_price} /> : "—"}
                </div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                color: up ? "#22c55e" : "#ef4444",
                background: up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                padding: "4px 10px", borderRadius: 8,
              }}>
                {coin && (Number(coin.price_change_percentage_24h) >= 0 ? "+" : "")}{coin ? Number(coin.price_change_percentage_24h).toFixed(2) : "0"}%
              </span>
            </div>
            <MiniChart points={points} up={up} width={180} height={48} />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 8, letterSpacing: "0.06em" }}>
              48h CHART
            </div>
          </GlowCard>
        ))}

        {/* Fear & Greed */}
        <div className="card-clean" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
            FEAR & GREED INDEX
          </div>
          {fngValue !== null
            ? <FearGreedDial value={fngValue} />
            : <div style={{ fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.2)" }}>—</div>
          }
          {fng && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 2, lineHeight: 1.5 }}>
              Updated daily
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Top 10 Table | Gainers/Losers | Alerts ── */}
      <div
        className="reveal"
        style={{ display: "grid", gridTemplateColumns: "1fr 280px 280px", gap: 16, marginBottom: 20, alignItems: "start", '--reveal-delay': '180ms' } as any}
      >
        {/* Top 10 */}
        <div className="card-clean" style={{ padding: "20px 8px" }}>
          <div style={{ padding: "0 8px" }}>
            <SectionHeader icon={BarChart2} title="Top 10" action="Tümü" onAction={() => navigate("/market")} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {top10.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ height: 44, margin: "2px 8px", borderRadius: 10, background: "rgba(255,255,255,0.03)", animation: "blink 1.5s infinite" }} />
                ))
              : top10.map((coin, i) => (
                  <CoinRow
                    key={coin.symbol}
                    coin={coin}
                    rank={i + 1}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                  />
                ))
            }
          </div>
        </div>

        {/* Gainers & Losers stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Gainers */}
          <div className="card-clean" style={{ padding: "24px" }}>
            <SectionHeader icon={TrendingUp} title="Top Gainers" action="Market" onAction={() => navigate("/market?sort=gain")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(gainersData || []).slice(0, 5).map((coin: any) => (
                <div
                  key={coin.symbol}
                  onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 22, height: 22, borderRadius: "50%" }} />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{coin.symbol?.toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", fontFamily: "monospace" }}>
                    +{Number(coin.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </div>
              ))}
              {(!gainersData || gainersData.length === 0) && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "16px 0" }}>Yükleniyor…</div>
              )}
            </div>
          </div>

          {/* Losers */}
          <div className="card-clean" style={{ padding: "24px" }}>
            <SectionHeader icon={TrendingDown} title="Top Losers" action="Market" onAction={() => navigate("/market?sort=loss")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(losersData || []).slice(0, 5).map((coin: any) => (
                <div
                  key={coin.symbol}
                  onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 22, height: 22, borderRadius: "50%" }} />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{coin.symbol?.toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", fontFamily: "monospace" }}>
                    {Number(coin.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </div>
              ))}
              {(!losersData || losersData.length === 0) && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "16px 0" }}>Yükleniyor…</div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts + Trending stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Recent Alerts */}
          <div className="card-clean" style={{ padding: "24px" }}>
            <SectionHeader icon={Bell} title="Son Uyarılar" action="Tümü" onAction={() => navigate("/alerts")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentAlerts.length === 0 && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "16px 0" }}>
                  Aktif uyarı yok
                </div>
              )}
              {recentAlerts.map((alert: any, i: number) => {
                const isUp = alert.type?.toLowerCase().includes("spike") || alert.type?.toLowerCase().includes("up") || alert.type?.toLowerCase().includes("gain");
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: isUp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      border: `1px solid ${isUp ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isUp ? <TrendingUp size={12} color="#22c55e" /> : <TrendingDown size={12} color="#ef4444" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                        {alert.symbol} <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>· {alert.type}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {alert.message}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending */}
          <div className="card-clean" style={{ padding: "24px" }}>
            <SectionHeader icon={Flame} title="Trending" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(trendingData || []).slice(0, 5).map((coin: any, i: number) => (
                <div
                  key={coin.symbol || i}
                  onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", width: 16 }}>{i + 1}</span>
                  {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: "50%" }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{coin.symbol?.toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{coin.name}</div>
                  </div>
                  <Activity size={12} color="rgba(255,255,255,0.2)" />
                </div>
              ))}
              {(!trendingData || trendingData.length === 0) && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "16px 0" }}>Yükleniyor…</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 4: AI Sinyal kartı ─── */}
      <div
        className="reveal card-clean"
        onClick={() => navigate("/analysis/ai")}
        style={{
          padding: "28px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          '--reveal-delay': '240ms',
        } as any}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(94,106,210,0.4)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px rgba(94,106,210,0.15), 0 20px 60px rgba(94,106,210,0.08)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(94,106,210,0.12)",
            border: "1px solid rgba(94,106,210,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Brain size={20} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>AI Analiz — Günün Sinyali</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Bir coin seç, Gemini destekli teknik + fundamental analiz al.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent)", flexShrink: 0 }}>
          Analiz Yap <ArrowRight size={14} />
        </div>
      </div>
      </div>
    </div>
  );
}
