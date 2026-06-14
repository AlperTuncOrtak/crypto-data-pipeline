import React from "react";
import { useSpikes } from "../../hooks/useSpikes";
import { Activity, Zap, TrendingUp, AlertTriangle } from "lucide-react";

// ---------------------------------------------------------------------------
// Pulsing "live" dot (reused pattern)
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
// Skeleton row matching the other cards
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div className="flex justify-between gap-4" style={{ padding: "10px 0" }}>
      <div
        className="h-4 rounded animate-pulse"
        style={{ width: "60%", backgroundColor: "var(--bg-elevated)" }}
      />
      <div
        className="h-4 rounded animate-pulse"
        style={{ width: "20%", backgroundColor: "var(--bg-elevated)" }}
      />
    </div>
  );
}

export default function VolumeSpikeRadar() {
  const { data: spikes, isLoading } = useSpikes(6);

  const formatCurrency = (val) => {
    if (!val) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div
      className="group"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        transform: 'translateZ(0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.01)";
        e.currentTarget.style.borderColor = "var(--accent-border)";
        e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
        const glow = e.currentTarget.querySelector('.feat-bg-glow');
        if (glow) { glow.style.transform = "scale(1.5) translate(-10px, 10px)"; glow.style.opacity = "1"; }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.backgroundColor = "var(--bg-card)";
        const glow = e.currentTarget.querySelector('.feat-bg-glow');
        if (glow) { glow.style.transform = "scale(1)"; glow.style.opacity = "0"; }
      }}
    >
      <div className="feat-bg-glow" style={{
        position: "absolute", top: -20, right: -20, width: 140, height: 140,
        borderRadius: "50%", background: `radial-gradient(circle, rgba(251, 17, 142, 0.15) 0%, transparent 70%)`,
        filter: "blur(20px)", pointerEvents: "none", zIndex: 0,
        transform: "scale(1)", opacity: 0,
        transition: "all .6s cubic-bezier(0.25, 1, 0.5, 1)",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* ── HEADER ──────────────────────────────────────── */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 16 }}
      >
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: "#FB118E" }} />
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
          >
            Flash Radar
          </h3>
          {!isLoading && <LiveDot />}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <div>
        {isLoading ? (
          <div className="space-y-1">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : !spikes || spikes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Zap size={24} style={{ color: "var(--border-soft)", marginBottom: 8 }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No recent volume anomalies.
            </p>
          </div>
        ) : (
          <ul className="space-y-0">
            {spikes.map((spike, idx) => {
              const isExtreme = spike.severity === "extreme";
              return (
                <li
                  key={`${spike.symbol}-${spike.timestamp}-${idx}`}
                  className="flex items-center justify-between transition-colors"
                  style={{
                    borderTop: idx === 0 ? "none" : "1px solid var(--border-soft)",
                    padding: "10px 0",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(245,166,35,0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  {/* Left: Icon & Coin */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                      style={{
                        backgroundColor: isExtreme
                          ? "rgba(251,17,142,0.1)"
                          : "rgba(59,130,246,0.1)",
                        color: isExtreme ? "#FB118E" : "#3b82f6",
                      }}
                    >
                      {isExtreme ? (
                        <AlertTriangle size={14} />
                      ) : (
                        <TrendingUp size={14} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono font-bold text-sm"
                          style={{ color: "var(--accent)" }}
                        >
                          {spike.symbol}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {formatTimeAgo(spike.timestamp)}
                        </span>
                      </div>
                      {spike.price && (
                        <span
                          className="text-[11px] font-mono"
                          style={{ color: "var(--text-primary)" }}
                        >
                          ${spike.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Multiplier & Volume */}
                  <div className="text-right">
                    <div
                      className="text-sm font-bold font-mono"
                      style={{ color: isExtreme ? "#FB118E" : "var(--positive)" }}
                    >
                      {spike.multiplier.toFixed(1)}x Vol
                    </div>
                    <div
                      className="text-[10px] whitespace-nowrap mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      avg {formatCurrency(spike.avg_volume)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </div>
    </div>
  );
}
