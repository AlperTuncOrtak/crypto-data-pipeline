// ============================================================
// components/market/MarketOracle.jsx
// ============================================================
// Market Oracle — Sentiment & AI Gossip Radar
//
// Live data: GET /oracle-feed
//   Reddit r/CryptoCurrency + CoinDesk + Cointelegraph RSS
//   → AI (Groq → Gemini → static) produces sentiment + insights
//
// Each insight card is clickable → opens original source URL.
// Design tokens: identical to FearGreedGauge & CoinListCard.
// ============================================================
import { useState, useEffect } from "react";
import {
  Radio,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useOracle } from "../../hooks/useOracle";

// ---------------------------------------------------------------------------
// Sentiment colour helpers — mirrors FearGreedGauge logic exactly
// ---------------------------------------------------------------------------
function getSentimentStyle(score) {
  if (score <= 20) return { color: "#e74c3c", bg: "rgba(231,76,60,0.1)",  label: "Extreme Fear" };
  if (score <= 40) return { color: "#e67e22", bg: "rgba(230,126,34,0.1)", label: "Fear" };
  if (score <= 60) return { color: "#f5a623", bg: "rgba(245,166,35,0.1)", label: "Neutral" };
  if (score <= 80) return { color: "#2ecc71", bg: "rgba(46,204,113,0.1)", label: "Greed" };
  return            { color: "#27ae60", bg: "rgba(39,174,96,0.1)",         label: "Extreme Greed" };
}

// ---------------------------------------------------------------------------
// Direction icon
// ---------------------------------------------------------------------------
function DirectionIcon({ direction }) {
  if (direction === "bullish")
    return <TrendingUp  size={12} style={{ color: "var(--positive)" }} />;
  if (direction === "bearish")
    return <TrendingDown size={12} style={{ color: "var(--negative)" }} />;
  return <Minus size={12} style={{ color: "var(--text-muted)" }} />;
}

// ---------------------------------------------------------------------------
// Coin badge — accent gold, only shown when AI identified a specific coin
// ---------------------------------------------------------------------------
function CoinBadge({ coin }) {
  if (!coin) return null;
  return (
    <span
      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: "rgba(245,166,35,0.12)",
        color:           "var(--accent)",
        border:          "1px solid rgba(245,166,35,0.35)",
        letterSpacing:   "0.06em",
      }}
    >
      {coin}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Category tag badge — muted grey, same as before
// ---------------------------------------------------------------------------
function TagBadge({ tag }) {
  return (
    <span
      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: "var(--bg-elevated)",
        color:           "var(--text-muted)",
        border:          "1px solid var(--border)",
        letterSpacing:   "0.06em",
      }}
    >
      {tag}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pulsing "live" dot
// ---------------------------------------------------------------------------
function LiveDot() {
  return (
    <span className="relative flex items-center justify-center w-2 h-2 shrink-0">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <span
        className="relative inline-flex rounded-full w-1.5 h-1.5"
        style={{ backgroundColor: "var(--accent)" }}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton row — matches CoinListCard loading pattern
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div style={{ padding: "10px 0" }}>
      <div
        className="h-3 rounded animate-pulse mb-2"
        style={{ width: "40%", backgroundColor: "var(--bg-elevated)" }}
      />
      <div
        className="h-4 rounded animate-pulse"
        style={{ width: "90%", backgroundColor: "var(--bg-elevated)" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function MarketOracle() {
  const { data, isLoading, isError, isFetching, refetch } = useOracle();

  // Refresh spin animation
  const [spinning, setSpinning] = useState(false);
  const handleRefresh = () => {
    setSpinning(true);
    refetch();
    setTimeout(() => setSpinning(false), 700);
  };

  // Auto-spin when background fetch is running
  useEffect(() => {
    if (isFetching) setSpinning(true);
    else setTimeout(() => setSpinning(false), 400);
  }, [isFetching]);

  const sentiment     = data?.sentiment;
  const insights      = data?.insights || [];
  const score         = sentiment?.score ?? 50;
  const sentimentStyle = getSentimentStyle(score);

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border:          "1px solid var(--border)",
        borderRadius:    "12px",
        padding:         "20px",
      }}
    >
      {/* ── HEADER ──────────────────────────────────────── */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 16 }}
      >
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: "var(--accent)" }} />
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
          >
            Market Oracle
          </h3>
          {!isLoading && <LiveDot />}
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center justify-center w-6 h-6 rounded-lg transition-colors"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border:          "1px solid var(--border)",
            color:           "var(--text-muted)",
            cursor:          "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color        = "var(--accent)";
            e.currentTarget.style.borderColor  = "rgba(245,166,35,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color        = "var(--text-muted)";
            e.currentTarget.style.borderColor  = "var(--border)";
          }}
          title="Refresh oracle feed"
        >
          <RefreshCw
            size={11}
            style={{
              transition: "transform 0.6s ease",
              transform:  spinning ? "rotate(360deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </div>

      {/* ── SENTIMENT GAUGE ─────────────────────────────── */}
      {isLoading ? (
        <div
          className="rounded-lg animate-pulse"
          style={{
            height:          72,
            backgroundColor: "var(--bg-elevated)",
            marginBottom:    16,
          }}
        />
      ) : isError ? (
        <div
          className="rounded-lg flex items-center justify-center"
          style={{
            height:          72,
            backgroundColor: "var(--bg-elevated)",
            marginBottom:    16,
            color:           "var(--negative)",
            fontSize:        12,
          }}
        >
          Unable to load sentiment data
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {/* Score row */}
          <div className="flex items-end gap-3" style={{ marginBottom: 10 }}>
            <div
              className="text-4xl font-bold font-mono leading-none"
              style={{
                color:      sentimentStyle.color,
                transition: "color 0.8s ease",
              }}
            >
              {score}
            </div>
            <div
              className="flex flex-col pb-0.5"
              style={{ color: "var(--text-muted)", fontSize: 11 }}
            >
              <span>/ 100</span>
              <span style={{ marginTop: 1 }}>index</span>
            </div>
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: sentimentStyle.bg,
                color:           sentimentStyle.color,
                transition:      "all 0.8s ease",
              }}
            >
              {sentiment?.label}
            </span>
          </div>

          {/* Progress track — identical to FearGreedGauge */}
          <div
            className="relative rounded-full overflow-hidden"
            style={{
              height:          6,
              backgroundColor: "var(--bg-elevated)",
              marginBottom:    6,
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, #e74c3c 0%, #e67e22 25%, #f5a623 50%, #2ecc71 75%, #27ae60 100%)",
                opacity:    0.3,
              }}
            />
            <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width:      `${score}%`,
                background: `linear-gradient(90deg, #e74c3c, ${sentimentStyle.color})`,
                transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg"
              style={{
                left:            `calc(${score}% - 6px)`,
                backgroundColor: sentimentStyle.color,
                border:          "2px solid var(--bg-surface)",
                transition:      "left 1s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </div>

          {/* Axis labels */}
          <div className="flex justify-between">
            <span style={{ fontSize: 10, color: "#e74c3c" }}>Extreme Fear</span>
            <span style={{ fontSize: 10, color: "#27ae60" }}>Extreme Greed</span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", marginBottom: 16 }} />

      {/* ── AI GOSSIP RADAR ─────────────────────────────── */}
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <Sparkles size={12} style={{ color: "var(--accent)" }} />
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
        >
          AI Gossip Radar
        </span>
        <span
          className="ml-auto text-[10px]"
          style={{ color: "var(--text-muted)" }}
        >
          Reddit · RSS
        </span>
      </div>

      {isLoading ? (
        <div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : isError ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Could not load insights. Check back in a moment.
        </p>
      ) : (
        <ul className="space-y-0">
          {insights.map((item, idx) => (
            <li
              key={item.id}
              style={{
                borderTop: idx === 0 ? "none" : "1px solid var(--border-soft)",
                padding:   "10px 0",
              }}
            >
              {/* Coin + Tag + direction + source */}
              <div
                className="flex items-center gap-1.5"
                style={{ marginBottom: 5 }}
              >
                <DirectionIcon direction={item.direction} />
                <CoinBadge coin={item.coin} />
                <TagBadge tag={item.tag} />
                <span
                  className="text-[10px] truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.source}
                </span>
                <span
                  className="ml-auto text-[10px] shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.age}
                </span>
              </div>

              {/* Insight text — clickable if URL present */}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-1"
                  style={{ textDecoration: "none" }}
                >
                  <p
                    className="text-xs leading-relaxed flex-1 transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--accent)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-secondary)")
                    }
                  >
                    {item.text}
                  </p>
                  <ExternalLink
                    size={10}
                    className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--accent)" }}
                  />
                </a>
              ) : (
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── FOOTER ──────────────────────────────────────── */}
      {!isLoading && !isError && (
        <div
          className="flex items-center justify-between mt-3"
          style={{
            borderTop:  "1px solid var(--border-soft)",
            paddingTop: 10,
          }}
        >
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            Powered by Groq · Reddit · RSS
          </span>
          {sentiment?.updated_at && (
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              {new Date(sentiment.updated_at).toLocaleTimeString([], {
                hour:   "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
