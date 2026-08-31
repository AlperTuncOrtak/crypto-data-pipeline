import { TrendingUp, TrendingDown } from "lucide-react";

// AIAnalysis.tsx'ten cikarildi — hem /ai-analysis sayfasi hem de coin slug
// sayfasindaki AIAnalysisBox ayni gostergeleri kullaniyor.

export function getSubColor(sub) {
  if (!sub) return "var(--text-muted)";
  const s = String(sub).toLowerCase();
  if (["bullish", "oversold", "near_lower"].includes(s)) return "var(--positive)";
  if (["bearish", "overbought", "near_upper"].includes(s)) return "var(--negative)";
  return "var(--accent)";
}

export function RSIGauge({ value }) {
  if (!value) return null;
  const pct = Math.min(Math.max(value, 0), 100);
  const color = value > 70 ? "var(--negative)" : value < 30 ? "var(--positive)" : "var(--accent)";
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
            backgroundColor: "var(--accent-soft)",
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
        <span style={{ fontSize: 9, color: "var(--positive)" }}>30</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>
          RSI: {value}
        </span>
        <span style={{ fontSize: 9, color: "var(--negative)" }}>70</span>
      </div>
    </div>
  );
}

export function BBBar({ position }) {
  if (position === null || position === undefined) return null;
  const raw = position * 100; // gerçek değer (130% olabilir)
  const clamped = Math.min(Math.max(raw, 0), 100); // bar pozisyonu için clamp
  const isAbove = raw > 100;
  const isBelow = raw < 0;
  const color = raw > 80 ? "var(--negative)" : raw < 20 ? "var(--positive)" : "var(--accent)";
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
        <span style={{ fontSize: 9, color: "var(--positive)" }}>Lower</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{label}</span>
        <span style={{ fontSize: 9, color: "var(--negative)" }}>Upper</span>
      </div>
      {isAbove && (
        <div
          style={{
            fontSize: 9,
            color: "var(--negative)",
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
            color: "var(--positive)",
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

export function MACDIndicator({ trend }) {
  if (!trend) return null;
  const isBull = trend === "bullish";
  const color = isBull ? "var(--positive)" : "var(--negative)";
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

export function EMAIndicator({ trend }) {
  if (!trend || trend === "insufficient_data")
    return (
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
        Insufficient data
      </span>
    );
  const isBull = trend === "bullish";
  const color = isBull ? "var(--positive)" : "var(--negative)";
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
