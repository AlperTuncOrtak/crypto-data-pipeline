import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useCoinDetail, useCoinHistory, useCoinStats } from "../hooks/useCoin";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Coins,
  Award,
  AlertCircle,
  LineChart,
  CandlestickChart,
} from "lucide-react";
import AdvancedChart from "../components/market/AdvancedChart";
import AIPulse from "../components/ai/AIPulse";

const RANGES = [
  { label: "1H", value: "1h" },
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "ALL", value: "all" },
];

// ─── Formatters ───────────────────────────────────────────────
function fmtPrice(n) {
  const v = Number(n);
  if (isNaN(v) || n === null || n === undefined) return "—";
  if (v >= 1000)
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  if (v >= 0.000001) return `$${v.toFixed(8)}`;
  return `<$0.000001`;
}

function fmtLarge(n, prefix = "$") {
  const v = Number(n);
  if (isNaN(v) || n === null || n === undefined) return "—";
  if (v === 0) return "—";
  if (v >= 1e12) return `${prefix}${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${prefix}${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${prefix}${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${prefix}${(v / 1e3).toFixed(2)}K`;
  return `${prefix}${v.toFixed(2)}`;
}

function fmtSupply(n) {
  const v = Number(n);
  if (isNaN(v) || n === null || n === undefined) return "—";
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toLocaleString();
}

function fmtPct(n) {
  const v = Number(n);
  if (isNaN(v) || n === null || n === undefined) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function fmtDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
}

function fmtChartTime(iso, range) {
  if (!iso) return "";
  const d = new Date(iso);
  if (range === "1h" || range === "24h")
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── Animated price ───────────────────────────────────────────
function AnimatedPrice({ current, prev, flash }) {
  const str = fmtPrice(current);
  const pstr = prev ? fmtPrice(prev) : str;

  // Pad the shorter string with spaces on the left so they align perfectly
  const maxLen = Math.max(str.length, pstr.length);
  const curAligned = str.padStart(maxLen, " ");
  const prvAligned = pstr.padStart(maxLen, " ");

  const upColor   = "#2ecc71";
  const downColor = "#e74c3c";
  const flashColor = flash === "up" ? upColor : downColor;

  return (
    <span>
      {curAligned.split("").map((char, i) => {
        const changed = flash && char !== prvAligned[i] && char !== " " && char !== "." && char !== "$";
        return (
          <span
            key={i}
            style={{
              color: changed ? flashColor : "var(--text-primary)",
              transition: "color 0.6s ease",
              textShadow: changed ? `0 0 16px ${flashColor}99, 0 0 32px ${flashColor}44` : "none",
            }}
          >
            {char}
          </span>
        );
      })}
      <style>{`
        @keyframes pricePulse-up {
          0%   { box-shadow: 0 0 0 0 rgba(46,204,113,0.55), inset 0 0 0 0 rgba(46,204,113,0.15); background: rgba(46,204,113,0.12); }
          60%  { box-shadow: 0 0 24px 6px rgba(46,204,113,0.18), inset 0 0 20px 4px rgba(46,204,113,0.08); background: rgba(46,204,113,0.06); }
          100% { box-shadow: none; background: transparent; }
        }
        @keyframes pricePulse-down {
          0%   { box-shadow: 0 0 0 0 rgba(231,76,60,0.55), inset 0 0 0 0 rgba(231,76,60,0.15); background: rgba(231,76,60,0.12); }
          60%  { box-shadow: 0 0 24px 6px rgba(231,76,60,0.18), inset 0 0 20px 4px rgba(231,76,60,0.08); background: rgba(231,76,60,0.06); }
          100% { box-shadow: none; background: transparent; }
        }
      `}</style>
    </span>
  );
}

// ─── Stat card ───────────────────────────────────────────────
function StatCard({ label, value, sub, highlight, icon: Icon }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: `1px solid ${highlight ? "rgba(245,166,35,0.25)" : "var(--border)"}`,
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        {Icon && <Icon size={13} style={{ color: "var(--text-muted)" }} />}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          fontFamily: "monospace",
          color: highlight ? "var(--accent)" : "var(--text-primary)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-muted)",
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

// ─── Chart tooltip ───────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "10px 14px",
      }}
    >
      <div
        style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}
      >
        {label ? new Date(label).toLocaleString() : ""}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontWeight: 700,
          color: "var(--accent)",
        }}
      >
        {fmtPrice(payload[0]?.value)}
      </div>
    </div>
  );
}

// ─── Supply bar ──────────────────────────────────────────────
function SupplyBar({ circulating, total, max }) {
  const cap = max || total;
  if (!circulating || !cap) return null;
  const pct = Math.min(100, (circulating / cap) * 100).toFixed(1);
  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 5,
        }}
      >
        <span>Circulating</span>
        <span>
          {pct}% of {max ? "max" : "total"}
        </span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 3,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--accent)",
            borderRadius: 3,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── ATH/ATL bar ─────────────────────────────────────────────
function PriceRangeBar({ current, ath, atl }) {
  const lo = Number(atl),
    hi = Number(ath),
    cur = Number(current);
  if (!lo || !hi || !cur || hi <= lo) return null;
  const pct = Math.min(
    100,
    Math.max(0, ((cur - lo) / (hi - lo)) * 100),
  ).toFixed(1);
  return (
    <div
      style={{
        marginTop: 16,
        padding: "14px 18px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        <span>ATL {fmtPrice(atl)}</span>
        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
          Current position
        </span>
        <span>ATH {fmtPrice(ath)}</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 6,
          borderRadius: 3,
          background: "var(--border)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            height: "100%",
            width: `${pct}%`,
            borderRadius: 3,
            background: `linear-gradient(90deg, #e74c3c, #f5a623, #2ecc71)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translate(-50%, -50%)",
            left: `${pct}%`,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "var(--accent)",
            border: "2px solid var(--bg-base)",
            boxShadow: "0 0 6px rgba(245,166,35,0.6)",
          }}
        />
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 8,
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        {pct}% above ATL
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function CoinDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState("24h");
  const [chartType, setChartType] = useState("simple");

  const {
    data: coin,
    isLoading: coinLoading,
    isError: coinError,
  } = useCoinDetail(slug);
  const { data: history, isLoading: historyLoading } = useCoinHistory(
    slug,
    range,
  );
  const { data: stats } = useCoinStats(slug);

  const prevRef = useRef(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [priceFlash, setPriceFlash] = useState(null);

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

  const chartData = history || [];
  const change = Number(coin?.price_change_percentage_24h);
  const isPositive = change >= 0;
  const chartTrend =
    chartData.length >= 2
      ? Number(chartData.at(-1)?.price) >= Number(chartData[0]?.price)
      : isPositive;
  const chartColor = chartTrend ? "var(--positive)" : "var(--negative)";

  // ATH'den ne kadar uzakta
  const athPct =
    coin?.ath && coin?.current_price
      ? (
          ((Number(coin.current_price) - Number(coin.ath)) / Number(coin.ath)) *
          100
        ).toFixed(1)
      : null;

  if (coinLoading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 260,
          color: "var(--text-muted)",
        }}
      >
        Loading...
      </div>
    );

  if (coinError || !coin)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 260,
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Coin not found</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          "{slug}" could not be found.
        </div>
        <button
          onClick={() => navigate("/market")}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1px solid rgba(245,166,35,0.3)",
            background: "rgba(245,166,35,0.08)",
            color: "var(--accent)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          ← Back to Market
        </button>
      </div>
    );

  return (
    <div style={{ color: "var(--text-primary)", maxWidth: 1100 }}>
      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginBottom: 24,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-muted)")
        }
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* HERO */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {coin.image_url ? (
            <img
              src={coin.image_url}
              alt={coin.name}
              style={{ width: 56, height: 56, borderRadius: "50%" }}
              onError={(e) => (e.target.style.display = "none")}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {coin.symbol?.slice(0, 2)}
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>{coin.name}</h1>
              {coin.market_cap_rank && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "var(--accent-soft)",
                    border: "1px solid var(--accent-border)",
                    color: "var(--accent)",
                  }}
                >
                  #{coin.market_cap_rank}
                </span>
              )}
            </div>
            <div
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}
            >
              {coin.symbol?.toUpperCase()} · CoinGecko ID: {coin.slug}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            fontFamily: "monospace",
            padding: "8px 14px",
            borderRadius: 12,
            display: "inline-block",
            transition: "all 0.3s ease",
          }}
        >
          <AnimatedPrice
            current={coin.current_price}
            prev={prevPrice}
            flash={priceFlash}
          />
        </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            {isPositive ? (
              <TrendingUp size={16} color="var(--positive)" />
            ) : (
              <TrendingDown size={16} color="var(--negative)" />
            )}
            <span
              style={{
                fontSize: 17,
                fontFamily: "monospace",
                fontWeight: 600,
                color: isPositive ? "var(--positive)" : "var(--negative)",
              }}
            >
              {fmtPct(change)}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              24h
            </span>
          </div>
          {athPct !== null && (
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}
            >
              {Number(athPct) < 0 ? (
                <span style={{ color: "#e74c3c" }}>{athPct}% from ATH</span>
              ) : (
                <span style={{ color: "#2ecc71" }}>+{athPct}% above ATH</span>
              )}
            </div>
          )}
        </div>
      </div>

      <AIPulse slug={slug} />

      {/* PRICE RANGE BAR */}
      {coin.ath && coin.atl && (
        <PriceRangeBar
          current={coin.current_price}
          ath={coin.ath}
          atl={coin.atl}
        />
      )}

      {/* MARKET STATS */}
      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <SectionTitle>Market Stats</SectionTitle>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Market Cap"
          value={fmtLarge(coin.market_cap)}
          icon={BarChart2}
        />
        <StatCard
          label="Volume (24h)"
          value={fmtLarge(coin.total_volume)}
          icon={BarChart2}
        />
        <StatCard
          label="24h High"
          value={fmtPrice(stats?.high_24h)}
          icon={TrendingUp}
        />
        <StatCard
          label="24h Low"
          value={fmtPrice(stats?.low_24h)}
          icon={TrendingDown}
        />
      </div>

      {/* ATH / ATL */}
      <div style={{ marginBottom: 8 }}>
        <SectionTitle>All-Time Records</SectionTitle>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="All-Time High"
          value={fmtPrice(coin.ath)}
          sub={coin.ath_date ? fmtDate(coin.ath_date) : undefined}
          icon={Award}
        />
        <StatCard
          label="All-Time Low"
          value={fmtPrice(coin.atl)}
          sub={coin.atl_date ? fmtDate(coin.atl_date) : undefined}
          icon={AlertCircle}
        />
        <StatCard
          label="ATH Change"
          value={athPct !== null ? `${athPct}%` : "—"}
          sub={
            Number(athPct) < 0 ? "below all-time high" : "above all-time high"
          }
          icon={TrendingDown}
        />
        <StatCard
          label="Rank"
          value={coin.market_cap_rank ? `#${coin.market_cap_rank}` : "—"}
          icon={Award}
          highlight
        />
      </div>

      {/* SUPPLY */}
      <div style={{ marginBottom: 8 }}>
        <SectionTitle>Supply</SectionTitle>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Circulating"
          value={fmtSupply(coin.circulating_supply)}
          sub={coin.symbol?.toUpperCase()}
          icon={Coins}
        />
        <StatCard
          label="Total Supply"
          value={fmtSupply(coin.total_supply)}
          sub={coin.symbol?.toUpperCase()}
          icon={Coins}
        />
        <StatCard
          label="Max Supply"
          value={
            fmtSupply(coin.max_supply) === "—"
              ? "∞ Unlimited"
              : fmtSupply(coin.max_supply)
          }
          sub={coin.symbol?.toUpperCase()}
          icon={Coins}
        />
      </div>
      {coin.circulating_supply && (coin.max_supply || coin.total_supply) && (
        <SupplyBar
          circulating={coin.circulating_supply}
          total={coin.total_supply}
          max={coin.max_supply}
        />
      )}

      {/* CHART */}
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 24,
          padding: 24,
          marginTop: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ambient glow */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 220, height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${isPositive ? "rgba(46,204,113,0.07)" : "rgba(231,76,60,0.07)"} 0%, transparent 70%)`,
          filter: "blur(20px)", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          <SectionTitle>Price Chart</SectionTitle>

          {/* Time range pills */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3 }}>
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  background: range === r.value ? "rgba(245,166,35,0.15)" : "transparent",
                  border: range === r.value ? "1px solid rgba(245,166,35,0.25)" : "1px solid transparent",
                  color: range === r.value ? "var(--accent)" : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Chart type toggle — pushed right */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3 }}>
            <button
              onClick={() => setChartType("simple")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                background: chartType === "simple" ? "rgba(255,255,255,0.08)" : "transparent",
                border: chartType === "simple" ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                color: chartType === "simple" ? "#fff" : "rgba(255,255,255,0.35)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <LineChart size={13} /> Simple
            </button>
            <button
              onClick={() => setChartType("pro")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                background: chartType === "pro" ? "rgba(46,204,113,0.12)" : "transparent",
                border: chartType === "pro" ? "1px solid rgba(46,204,113,0.25)" : "1px solid transparent",
                color: chartType === "pro" ? "#2ecc71" : "rgba(255,255,255,0.35)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <CandlestickChart size={13} /> Pro 🕯️
            </button>
          </div>
        </div>

        {/* Pro chart always rendered when selected so chart mounts */}
        {chartType === "pro" && (
          <div style={{ width: "100%", height: 420, borderRadius: 16, overflow: "hidden" }}>
            <AdvancedChart symbol={coin.symbol} interval={range} />
          </div>
        )}

        {/* Simple chart */}
        {chartType === "simple" && historyLoading && (
          <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}>
            Loading chart...
          </div>
        )}
        {chartType === "simple" && !historyLoading && chartData.length === 0 && (
          <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}>
            No data for this time range.
          </div>
        )}
        {chartType === "simple" && !historyLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => fmtChartTime(t, range)}
                stroke="var(--border)"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(v) => {
                  const n = Number(v);
                  if (n >= 1000)
                    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                  if (n >= 1) return `$${n.toFixed(2)}`;
                  if (n >= 0.01) return `$${n.toFixed(4)}`;
                  return `$${n.toFixed(6)}`;
                }}
                stroke="var(--border)"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                width={90}
                domain={([min, max]) => {
                  const p = (max - min) * 0.08 || min * 0.001;
                  return [min - p, max + p];
                }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#cg)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "var(--accent)",
                  stroke: "var(--bg-surface)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {stats && (
          <div style={{ textAlign: "right", marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
            {stats.data_points} data points in last 24h
          </div>
        )}
        </div>{/* end position:relative inner */}
      </div>
    </div>
  );
}
