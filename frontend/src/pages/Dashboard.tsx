// ============================================================
// pages/Dashboard.tsx
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

// ─── HELPERS ────────────────────────────────────────────────
function fmt(n: number) {
  if (!n || isNaN(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

// ─── SPARKLINE ───────────────────────────────────────────────
function MiniChart({ points, up, width = 120, height = 44 }: {
  points: number[]; up: boolean; width?: number | string; height?: number;
}) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pts = points
    .map((v, i) => `${(i / (points.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(" ");
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: "visible", display: "block", width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`sg-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,100 ${pts} 100,100`}
        fill={`url(#sg-${up})`}
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ─── FEAR & GREED DIAL ─────────────────────────────────────────
function FearGreedDial({ value }: { value: number }) {
  const clamp = Math.min(100, Math.max(0, value));
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
  const pathData = [
    `M ${cx - r * Math.sin(toRad(45))} ${cy + r * Math.cos(toRad(45))}`,
    `A ${r} ${r} 0 1 1 ${cx + r * Math.sin(toRad(45))} ${cy + r * Math.cos(toRad(45))}`
  ].join(" ");
  const valX = cx + (r - 6) * Math.sin(toRad(angle));
  const valY = cy - (r - 6) * Math.cos(toRad(angle));

  return (
    <div style={{ position: "relative", width: 140, height: 100 }}>
      <svg width={140} height={140} style={{ position: "absolute", top: 0, left: 0 }}>
        <path d={pathData} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
        <path d={pathData} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray="300" strokeDashoffset={300 - (clamp / 100) * 255} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        <circle cx={valX} cy={valY} r="4" fill="#fff" stroke={color} strokeWidth="2" style={{ transition: "all 1s ease-out" }} />
      </svg>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", fontFamily: "monospace" }}>{clamp}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: -2 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────
function SectionHeader({ icon: Icon, title, action, onAction }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color="rgba(255,255,255,0.6)" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{title}</span>
      </div>
      {action && (
        <span
          onClick={onAction}
          style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: "rgba(94,106,210,0.1)" }}
        >
          {action}
        </span>
      )}
    </div>
  );
}

function LiveBadge() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "4px 10px", borderRadius: 12 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "pulse 2s infinite" }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", letterSpacing: "0.06em", textTransform: "uppercase" }}>Live</span>
      <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }`}</style>
    </div>
  );
}

// ─── DASHBOARD PAGE ──────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: coins } = useMarket();
  const { data: gainersData } = useGainers();
  const { data: losersData } = useLosers();
  const { data: statsData } = useMarketStats();
  const { data: trendingData } = useTrending();
  const { data: alertsData } = useAlerts();
  const { data: fng } = useFearAndGreed();

  const btcCoin = coins?.find((c: any) => c.symbol.toLowerCase() === "btc");
  const ethCoin = coins?.find((c: any) => c.symbol.toLowerCase() === "eth");

  const { data: btcSparkline } = useSparklines(btcCoin?.id);

  useScrollReveal();
  const canvasRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!spotRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spotRef.current.style.transform = `translate(${x - 300}px, ${y - 300}px)`;
      spotRef.current.style.opacity = "1";
    };
    const handleLeave = () => {
      if (spotRef.current) spotRef.current.style.opacity = "0";
    };
    window.addEventListener("mousemove", handleMouse);
    document.body.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouse);
      document.body.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const totalMcap = statsData?.total_market_cap?.usd || 0;
  const totalVolume = statsData?.total_volume?.usd || 0;
  const btcDom = statsData?.market_cap_percentage?.btc?.toFixed(1) || "0.0";
  const top10 = (coins || []).slice(0, 10);

  const btcPoints = btcSparkline || [0,0];
  const btcUp = btcPoints.length > 1 ? btcPoints[btcPoints.length - 1] >= btcPoints[0] : true;

  const fngValue = fng ? parseInt(fng.value) : null;
  const recentAlerts = (alertsData || []).slice(0, 4);

  return (
    <div ref={canvasRef} style={{ position: "relative", color: "var(--text-primary)", overflow: "hidden", minHeight: "100vh" }}>
      
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

      {/* ─── CURSOR SPOTLIGHT ─── */}
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
          top: 0, left: 0
        }}
      />

      {/* ─── ALL CONTENT ─── */}
      <div ref={revealRef} style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "40px 32px" }}>

      {/* ─── HEADER ─── */}
      <div className="reveal" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
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

      {/* ─── NEW LAYOUT: LEFT MAIN + RIGHT SIDEBAR ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 24, alignItems: "start" }}>
        
        {/* ─── LEFT COLUMN: Main Content ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* MACRO STRIP */}
          <div
            className="reveal card-apple"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", overflow: "hidden", '--reveal-delay': '60ms' } as any}
          >
            {[
              { label: "Market Cap", value: fmt(totalMcap), sub: `${coins?.length || 0}+ asset` },
              { label: "24h Volume", value: fmt(totalVolume), sub: "global" },
              { label: "BTC Dominance", value: `${btcDom}%`, sub: "of total market" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "20px 24px",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", fontFamily: "monospace" }}>
                  {item.value}
                </div>
                {item.sub && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginTop: 4, fontFamily: "monospace" }}>
                    {item.sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* MAIN CHART */}
          <div className="reveal card-apple" style={{ padding: "24px", '--reveal-delay': '120ms' } as any}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {btcCoin?.image_url && <img src={btcCoin.image_url} alt="BTC" style={{ width: 24, height: 24, borderRadius: "50%" }} />}
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Bitcoin (BTC)</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: "#fff", letterSpacing: "-0.02em" }}>
                  {btcCoin ? <PriceCell price={btcCoin.current_price} /> : "—"}
                </div>
              </div>
              <span style={{
                fontSize: 14, fontWeight: 700, fontFamily: "monospace",
                color: btcUp ? "#22c55e" : "#ef4444",
                background: btcUp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                padding: "6px 12px", borderRadius: 8,
              }}>
                {btcCoin && (Number(btcCoin.price_change_percentage_24h) >= 0 ? "+" : "")}{btcCoin ? Number(btcCoin.price_change_percentage_24h).toFixed(2) : "0"}%
              </span>
            </div>
            <div style={{ width: "100%", height: 160, position: "relative" }}>
               <MiniChart points={btcPoints} up={btcUp} width="100%" height={160} />
            </div>
          </div>

          {/* TOP 10 TABLE */}
          <div className="reveal card-apple" style={{ padding: "20px 8px", '--reveal-delay': '180ms' } as any}>
            <div style={{ padding: "0 16px" }}>
              <SectionHeader icon={BarChart2} title="Top 10" action="Tümü" onAction={() => navigate("/market")} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
              {top10.map((coin: any, i: number) => {
                const isUp = Number(coin.price_change_percentage_24h) >= 0;
                return (
                  <div
                    key={coin.symbol}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    style={{
                      display: "grid", gridTemplateColumns: "30px 2fr 1fr 1fr", alignItems: "center",
                      padding: "12px", borderRadius: 8, cursor: "pointer",
                      transition: "background 200ms"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{i + 1}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 24, height: 24, borderRadius: "50%" }} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{coin.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{coin.symbol?.toUpperCase()}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#fff", textAlign: "right" }}>
                      <PriceCell price={coin.current_price} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", textAlign: "right", color: isUp ? "#22c55e" : "#ef4444" }}>
                      {isUp ? "+" : ""}{Number(coin.price_change_percentage_24h).toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Sidebar ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Fear & Greed */}
          <div className="reveal card-apple" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, '--reveal-delay': '200ms' } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
              FEAR & GREED INDEX
            </div>
            {fngValue !== null
              ? <FearGreedDial value={fngValue} />
              : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", height: 74, display: "flex", alignItems: "center" }}>Yükleniyor...</div>
            }
          </div>

          {/* Trending */}
          <div className="reveal card-apple" style={{ padding: "20px", '--reveal-delay': '220ms' } as any}>
            <SectionHeader icon={Flame} title="Trending" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(trendingData || []).slice(0, 4).map((coin: any, i: number) => (
                <div
                  key={coin.symbol || i}
                  onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", width: 16 }}>{i + 1}</span>
                  {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: "50%" }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{coin.symbol?.toUpperCase()}</div>
                  </div>
                  <Activity size={12} color="rgba(255,255,255,0.2)" />
                </div>
              ))}
            </div>
          </div>

          {/* Gainers */}
          <div className="reveal card-apple" style={{ padding: "20px", '--reveal-delay': '240ms' } as any}>
            <SectionHeader icon={TrendingUp} title="Top Gainers" action="Tümü" onAction={() => navigate("/market?sort=gain")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(gainersData || []).slice(0, 4).map((coin: any) => (
                <div
                  key={coin.symbol}
                  onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: "50%" }} />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{coin.symbol?.toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", fontFamily: "monospace" }}>
                    +{Number(coin.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Signal Card */}
          <div
            className="reveal card-apple"
            onClick={() => navigate("/analysis/ai")}
            style={{
              padding: "20px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              '--reveal-delay': '260ms',
            } as any}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(94,106,210,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Brain size={18} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Analiz — Sinyal</div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              Gemini destekli detaylı kripto raporu ve günün fırsatları.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
              Hemen İncele <ArrowRight size={14} />
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
}
