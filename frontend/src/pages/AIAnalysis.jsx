import { useState } from "react";
import { useMarket } from "../hooks/useMarket";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Search,
  Loader,
  Zap,
  Shield,
  Target,
  Activity,
  BarChart2,
  Wind,
} from "lucide-react";
import { apiClient } from "../api/client";

function formatPrice(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 10000)
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (num >= 1000)
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(4)}`;
  return `$${num.toFixed(6)}`;
}

const SIGNAL_CONFIG = {
  bullish: {
    color: "#2ecc71",
    bg: "rgba(46,204,113,0.08)",
    border: "rgba(46,204,113,0.25)",
    glow: "rgba(46,204,113,0.12)",
    icon: TrendingUp,
    label: "BULLISH",
  },
  bearish: {
    color: "#e74c3c",
    bg: "rgba(231,76,60,0.08)",
    border: "rgba(231,76,60,0.25)",
    glow: "rgba(231,76,60,0.12)",
    icon: TrendingDown,
    label: "BEARISH",
  },
  neutral: {
    color: "#f5a623",
    bg: "rgba(245,166,35,0.08)",
    border: "rgba(245,166,35,0.25)",
    glow: "rgba(245,166,35,0.12)",
    icon: Minus,
    label: "NEUTRAL",
  },
  // legacy fallback
  buy: {
    color: "#2ecc71",
    bg: "rgba(46,204,113,0.08)",
    border: "rgba(46,204,113,0.25)",
    glow: "rgba(46,204,113,0.12)",
    icon: TrendingUp,
    label: "BULLISH",
  },
  sell: {
    color: "#e74c3c",
    bg: "rgba(231,76,60,0.08)",
    border: "rgba(231,76,60,0.25)",
    glow: "rgba(231,76,60,0.12)",
    icon: TrendingDown,
    label: "BEARISH",
  },
  hold: {
    color: "#f5a623",
    bg: "rgba(245,166,35,0.08)",
    border: "rgba(245,166,35,0.25)",
    glow: "rgba(245,166,35,0.12)",
    icon: Minus,
    label: "NEUTRAL",
  },
};

const TIMEFRAME_LABELS = {
  short: "Short Term · 1-7 days",
  medium: "Medium Term · 1-4 weeks",
  long: "Long Term · 1-6 months",
};

const SENTIMENT_COLOR = {
  bullish: "#2ecc71",
  bearish: "#e74c3c",
  neutral: "#f5a623",
};
const RISK_COLOR = { low: "#2ecc71", medium: "#f5a623", high: "#e74c3c" };

const TREND_CONFIG = {
  strong_uptrend: { color: "#2ecc71", icon: "↑↑", label: "Strong Uptrend" },
  uptrend: { color: "#2ecc71", icon: "↑", label: "Uptrend" },
  sideways: { color: "#f5a623", icon: "→", label: "Sideways" },
  downtrend: { color: "#e74c3c", icon: "↓", label: "Downtrend" },
  strong_downtrend: { color: "#e74c3c", icon: "↓↓", label: "Strong Downtrend" },
  unknown: { color: "var(--text-muted)", icon: "?", label: "Unknown" },
};

const FG_CONFIG = (val) => {
  if (!val && val !== 0)
    return { color: "var(--text-muted)", label: "Unknown", bar: 0 };
  if (val < 25) return { color: "#e74c3c", label: "Extreme Fear", bar: val };
  if (val < 45) return { color: "#e8941a", label: "Fear", bar: val };
  if (val < 55) return { color: "#f5a623", label: "Neutral", bar: val };
  if (val < 75) return { color: "#a8d08d", label: "Greed", bar: val };
  return { color: "#2ecc71", label: "Extreme Greed", bar: val };
};

function getSubColor(sub) {
  if (!sub) return "var(--text-muted)";
  const s = String(sub).toLowerCase();
  if (["bullish", "oversold", "near_lower"].includes(s)) return "#2ecc71";
  if (["bearish", "overbought", "near_upper"].includes(s)) return "#e74c3c";
  return "#f5a623";
}

function RSIGauge({ value }) {
  if (!value) return null;
  const pct = Math.min(Math.max(value, 0), 100);
  const color = value > 70 ? "#e74c3c" : value < 30 ? "#2ecc71" : "#f5a623";
  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          position: "relative",
          height: 6,
          borderRadius: 3,
          backgroundColor: "var(--bg-elevated)",
          display: "flex",
          overflow: "visible",
        }}
      >
        <div
          style={{
            width: "30%",
            height: "100%",
            backgroundColor: "rgba(46,204,113,0.2)",
          }}
        />
        <div
          style={{
            width: "40%",
            height: "100%",
            backgroundColor: "rgba(245,166,35,0.2)",
          }}
        />
        <div
          style={{
            width: "30%",
            height: "100%",
            backgroundColor: "rgba(231,76,60,0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${pct}%`,
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: color,
            border: "2px solid var(--bg-surface)",
            boxShadow: `0 0 6px ${color}`,
            transition: "left 1s ease",
            zIndex: 2,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span style={{ fontSize: 9, color: "#2ecc71" }}>30</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>
          RSI: {value}
        </span>
        <span style={{ fontSize: 9, color: "#e74c3c" }}>70</span>
      </div>
    </div>
  );
}

function BBBar({ position }) {
  if (position === null || position === undefined) return null;
  const raw = position * 100; // gerçek değer (130% olabilir)
  const clamped = Math.min(Math.max(raw, 0), 100); // bar pozisyonu için clamp
  const isAbove = raw > 100;
  const isBelow = raw < 0;
  const color = raw > 80 ? "#e74c3c" : raw < 20 ? "#2ecc71" : "#f5a623";
  const label = isAbove
    ? `BB: ${raw.toFixed(0)}% ↑`
    : isBelow
      ? `BB: ${raw.toFixed(0)}% ↓`
      : `BB: ${raw.toFixed(0)}%`;
  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          position: "relative",
          height: 6,
          borderRadius: 3,
          overflow: "visible",
          background: isAbove
            ? "linear-gradient(to right, var(--bg-elevated) 80%, rgba(231,76,60,0.3) 100%)"
            : isBelow
              ? "linear-gradient(to right, rgba(46,204,113,0.3) 0%, var(--bg-elevated) 20%)"
              : "var(--bg-elevated)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${clamped}%`,
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: color,
            border: "2px solid var(--bg-surface)",
            boxShadow: `0 0 6px ${color}`,
            transition: "left 1s ease",
            outline: isAbove || isBelow ? `2px solid ${color}` : "none",
            outlineOffset: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: "var(--border)",
            opacity: 0.5,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span style={{ fontSize: 9, color: "#2ecc71" }}>Lower</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{label}</span>
        <span style={{ fontSize: 9, color: "#e74c3c" }}>Upper</span>
      </div>
      {isAbove && (
        <div
          style={{
            fontSize: 9,
            color: "#e74c3c",
            marginTop: 2,
            textAlign: "center",
          }}
        >
          Price above upper band — extreme extension
        </div>
      )}
      {isBelow && (
        <div
          style={{
            fontSize: 9,
            color: "#2ecc71",
            marginTop: 2,
            textAlign: "center",
          }}
        >
          Price below lower band — extreme oversold
        </div>
      )}
    </div>
  );
}

function MACDIndicator({ trend }) {
  if (!trend) return null;
  const isBull = trend === "bullish";
  const color = isBull ? "#2ecc71" : "#e74c3c";
  const Icon = isBull ? TrendingUp : TrendingDown;
  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 6,
          backgroundColor: `${color}12`,
          border: `1px solid ${color}30`,
          width: "fit-content",
        }}
      >
        <Icon size={12} style={{ color }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color,
            textTransform: "capitalize",
          }}
        >
          {trend}
        </span>
      </div>
    </div>
  );
}

function EMAIndicator({ trend }) {
  if (!trend || trend === "insufficient_data")
    return (
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
        Insufficient data
      </span>
    );
  const isBull = trend === "bullish";
  const color = isBull ? "#2ecc71" : "#e74c3c";
  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 6,
          backgroundColor: `${color}12`,
          border: `1px solid ${color}30`,
          width: "fit-content",
        }}
      >
        <span style={{ fontSize: 10, color, fontWeight: 700 }}>
          EMA20 {isBull ? ">" : "<"} EMA50
        </span>
      </div>
    </div>
  );
}

// ── YENİ: Market Context Kartı ──────────────────────────────
function MarketContextCard({ marketContext }) {
  if (!marketContext) return null;
  const fg = marketContext.fear_greed || {};
  const trend = marketContext.price_trend || {};
  const volume = marketContext.volume_anomaly || {};
  const news = marketContext.news || {};

  const fgCfg = FG_CONFIG(fg.value);
  const trendCfg = TREND_CONFIG[trend.direction] || TREND_CONFIG.unknown;

  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        padding: "20px",
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Activity size={14} style={{ color: "var(--accent)" }} />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
        >
          Market Context
        </span>
      </div>

      {/* Fear & Greed */}
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Fear & Greed
          </span>
          <span className="text-xs font-bold" style={{ color: fgCfg.color }}>
            {fgCfg.label}
          </span>
        </div>
        {fg.value != null && (
          <>
            <div
              style={{
                position: "relative",
                height: 6,
                borderRadius: 3,
                background:
                  "linear-gradient(to right, #e74c3c, #f5a623, #2ecc71)",
                overflow: "visible",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: `${fg.value}%`,
                  top: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: fgCfg.color,
                  border: "2px solid var(--bg-surface)",
                  boxShadow: `0 0 8px ${fgCfg.color}`,
                  transition: "left 1s ease",
                }}
              />
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: 9, color: "#e74c3c" }}>Fear</span>
              <span
                style={{ fontSize: 11, fontWeight: 900, color: fgCfg.color }}
              >
                {fg.value}
              </span>
              <span style={{ fontSize: 9, color: "#2ecc71" }}>Greed</span>
            </div>
          </>
        )}
      </div>

      {/* 7-Day Trend */}
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            7-Day Trend
          </span>
          <span className="text-xs font-bold" style={{ color: trendCfg.color }}>
            {trendCfg.icon}{" "}
            {trend.change_7d != null
              ? `${trend.change_7d > 0 ? "+" : ""}${trend.change_7d}%`
              : ""}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
          }}
        >
          <div
            style={{
              padding: "3px 10px",
              borderRadius: 6,
              backgroundColor: `${trendCfg.color}12`,
              border: `1px solid ${trendCfg.color}30`,
            }}
          >
            <span
              style={{ fontSize: 11, fontWeight: 700, color: trendCfg.color }}
            >
              {trendCfg.label}
            </span>
          </div>
          {trend.momentum && (
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              · {trend.momentum}
            </span>
          )}
        </div>
      </div>

      {/* Volume */}
      <div
        style={{
          marginBottom: news?.items?.length > 0 ? 16 : 0,
          paddingBottom: news?.items?.length > 0 ? 16 : 0,
          borderBottom:
            news?.items?.length > 0 ? "1px solid var(--border-soft)" : "none",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Volume
          </span>
          <span
            className="text-xs font-bold"
            style={{
              color:
                volume.level === "extreme" || volume.level === "low"
                  ? "#e74c3c"
                  : volume.level === "high"
                    ? "#f5a623"
                    : "#2ecc71",
            }}
          >
            {(volume.level || "—").toUpperCase()}
          </span>
        </div>
        <div
          className="text-xs mt-1"
          style={{ color: "var(--text-muted)", opacity: 0.8, lineHeight: 1.5 }}
        >
          {volume.description || "—"}
        </div>
        {volume.anomaly && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: "rgba(231,76,60,0.1)",
              border: "1px solid rgba(231,76,60,0.2)",
              width: "fit-content",
            }}
          >
            <AlertTriangle size={10} style={{ color: "#e74c3c" }} />
            <span style={{ fontSize: 10, color: "#e74c3c", fontWeight: 600 }}>
              Volume anomaly detected
            </span>
          </div>
        )}
      </div>

      {/* News */}
      {news?.items?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              News Sentiment
            </span>
            <span
              className="text-xs font-bold"
              style={{
                color:
                  news.sentiment?.sentiment === "positive"
                    ? "#2ecc71"
                    : news.sentiment?.sentiment === "negative"
                      ? "#e74c3c"
                      : "#f5a623",
              }}
            >
              {(news.sentiment?.sentiment || "neutral").toUpperCase()}
              {news.sentiment?.score !== undefined
                ? ` (${news.sentiment.score > 0 ? "+" : ""}${news.sentiment.score})`
                : ""}
            </span>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {news.items.slice(0, 4).map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-soft)",
                  }}
                >
                  <div
                    className="text-xs"
                    style={{
                      color: "var(--text-secondary)",
                      lineHeight: 1.4,
                      marginBottom: 3,
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {item.source} · {item.age}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── YENİ: Indicator Breakdown (AI açıklamaları) ─────────────
// ── Bullishness Score Gauge ─────────────────────────────────
function BullishnessGauge({ score }) {
  if (score === null || score === undefined) return null;
  const s = Math.min(Math.max(score, 0), 100);
  const color =
    s >= 75
      ? "#2ecc71"
      : s >= 60
        ? "#a8d08d"
        : s >= 41
          ? "#f5a623"
          : s >= 21
            ? "#e8941a"
            : "#e74c3c";
  const label =
    s >= 75
      ? "Strongly Bullish"
      : s >= 60
        ? "Bullish"
        : s >= 41
          ? "Neutral"
          : s >= 21
            ? "Bearish"
            : "Strongly Bearish";

  // SVG arc gauge
  const radius = 54;
  const cx = 70,
    cy = 70;
  const startAngle = 180;
  const endAngle = 180 + (s / 100) * 180;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(toRad(startAngle));
  const y1 = cy + radius * Math.sin(toRad(startAngle));
  const x2 = cx + radius * Math.cos(toRad(endAngle));
  const y2 = cy + radius * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        padding: "20px",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: 16 }}>📊</span>
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
        >
          Bullishness Score
        </span>
      </div>
      <div className="flex items-center gap-8">
        {/* Gauge SVG — daha büyük viewBox, yazılar çakışmıyor */}
        <div style={{ flexShrink: 0 }}>
          <svg width="130" height="90" viewBox="0 0 140 95">
            {/* Background arc */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="var(--bg-elevated)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Colored arc */}
            {s > 0 && (
              <path
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
              />
            )}
            {/* Score — ortada büyük */}
            <text
              x={cx}
              y={cy + 2}
              textAnchor="middle"
              fill={color}
              style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace" }}
            >
              {s}
            </text>
            {/* /100 — altında küçük */}
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              style={{ fontSize: 9 }}
            >
              / 100
            </text>
            {/* Bear / Bull etiketleri — arc'ın altında, kenarlarda */}
            <text
              x={cx - radius + 2}
              y={cy + 22}
              textAnchor="middle"
              fill="#e74c3c"
              style={{ fontSize: 8, fontWeight: 700 }}
            >
              Bear
            </text>
            <text
              x={cx + radius - 2}
              y={cy + 22}
              textAnchor="middle"
              fill="#2ecc71"
              style={{ fontSize: 8, fontWeight: 700 }}
            >
              Bull
            </text>
          </svg>
        </div>
        {/* Sağ taraf: label + bar */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color,
              marginBottom: 8,
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </div>
          <div
            style={{
              height: 6,
              backgroundColor: "var(--bg-elevated)",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${s}%`,
                background: `linear-gradient(to right, ${color}80, ${color})`,
                borderRadius: 3,
                transition: "width 1.2s ease",
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {s >= 75
              ? "Strong bullish momentum across indicators"
              : s >= 60
                ? "More bullish signals than bearish"
                : s >= 41
                  ? "Mixed signals — no clear direction"
                  : s >= 21
                    ? "Bearish pressure dominates"
                    : "Strong bearish momentum"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Action Tags ──────────────────────────────────────────────
const ACTION_TAG_CONFIG = {
  STRONG_BUY: { color: "#2ecc71", bg: "rgba(46,204,113,0.12)", icon: "🚀" },
  BUY_THE_DIP: { color: "#2ecc71", bg: "rgba(46,204,113,0.10)", icon: "📉➕" },
  WAIT_FOR_BREAKOUT: {
    color: "#f5a623",
    bg: "rgba(245,166,35,0.10)",
    icon: "⏳",
  },
  WAIT_FOR_DIP: { color: "#f5a623", bg: "rgba(245,166,35,0.10)", icon: "⏬" },
  HOLD_AND_MONITOR: {
    color: "#f5a623",
    bg: "rgba(245,166,35,0.08)",
    icon: "👁️",
  },
  TIGHTEN_STOP_LOSS: {
    color: "#e8941a",
    bg: "rgba(232,148,26,0.12)",
    icon: "🛡️",
  },
  TAKE_PARTIAL_PROFIT: {
    color: "#a8d08d",
    bg: "rgba(168,208,141,0.12)",
    icon: "💰",
  },
  TAKE_FULL_PROFIT: {
    color: "#2ecc71",
    bg: "rgba(46,204,113,0.15)",
    icon: "✅",
  },
  REDUCE_POSITION: {
    color: "#e8941a",
    bg: "rgba(232,148,26,0.12)",
    icon: "📊",
  },
  AVOID_ENTRY: { color: "#e74c3c", bg: "rgba(231,76,60,0.12)", icon: "🚫" },
  WATCH_SUPPORT: { color: "#f5a623", bg: "rgba(245,166,35,0.08)", icon: "📍" },
  WATCH_RESISTANCE: {
    color: "#e74c3c",
    bg: "rgba(231,76,60,0.08)",
    icon: "📍",
  },
  HIGH_RISK_WARNING: {
    color: "#e74c3c",
    bg: "rgba(231,76,60,0.15)",
    icon: "⚠️",
  },
};

function ActionTagsCard({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        padding: "20px",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap size={14} style={{ color: "var(--accent)" }} />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
        >
          Recommended Actions
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const cfg = ACTION_TAG_CONFIG[tag] || {
            color: "#f5a623",
            bg: "rgba(245,166,35,0.08)",
            icon: "•",
          };
          return (
            <div
              key={tag}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 20,
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.color}30`,
              }}
            >
              <span style={{ fontSize: 14 }}>{cfg.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: cfg.color,
                  letterSpacing: "0.05em",
                }}
              >
                {tag.replace(/_/g, " ")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IndicatorBreakdownCard({ breakdown, confluence, technicalData }) {
  const items = [
    { key: "rsi", label: "RSI", fallback: technicalData?.rsi_detail },
    { key: "macd", label: "MACD", fallback: technicalData?.macd_detail },
    {
      key: "bollinger_bands",
      label: "Bollinger Bands",
      fallback: technicalData?.bb_detail,
    },
    {
      key: "stochastic",
      label: "Stochastic",
      fallback: technicalData?.stoch_detail,
    },
    {
      key: "ema",
      label: "EMA",
      fallback: technicalData?.ema_trend
        ? `EMA trend: ${technicalData.ema_trend}`
        : null,
    },
  ];
  const hasAnyData = items.some(
    (item) => breakdown?.[item.key] || item.fallback,
  );
  if (!hasAnyData) return null;

  const conf = confluence || {};
  const confColor =
    conf.dominant === "bullish"
      ? "#2ecc71"
      : conf.dominant === "bearish"
        ? "#e74c3c"
        : "#f5a623";

  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        padding: "20px",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} style={{ color: "var(--accent)" }} />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
          >
            Indicator Analysis
          </span>
        </div>
        {conf.dominant && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 20,
              backgroundColor: `${confColor}12`,
              border: `1px solid ${confColor}30`,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: confColor }}>
              {conf.bullish_indicators}B · {conf.bearish_indicators}S
            </span>
            {conf.conflicting && (
              <AlertTriangle size={9} style={{ color: "#f5a623" }} />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {items.map(({ key, label }) => {
          const text = breakdown?.[key] || fallback;
          if (!text) return null;
          const isBull = /bullish|uptrend|oversold|above|rising/i.test(text);
          const isBear =
            /bearish|downtrend|overbought|below|falling|declining/i.test(text);
          const dotColor = isBull ? "#2ecc71" : isBear ? "#e74c3c" : "#f5a623";
          return (
            <div
              key={key}
              style={{
                paddingBottom: 12,
                borderBottom: "1px solid var(--border-soft)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: dotColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                  }}
                >
                  {label}
                </span>
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-muted)", paddingLeft: 14 }}
              >
                {text}
              </p>
            </div>
          );
        })}
      </div>

      {conf.conflicting && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 8,
            backgroundColor: "rgba(245,166,35,0.08)",
            border: "1px solid rgba(245,166,35,0.2)",
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={11} style={{ color: "#f5a623" }} />
            <span style={{ fontSize: 11, color: "#f5a623", fontWeight: 600 }}>
              Mixed signals — indicators conflict. Exercise extra caution.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIAnalysis() {
  const { data: marketData } = useMarket(500);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userInput, setUserInput] = useState({
    entryPrice: "",
    quantity: "",
    positionType: "long",
    riskTolerance: "balanced",
    timeframe: "short",
  });

  const filtered = search.trim()
    ? (marketData || [])
        .filter(
          (c) =>
            c.symbol?.toLowerCase().includes(search.toLowerCase()) ||
            c.name?.toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 8)
    : [];

  async function analyze(overrides = {}) {
    if (!selected) return;
    const input = { ...userInput, ...overrides };
    const isSkipped = !input.entryPrice && !input.quantity;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.get(`/ai/analyze/${selected.slug}`, {
        params: {
          entry_price: input.entryPrice || null,
          quantity: input.quantity || null,
          position_type: input.positionType,
          risk_tolerance: input.riskTolerance,
          timeframe: input.timeframe,
        },
      });
      setResult({ ...res.data, _skipped: isSkipped });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Analysis failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const signalConfig = result ? SIGNAL_CONFIG[result.signal] : null;
  const SignalIcon = signalConfig?.icon;

  return (
    <div
      style={{ color: "var(--text-primary)", maxWidth: 1100, margin: "0 auto" }}
    >
      {/* MODAL */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 998,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              zIndex: 999,
              width: "100%",
              maxWidth: 460,
              padding: "0 16px",
            }}
          >
            <div
              style={{
                background: "rgba(12,12,14,0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, rgba(245,166,35,0.8), transparent)",
                }}
              />
              <div style={{ padding: "24px 24px 20px" }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {selected?.image_url && (
                      <img
                        src={selected.image_url}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.9)",
                        }}
                      >
                        {selected?.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.3)",
                          marginTop: 1,
                        }}
                      >
                        Customize your analysis parameters
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Entry + Quantity */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  {[
                    {
                      key: "entryPrice",
                      label: "Entry Price",
                      placeholder: selected?.current_price?.toFixed(2),
                    },
                    {
                      key: "quantity",
                      label: "Quantity",
                      placeholder: `0.5 ${selected?.symbol?.toUpperCase()}`,
                    },
                  ].map((field) => (
                    <div key={field.key}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.3)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          marginBottom: 6,
                        }}
                      >
                        {field.label}
                      </div>
                      <input
                        type="number"
                        placeholder={field.placeholder}
                        value={userInput[field.key]}
                        onChange={(e) =>
                          setUserInput((p) => ({
                            ...p,
                            [field.key]: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 10,
                          color: "rgba(255,255,255,0.85)",
                          fontSize: 13,
                          outline: "none",
                          caretColor: "var(--accent)",
                          boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "rgba(245,166,35,0.4)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor =
                            "rgba(255,255,255,0.08)")
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Position Type */}
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.3)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Position
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      {
                        key: "long",
                        label: "Long",
                        color: "#2ecc71",
                        icon: TrendingUp,
                      },
                      {
                        key: "short",
                        label: "Short",
                        color: "#e74c3c",
                        icon: TrendingDown,
                      },
                      {
                        key: "watching",
                        label: "Watching",
                        color: "#f5a623",
                        icon: Minus,
                      },
                    ].map((opt) => {
                      const active = userInput.positionType === opt.key;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          onClick={() =>
                            setUserInput((p) => ({
                              ...p,
                              positionType: opt.key,
                            }))
                          }
                          style={{
                            flex: 1,
                            padding: "9px 6px",
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            background: active
                              ? `${opt.color}15`
                              : "rgba(255,255,255,0.04)",
                            color: active
                              ? opt.color
                              : "rgba(255,255,255,0.35)",
                            outline: active
                              ? `1px solid ${opt.color}35`
                              : "1px solid rgba(255,255,255,0.07)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            transition: "all 0.15s",
                          }}
                        >
                          <Icon size={12} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Risk + Timeframe — 2 kolon */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.3)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Risk
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {[
                        { key: "conservative", label: "Conservative" },
                        { key: "balanced", label: "Balanced" },
                        { key: "aggressive", label: "Aggressive" },
                      ].map((opt) => {
                        const active = userInput.riskTolerance === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() =>
                              setUserInput((p) => ({
                                ...p,
                                riskTolerance: opt.key,
                              }))
                            }
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: active ? 600 : 400,
                              cursor: "pointer",
                              border: "none",
                              background: active
                                ? "rgba(245,166,35,0.12)"
                                : "rgba(255,255,255,0.03)",
                              color: active
                                ? "var(--accent)"
                                : "rgba(255,255,255,0.4)",
                              outline: active
                                ? "1px solid rgba(245,166,35,0.3)"
                                : "1px solid rgba(255,255,255,0.06)",
                              textAlign: "left",
                              transition: "all 0.15s",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.3)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Timeframe
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {[
                        { key: "short", label: "1–7 days" },
                        { key: "medium", label: "1–4 weeks" },
                        { key: "long", label: "1–6 months" },
                      ].map((opt) => {
                        const active = userInput.timeframe === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() =>
                              setUserInput((p) => ({
                                ...p,
                                timeframe: opt.key,
                              }))
                            }
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: active ? 600 : 400,
                              cursor: "pointer",
                              border: "none",
                              background: active
                                ? "rgba(245,166,35,0.12)"
                                : "rgba(255,255,255,0.03)",
                              color: active
                                ? "var(--accent)"
                                : "rgba(255,255,255,0.4)",
                              outline: active
                                ? "1px solid rgba(245,166,35,0.3)"
                                : "1px solid rgba(255,255,255,0.06)",
                              textAlign: "left",
                              transition: "all 0.15s",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      analyze();
                    }}
                    style={{
                      flex: 1,
                      padding: "11px",
                      background: "linear-gradient(135deg, #f5a623, #e8941a)",
                      color: "#111",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 4px 20px rgba(245,166,35,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Brain size={15} /> Run Analysis
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      analyze({
                        entryPrice: "",
                        quantity: "",
                        positionType: "long",
                        riskTolerance: "balanced",
                        timeframe: "short",
                      });
                    }}
                    style={{
                      padding: "11px 16px",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.4)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Skip
                  </button>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 10,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                  }}
                >
                  All fields optional · Data stays local
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.05))",
                border: "1px solid rgba(245,166,35,0.3)",
                boxShadow: "0 0 24px rgba(245,166,35,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Brain size={22} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                AI Technical Analysis
              </h1>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Altfins Signals · Groq Llama 3.3 · RSI · MACD · BB · Stochastic
                · EMA · Fear&Greed
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
            }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{
                backgroundColor: "rgba(231,76,60,0.08)",
                border: "1px solid rgba(231,76,60,0.2)",
                color: "#e74c3c",
              }}
            >
              <AlertTriangle size={12} style={{ color: "#e74c3c" }} />
              <span style={{ fontWeight: 700 }}>Not financial advice.</span>
              <span style={{ opacity: 0.8 }}>Technical analysis only.</span>
            </div>
            <button
              onClick={() =>
                localStorage.removeItem("cryptoneko_disclaimer_accepted_v1") ||
                window.location.reload()
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 10,
                color: "var(--text-muted)",
                opacity: 0.5,
                textDecoration: "underline",
              }}
            >
              Review disclaimer
            </button>
          </div>
        </div>
      </div>

      {/* COİN SEÇİCİ */}
      <div style={{ marginBottom: 24, position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 6px 6px 16px",
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${showDropdown ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 16,
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: showDropdown
              ? "0 0 0 3px rgba(245,166,35,0.06)"
              : "none",
          }}
        >
          {/* Left: coin icon or search icon */}
          {selected && !search ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              {selected.image_url ? (
                <img
                  src={selected.image_url}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(245,166,35,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--accent)",
                  }}
                >
                  {selected.symbol?.slice(0, 1)}
                </div>
              )}
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.9)",
                    lineHeight: 1.2,
                  }}
                >
                  {selected.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "monospace",
                  }}
                >
                  {selected.symbol?.toUpperCase()} ·{" "}
                  {formatPrice(selected.current_price)}
                  <span
                    style={{
                      marginLeft: 6,
                      color:
                        Number(selected.price_change_percentage_24h) >= 0
                          ? "#2ecc71"
                          : "#e74c3c",
                    }}
                  >
                    {Number(selected.price_change_percentage_24h) >= 0
                      ? "+"
                      : ""}
                    {Number(selected.price_change_percentage_24h || 0).toFixed(
                      2,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <Search
              size={16}
              style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}
            />
          )}

          {/* Input */}
          <input
            type="text"
            placeholder={
              selected && !search ? "" : "Search coin — BTC, ETH, SOL..."
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              setShowDropdown(true);
              setSearch("");
            }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "rgba(255,255,255,0.8)",
              caretColor: "var(--accent)",
              padding: "10px 0",
            }}
          />

          {/* Clear button */}
          {selected && (
            <button
              onClick={() => {
                setSelected(null);
                setSearch("");
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer",
                color: "rgba(255,255,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 14,
              }}
            >
              ×
            </button>
          )}

          {/* Analyze button */}
          <button
            onClick={() => {
              if (selected) setShowModal(true);
            }}
            disabled={!selected || loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 20px",
              borderRadius: 12,
              flexShrink: 0,
              background:
                selected && !loading
                  ? "linear-gradient(135deg, #f5a623, #e8941a)"
                  : "rgba(255,255,255,0.04)",
              color: selected && !loading ? "#111" : "rgba(255,255,255,0.2)",
              border: "none",
              cursor: selected && !loading ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 700,
              boxShadow:
                selected && !loading
                  ? "0 4px 16px rgba(245,166,35,0.3)"
                  : "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (selected && !loading) {
                e.currentTarget.style.boxShadow =
                  "0 6px 24px rgba(245,166,35,0.5)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                selected && !loading
                  ? "0 4px 16px rgba(245,166,35,0.3)"
                  : "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? (
              <>
                <Loader
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Analyzing...
              </>
            ) : (
              <>
                <Brain size={13} /> Analyze
              </>
            )}
          </button>
        </div>

        {/* Dropdown */}
        {showDropdown && filtered.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: "rgba(10,10,14,0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
              overflow: "hidden",
              zIndex: 50,
            }}
          >
            <div style={{ padding: "6px" }}>
              {filtered.map((coin, i) => (
                <div
                  key={coin.symbol}
                  onClick={() => {
                    setSelected(coin);
                    setSearch("");
                    setShowDropdown(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {coin.image_url ? (
                    <img
                      src={coin.image_url}
                      style={{ width: 32, height: 32, borderRadius: "50%" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(245,166,35,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--accent)",
                      }}
                    >
                      {coin.symbol?.slice(0, 1)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.9)",
                      }}
                    >
                      {coin.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "monospace",
                      }}
                    >
                      {coin.symbol?.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {formatPrice(coin.current_price)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        color:
                          Number(coin.price_change_percentage_24h) >= 0
                            ? "#2ecc71"
                            : "#e74c3c",
                      }}
                    >
                      {Number(coin.price_change_percentage_24h) >= 0 ? "+" : ""}
                      {Number(coin.price_change_percentage_24h || 0).toFixed(2)}
                      %
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="p-4 rounded-xl text-sm mb-6"
          style={{
            backgroundColor: "rgba(231,76,60,0.1)",
            border: "1px solid rgba(231,76,60,0.3)",
            color: "var(--negative)",
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            padding: "64px 24px",
          }}
        >
          <div style={{ position: "relative", marginBottom: 20 }}>
            <Brain size={36} style={{ color: "var(--accent)", opacity: 0.4 }} />
            <div
              style={{
                position: "absolute",
                inset: -10,
                border: "2px solid rgba(245,166,35,0.2)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Analyzing {selected?.name}...
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Fetching signals · Fear & Greed · 7-day trend · Volume
          </div>
        </div>
      )}

      {result && signalConfig && !loading && (
        <div className="flex flex-col gap-4">
          {/* ANA SİNYAL */}
          <div
            className="rounded-2xl relative overflow-hidden"
            style={{
              backgroundColor: signalConfig.bg,
              border: `1px solid ${signalConfig.border}`,
              padding: "32px 36px",
              boxShadow: `0 0 60px ${signalConfig.glow}`,
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -60,
                top: -60,
                width: 280,
                height: 280,
                borderRadius: "50%",
                backgroundColor: signalConfig.glow,
                filter: "blur(60px)",
                pointerEvents: "none",
              }}
            />
            <div className="flex items-center justify-between flex-wrap gap-8 relative">
              <div className="flex items-center gap-6">
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    backgroundColor: `${signalConfig.color}15`,
                    border: `2px solid ${signalConfig.color}35`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 30px ${signalConfig.color}25`,
                  }}
                >
                  <SignalIcon size={36} style={{ color: signalConfig.color }} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      color: `${signalConfig.color}bb`,
                      marginBottom: 4,
                    }}
                  >
                    TECHNICAL OUTLOOK
                  </div>
                  <div
                    style={{
                      fontSize: 72,
                      fontWeight: 900,
                      color: signalConfig.color,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {signalConfig.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{result.coin?.name}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {formatPrice(result.coin?.current_price)}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color:
                          result.coin?.change_24h >= 0 ? "#2ecc71" : "#e74c3c",
                      }}
                    >
                      {result.coin?.change_24h >= 0 ? "+" : ""}
                      {result.coin?.change_24h?.toFixed(2)}%
                    </span>
                  </div>
                  {result.timeframe && !result._skipped && (
                    <div
                      style={{
                        marginTop: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: `${signalConfig.color}10`,
                        border: `1px solid ${signalConfig.color}25`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: signalConfig.color,
                          fontWeight: 600,
                        }}
                      >
                        {TIMEFRAME_LABELS[result.timeframe] || result.timeframe}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-10">
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "var(--text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    CONFIDENCE
                  </div>
                  <div
                    style={{
                      fontSize: 52,
                      fontWeight: 900,
                      fontFamily: "monospace",
                      color: signalConfig.color,
                      lineHeight: 1,
                    }}
                  >
                    {result.confidence}
                    <span style={{ fontSize: 28 }}>%</span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      height: 4,
                      backgroundColor: `${signalConfig.color}20`,
                      borderRadius: 2,
                      width: 100,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${result.confidence}%`,
                        backgroundColor: signalConfig.color,
                        borderRadius: 2,
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 80,
                    backgroundColor: `${signalConfig.color}20`,
                  }}
                />
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "var(--text-muted)",
                      marginBottom: 10,
                    }}
                  >
                    SENTIMENT
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      padding: "8px 18px",
                      borderRadius: 30,
                      backgroundColor: `${SENTIMENT_COLOR[result.sentiment]}15`,
                      color: SENTIMENT_COLOR[result.sentiment],
                      border: `1px solid ${SENTIMENT_COLOR[result.sentiment]}40`,
                      textTransform: "uppercase",
                    }}
                  >
                    {result.sentiment}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KİŞİSEL TAVSİYE */}
          {result.personalized_advice && (
            <div
              className="rounded-2xl"
              style={{
                backgroundColor: "rgba(245,166,35,0.06)",
                border: "1px solid rgba(245,166,35,0.2)",
                padding: "20px",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} style={{ color: "var(--accent)" }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--accent)", letterSpacing: "0.08em" }}
                >
                  Personalized Advice
                </span>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-line",
                }}
              >
                {result.personalized_advice}
              </p>
              {(result.stop_loss || result.take_profit) && (
                <div className="flex items-center gap-6 mt-4">
                  {result.stop_loss && (
                    <div>
                      <div
                        className="text-xs mb-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Stop Loss
                      </div>
                      <div
                        className="text-sm font-bold font-mono"
                        style={{ color: "#e74c3c" }}
                      >
                        {formatPrice(result.stop_loss)}
                      </div>
                    </div>
                  )}
                  {result.take_profit && (
                    <div>
                      <div
                        className="text-xs mb-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Take Profit
                      </div>
                      <div
                        className="text-sm font-bold font-mono"
                        style={{ color: "#2ecc71" }}
                      >
                        {formatPrice(result.take_profit)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SATIR 1: Technical + AI Summary + Risk/Levels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Technical Indicators */}
            <div
              className="rounded-2xl"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                padding: "20px",
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Zap size={14} style={{ color: "var(--accent)" }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                  }}
                >
                  Technical Indicators
                </span>
              </div>
              {[
                {
                  label: "RSI",
                  signal: result.technical_data?.rsi_signal,
                  detail: result.technical_data?.rsi_detail,
                  extra: <RSIGauge value={result.technical_data?.rsi} />,
                },
                {
                  label: "MACD",
                  signal: result.technical_data?.macd_trend,
                  detail: result.technical_data?.macd_detail,
                  extra: (
                    <MACDIndicator trend={result.technical_data?.macd_trend} />
                  ),
                },
                {
                  label: "Bollinger Bands",
                  signal: result.technical_data?.bb_signal,
                  detail: result.technical_data?.bb_detail,
                  extra: (
                    <BBBar position={result.technical_data?.bb_position} />
                  ),
                },
                {
                  label: "Stochastic",
                  signal: result.technical_data?.stoch_signal,
                  detail: result.technical_data?.stoch_detail,
                  extra: null,
                },
              ].map(({ label, signal, detail, extra }) => (
                <div
                  key={label}
                  style={{
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottom: "1px solid var(--border-soft)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {label}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: getSubColor(signal) }}
                    >
                      {signal?.replace(/_/g, " ") || "—"}
                    </span>
                  </div>
                  {detail && (
                    <div
                      className="text-xs mt-1"
                      style={{ color: "var(--text-muted)", opacity: 0.7 }}
                    >
                      {detail}
                    </div>
                  )}
                  {extra}
                </div>
              ))}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    EMA Trend
                  </span>
                </div>
                <EMAIndicator trend={result.technical_data?.ema_trend} />
              </div>
              <div
                className="text-center mt-5"
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  opacity: 0.6,
                }}
              >
                {result.technical_data?.data_points} data points
              </div>
            </div>

            {/* AI Summary */}
            <div
              className="rounded-2xl"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                padding: "20px",
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Brain size={14} style={{ color: "var(--accent)" }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                  }}
                >
                  AI Summary
                </span>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {result.summary}
              </p>
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                  }}
                >
                  Key Factors
                </div>
                <div className="flex flex-col gap-2.5">
                  {result.key_factors?.map((factor, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span
                        style={{
                          color: "var(--accent)",
                          marginTop: 1,
                          flexShrink: 0,
                          fontWeight: 700,
                        }}
                      >
                        →
                      </span>
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk + Key Levels */}
            <div className="flex flex-col gap-4">
              <div
                className="rounded-2xl"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  padding: "20px",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={14} style={{ color: "var(--accent)" }} />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Risk Level
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    color: RISK_COLOR[result.risk_level],
                    marginBottom: 8,
                  }}
                >
                  {result.risk_level}
                </div>
                <div
                  style={{
                    height: 6,
                    backgroundColor: "var(--bg-elevated)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 3,
                      width:
                        result.risk_level === "low"
                          ? "25%"
                          : result.risk_level === "medium"
                            ? "60%"
                            : "92%",
                      backgroundColor: RISK_COLOR[result.risk_level],
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>

              <div
                className="rounded-2xl flex-1"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  padding: "20px",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Target size={14} style={{ color: "var(--accent)" }} />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Key Levels
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    {
                      label: "Resistance",
                      value: result.resistance_level,
                      color: "#e74c3c",
                    },
                    {
                      label: "Current",
                      value: result.coin?.current_price,
                      color: "var(--text-primary)",
                      bold: true,
                    },
                    {
                      label: "Support",
                      value: result.support_level,
                      color: "#2ecc71",
                    },
                  ].map(({ label, value, color, bold }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs"
                          style={{
                            color: bold
                              ? "var(--text-secondary)"
                              : "var(--text-muted)",
                            fontWeight: bold ? 600 : 400,
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: bold ? 15 : 13,
                            fontWeight: bold ? 900 : 700,
                            color,
                          }}
                        >
                          {value ? formatPrice(value) : "—"}
                        </span>
                      </div>
                      {!bold && (
                        <div
                          style={{
                            height: 1,
                            backgroundColor: "var(--border-soft)",
                            marginTop: 8,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SATIR 2: Bullishness + Action Tags */}
          {(result.bullishness_score !== undefined ||
            result.action_tags?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BullishnessGauge score={result.bullishness_score} />
              <ActionTagsCard tags={result.action_tags} />
            </div>
          )}

          {/* SATIR 3: Market Context + Indicator Breakdown */}
          {(result.market_context || result.indicator_breakdown) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MarketContextCard marketContext={result.market_context} />
              <IndicatorBreakdownCard
                breakdown={result.indicator_breakdown}
                confluence={result.technical_data?.confluence}
                technicalData={result.technical_data}
              />
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
