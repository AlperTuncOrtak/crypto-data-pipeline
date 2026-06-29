import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useCoinDetail, useCoinHistory, useCoinStats } from "../hooks/useCoin";
import {
  ArrowLeft, TrendingUp, TrendingDown,
  LineChart, CandlestickChart, Lock,
} from "lucide-react";
// AnimatedPrice is defined inline below
import LightweightCandleChart from "../components/market/LightweightCandleChart";
import { useAuth } from "../hooks/useAuth";
import CryptoNews from "../components/market/CryptoNews";
import AIPulse from "../components/ai/AIPulse";
import AIAnalysisBox from "../components/market/AIAnalysisBox";
import AttackMomentum from "../components/market/AttackMomentum";
import HypeRealityWidget from "../components/market/HypeRealityWidget";
import TokenomicsWidget from "../components/market/TokenomicsWidget";
import { useTranslation } from "react-i18next";
import { getCoinColor } from "../utils/colors";

const RANGES = [
  { label: "1H", value: "1h" },
  { label: "24H", value: "24h" },
  { label: "7D",  value: "7d"  },
  { label: "30D", value: "30d" },
  { label: "ALL", value: "all" },
];

// ─── Formatters ─────────────────────────────────────────────
function fmtPrice(n: any) {
  const v = Number(n);
  if (isNaN(v) || n == null) return "—";
  if (v >= 1000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (v >= 1)    return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  return `<$0.000001`;
}

function fmtLarge(n: any, prefix = "$") {
  const v = Number(n);
  if (isNaN(v) || n == null || v === 0) return "—";
  if (v >= 1e12) return `${prefix}${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `${prefix}${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `${prefix}${(v / 1e6).toFixed(2)}M`;
  return `${prefix}${v.toFixed(2)}`;
}

function fmtPct(n: any) {
  const v = Number(n);
  if (isNaN(v) || n == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function fmtDate(s: any) {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return s; }
}

function fmtChartTime(iso: any, range: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (range === "1h" || range === "24h") return time;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── Sub-components ──────────────────────────────────────────
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border-soft)",
      borderRadius: 10, padding: "10px 14px",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
        {payload[0]?.payload?.time ? new Date(payload[0].payload.time).toLocaleString() : ""}
      </div>
      <div style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>
        {fmtPrice(payload[0]?.value)}
      </div>
    </div>
  );
}

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid var(--border-soft)",
    }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: valueColor || "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────────
export default function CoinDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isPro } = useAuth();
  const [range, setRange] = useState("24h");
  const [chartType, setChartType] = useState("simple");

  const { data: coin, isLoading, isError } = useCoinDetail(slug);
  const { data: history, isLoading: historyLoading } = useCoinHistory(slug, range);
  const { data: stats } = useCoinStats(slug);

  const prevRef = useRef<any>(null);
  const [prevPrice, setPrevPrice] = useState<any>(null);
  const [priceFlash, setPriceFlash] = useState<any>(null);

  useEffect(() => {
    if (!coin?.current_price) return;
    const cur = coin.current_price;
    const prev = prevRef.current;
    if (prev !== null && cur !== prev) {
      setPrevPrice(prev);
      setPriceFlash(cur > prev ? "up" : "down");
      setTimeout(() => setPriceFlash(null), 800);
    }
    prevRef.current = cur;
  }, [coin?.current_price]);

  const simpleChartData = useMemo(() => {
    const arr = history || [];
    if (!arr.length || !coin?.current_price) return arr;
    const cloned = [...arr];
    const last = cloned[cloned.length - 1];
    const lastTime = new Date(last.time).getTime();
    if (Date.now() - lastTime > 60000) {
      cloned.push({ time: new Date().toISOString(), price: coin.current_price });
    } else {
      cloned[cloned.length - 1] = { ...last, price: coin.current_price };
    }
    return cloned;
  }, [history, coin?.current_price]);

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text-muted)", fontSize: 15 }}>
      Loading...
    </div>
  );

  if (isError || !coin) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
      <div style={{ fontSize: 40 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Coin not found</div>
      <button onClick={() => navigate("/market")} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", cursor: "pointer" }}>
        ← Back to Markets
      </button>
    </div>
  );

  const change = Number(coin.price_change_percentage_24h);
  const isPositive = change >= 0;
  const chartData = history || [];
  const chartTrend = chartData.length >= 2
    ? Number(chartData.at(-1)?.price) >= Number(chartData[0]?.price)
    : isPositive;
  const chartColor = chartTrend ? "#22c55e" : "#ef4444";
  const brandColor = getCoinColor(coin.symbol);
  const athPct = coin.ath && coin.current_price
    ? (((Number(coin.current_price) - Number(coin.ath)) / Number(coin.ath)) * 100).toFixed(1)
    : null;

  // ATH-ATL range %
  const lo = Number(coin.atl), hi = Number(coin.ath), cur = Number(coin.current_price);
  const rangePct = (lo && hi && cur && hi > lo)
    ? Math.min(100, Math.max(0, ((cur - lo) / (hi - lo)) * 100)).toFixed(1)
    : null;

  return (
    <div style={{ color: "var(--text-primary)", fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 1280, margin: "0 auto", padding: "32px 32px" }}>

      {/* ── BACK ─────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "var(--text-muted)", background: "none",
          border: "none", cursor: "pointer", marginBottom: 28, padding: 0,
          transition: "color 120ms",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* ── HERO HEADER ──────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
        {/* Left: name + symbol */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {coin.image_url
            ? <img src={coin.image_url} alt={coin.name} style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0 }} onError={(e: any) => (e.target.style.display = "none")} />
            : <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: brandColor }}>{coin.symbol?.slice(0, 2)}</div>
          }
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", margin: 0, color: "var(--text-primary)" }}>{coin.name}</h1>
              {coin.market_cap_rank && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "var(--bg-elevated)", border: "1px solid var(--border-soft)", color: "var(--text-secondary)" }}>
                  #{coin.market_cap_rank}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 5, fontFamily: "monospace" }}>
              {coin.symbol?.toUpperCase()} · {coin.slug}
            </div>
          </div>
        </div>

        {/* Right: price + change */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", fontFamily: "monospace", lineHeight: 1 }}>
            {fmtPrice(coin.current_price)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            {isPositive ? <TrendingUp size={16} color="#22c55e" /> : <TrendingDown size={16} color="#ef4444" />}
            <span style={{ fontSize: 17, fontFamily: "monospace", fontWeight: 700, color: isPositive ? "#22c55e" : "#ef4444" }}>
              {fmtPct(change)}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>24h</span>
          </div>
          {athPct !== null && (
            <div style={{ fontSize: 12, color: Number(athPct) < 0 ? "#ef4444" : "#22c55e", marginTop: 4, fontFamily: "monospace" }}>
              {athPct}% {Number(athPct) < 0 ? "from ATH" : "above ATH"}
            </div>
          )}
        </div>
      </div>

      {/* ── TWO-COLUMN LAYOUT ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

        {/* ── LEFT COLUMN ──────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* CHART CARD */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            {/* Chart toolbar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 20px", borderBottom: "1px solid var(--border-soft)",
              flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginRight: 4 }}>Price Chart</span>
              
              {/* Time range */}
              <div style={{ display: "flex", gap: 2, background: "var(--bg-surface)", padding: 3, borderRadius: 8, border: "1px solid var(--border)" }}>
                {RANGES.map(r => (
                  <button key={r.value} onClick={() => setRange(r.value)} style={{
                    padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, transition: "all 120ms",
                    background: range === r.value ? "rgba(255,255,255,0.09)" : "transparent",
                    color: range === r.value ? "var(--text-primary)" : "var(--text-muted)",
                  }}>{r.label}</button>
                ))}
              </div>

              {/* Chart type */}
              <div style={{ marginLeft: "auto", display: "flex", gap: 2, background: "var(--bg-surface)", padding: 3, borderRadius: 8, border: "1px solid var(--border)" }}>
                <button onClick={() => setChartType("simple")} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, transition: "all 120ms",
                  background: chartType === "simple" ? "rgba(255,255,255,0.09)" : "transparent",
                  color: chartType === "simple" ? "var(--text-primary)" : "var(--text-muted)",
                }}>
                  <LineChart size={13} /> Line
                </button>
                <button onClick={() => setChartType("pro")} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, transition: "all 120ms",
                  background: chartType === "pro" ? "rgba(34,197,94,0.10)" : "transparent",
                  color: chartType === "pro" ? "#22c55e" : "var(--text-muted)",
                }}>
                  <CandlestickChart size={13} /> Candle
                </button>
              </div>
            </div>

            {/* Chart body */}
            <div style={{ padding: "16px 16px 8px" }}>
              {historyLoading ? (
                <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  Loading chart...
                </div>
              ) : chartData.length === 0 ? (
                <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  No chart data available
                </div>
              ) : chartType === "pro" ? (
                <div style={{ height: 300 }}>
                  <LightweightCandleChart data={chartData} currentPrice={coin.current_price} />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={simpleChartData}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartColor} stopOpacity={0.20} />
                        <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tickFormatter={t => fmtChartTime(t, range)} stroke="transparent" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                    <YAxis
                      tickFormatter={v => {
                        const n = Number(v);
                        if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                        if (n >= 1) return `$${n.toFixed(2)}`;
                        return `$${n.toFixed(4)}`;
                      }}
                      stroke="transparent"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      width={80}
                      domain={([min, max]: any) => { const p = (max - min) * 0.06 || min * 0.001; return [min - p, max + p]; }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="natural" dataKey="price" stroke={chartColor} strokeWidth={2} fill="url(#cg)" dot={false}
                      activeDot={{ r: 5, fill: chartColor, stroke: "var(--bg-card)", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* PRO ANALYTICS */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-soft)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Pro Analytics</span>
            </div>
            <div style={{ padding: 20 }}>
              {isPro ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <AIAnalysisBox slug={coin.slug} coinName={coin.name} symbol={coin.symbol} brandColor={brandColor} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <AttackMomentum symbol={coin.symbol} brandColor={brandColor} />
                    <HypeRealityWidget symbol={coin.symbol} />
                  </div>
                  <AIPulse slug={slug} />
                </div>
              ) : (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "40px 20px", textAlign: "center", gap: 16,
                  background: "rgba(255,255,255,0.01)", borderRadius: 12,
                  border: "1px solid var(--border-soft)",
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock size={24} color="var(--text-muted)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Unlock AI Analyst</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 360 }}>
                      Get real-time AI-powered market sentiment, attack momentum, and advanced predictions.
                    </div>
                  </div>
                  <Link to="/pricing" style={{
                    padding: "10px 24px", borderRadius: 8, background: "var(--text-primary)",
                    color: "var(--bg-base)", fontWeight: 700, fontSize: 14, textDecoration: "none",
                    transition: "opacity 150ms",
                  }}
                    onMouseEnter={e => ((e.target as any).style.opacity = "0.85")}
                    onMouseLeave={e => ((e.target as any).style.opacity = "1")}
                  >
                    Upgrade to Pro →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* TOKENOMICS */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-soft)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Tokenomics</span>
            </div>
            <div style={{ padding: 20 }}>
              <TokenomicsWidget coin={coin} />
            </div>
          </div>

          {/* NEWS */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-soft)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Latest News</span>
            </div>
            <div style={{ padding: 20 }}>
              <CryptoNews symbol={coin.symbol} />
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Market Stats */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-soft)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Market Stats</span>
            </div>
            <div style={{ padding: "4px 20px 12px" }}>
              <StatRow label="Market Cap" value={fmtLarge(coin.market_cap)} />
              <StatRow label="24h Volume" value={fmtLarge(coin.total_volume)} />
              <StatRow label="24h High" value={fmtPrice(stats?.high_24h)} valueColor="#22c55e" />
              <StatRow label="24h Low" value={fmtPrice(stats?.low_24h)} valueColor="#ef4444" />
              <StatRow label="ATH" value={fmtPrice(coin.ath)} />
              <StatRow label="ATH Date" value={fmtDate(coin.ath_date)} />
              <StatRow label="ATL" value={fmtPrice(coin.atl)} />
              <StatRow label="ATL Date" value={fmtDate(coin.atl_date)} />
              <StatRow label="Rank" value={coin.market_cap_rank ? `#${coin.market_cap_rank}` : "—"} />
            </div>
          </div>

          {/* ATH-ATL Bar */}
          {rangePct !== null && (
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-soft)",
              borderRadius: 16, padding: 20,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Price Range (ATL → ATH)</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                <span>ATL {fmtPrice(coin.atl)}</span>
                <span>ATH {fmtPrice(coin.ath)}</span>
              </div>
              <div style={{ position: "relative", height: 6, borderRadius: 3, background: "var(--border-soft)" }}>
                <div style={{
                  position: "absolute", left: 0, height: "100%",
                  width: `${rangePct}%`, borderRadius: 3,
                  background: `linear-gradient(90deg, #ef4444, #eab308, #22c55e)`,
                }} />
                <div style={{
                  position: "absolute", top: "50%", left: `${rangePct}%`,
                  transform: "translate(-50%, -50%)",
                  width: 12, height: 12, borderRadius: "50%",
                  background: "white", border: "2px solid var(--bg-card)",
                  boxShadow: "0 0 6px rgba(255,255,255,0.4)",
                }} />
              </div>
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                {rangePct}% above ATL
              </div>
            </div>
          )}

          {/* Supply Info */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-soft)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Supply</span>
            </div>
            <div style={{ padding: "4px 20px 12px" }}>
              <StatRow label="Circulating" value={fmtLarge(coin.circulating_supply, "")} />
              <StatRow label="Total Supply" value={fmtLarge(coin.total_supply, "")} />
              <StatRow label="Max Supply" value={fmtLarge(coin.max_supply, "")} />
              {coin.circulating_supply && coin.total_supply && Number(coin.total_supply) > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
                    <span>Circulation rate</span>
                    <span>{((Number(coin.circulating_supply) / Number(coin.total_supply)) * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--border-soft)" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: `${Math.min(100, (Number(coin.circulating_supply) / Number(coin.total_supply)) * 100)}%`,
                      background: "linear-gradient(90deg, var(--accent), #22c55e)",
                    }} />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
