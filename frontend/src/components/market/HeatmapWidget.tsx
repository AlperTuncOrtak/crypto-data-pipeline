import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMarket } from "../../hooks/useMarket";
import { LayoutGrid } from "lucide-react";

function changeColor(pct) {
  const p = Number(pct) || 0;
  if (p >= 10) return { bg: "rgba(46, 204, 113, 0.4)", text: "#fff", border: "rgba(46, 204, 113, 0.6)" };
  if (p >= 5) return { bg: "rgba(46, 204, 113, 0.25)", text: "#fff", border: "rgba(46, 204, 113, 0.4)" };
  if (p >= 0) return { bg: "rgba(46, 204, 113, 0.1)", text: "#fff", border: "rgba(46, 204, 113, 0.2)" };
  if (p >= -5) return { bg: "rgba(231, 76, 60, 0.15)", text: "#fff", border: "rgba(231, 76, 60, 0.3)" };
  if (p >= -10) return { bg: "rgba(231, 76, 60, 0.3)", text: "#fff", border: "rgba(231, 76, 60, 0.5)" };
  return { bg: "rgba(231, 76, 60, 0.5)", text: "#fff", border: "rgba(231, 76, 60, 0.7)" };
}

function fmtPct(n) {
  const v = Number(n);
  if (isNaN(v)) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function squarify(items, x, y, w, h) {
  if (!items.length) return [];
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0 || w <= 0 || h <= 0) return [];

  const result = [];
  let remaining = [...items];
  let rx = x, ry = y, rw = w, rh = h;

  while (remaining.length) {
    const isWide = rw >= rh;
    const side = isWide ? rh : rw;
    const remSum = remaining.reduce((s, i) => s + i.value, 0);

    let row = [];
    let rowSum = 0;
    let prevWorst = Infinity;

    for (const item of remaining) {
      const candidate = [...row, item];
      const candSum = rowSum + item.value;
      const worst = Math.max(
        ...candidate.map((i) => {
          const frac = i.value / candSum;
          const len = (candSum / remSum) * (isWide ? rw : rh);
          const breadth = frac * side;
          const r = len / breadth;
          return Math.max(r, 1 / r);
        }),
      );
      if (row.length && worst > prevWorst) break;
      row.push(item);
      rowSum += item.value;
      prevWorst = worst;
    }

    const rowFrac = rowSum / remSum;
    const rowLen = isWide ? rw * rowFrac : rh * rowFrac;

    let cursor = 0;
    for (const item of row) {
      const frac = item.value / rowSum;
      const breadth = frac * side;
      result.push({
        ...item,
        x: isWide ? rx : rx + cursor,
        y: isWide ? ry + cursor : ry,
        w: isWide ? rowLen : breadth,
        h: isWide ? breadth : rowLen,
      });
      cursor += breadth;
    }

    if (isWide) { rx += rowLen; rw -= rowLen; } 
    else { ry += rowLen; rh -= rowLen; }
    remaining = remaining.slice(row.length);
  }
  return result;
}

export default function HeatmapWidget({ limit = 50 }) {
  const navigate = useNavigate();
  const market = useMarket(200);
  const [hoveredCell, setHoveredCell] = useState(null);

  const coins = useMemo(() => {
    if (!market.data) return [];
    return market.data
      .filter((c) => Number(c.market_cap) > 0 && Number(c.current_price) > 0)
      .slice(0, limit);
  }, [market.data, limit]);

  const CONTAINER_W = 800;
  const CONTAINER_H = 400;

  const cells = useMemo(() => {
    const items = coins.map((c) => ({
      ...c,
      value: Number(c.market_cap) || 1,
    }));
    return squarify(items, 0, 0, CONTAINER_W, CONTAINER_H);
  }, [coins]);

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
        position: "absolute", top: -20, right: -20, width: 200, height: 200,
        borderRadius: "50%", background: `radial-gradient(circle, rgba(46, 204, 113, 0.1) 0%, transparent 70%)`,
        filter: "blur(20px)", pointerEvents: "none", zIndex: 0,
        transform: "scale(1)", opacity: 0,
        transition: "all .6s cubic-bezier(0.25, 1, 0.5, 1)",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <LayoutGrid size={13} style={{ color: "var(--text-muted)" }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Market Heatmap (Top {limit})
            </span>
          </div>
          <span
            onClick={() => navigate("/heatmap")}
            style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer", fontWeight: 600, opacity: 0.7, transition: "opacity 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.7)}
          >
            Full map →
          </span>
        </div>

        {/* Treemap SVG */}
        <div style={{
          position: "relative",
          width: "100%",
          paddingBottom: `${(CONTAINER_H / CONTAINER_W) * 100}%`,
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)"
        }}>
          {market.isLoading ? (
             <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12 }}>Loading...</div>
          ) : (
            <svg
              viewBox={`0 0 ${CONTAINER_W} ${CONTAINER_H}`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              {cells.map((cell) => {
                const colors = changeColor(cell.price_change_percentage_24h);
                const isHovered = hoveredCell === cell.symbol;
                const showSymbol = cell.w > 30 && cell.h > 20;
                const showPct = cell.w > 40 && cell.h > 35;
                const fontSize = Math.max(8, Math.min(16, Math.min(cell.w / 4, cell.h / 3)));

                return (
                  <g
                    key={cell.symbol}
                    onClick={() => cell.slug && navigate(`/coin/${cell.slug}`)}
                    onMouseEnter={() => setHoveredCell(cell.symbol)}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      x={cell.x + 1}
                      y={cell.y + 1}
                      width={Math.max(0, cell.w - 2)}
                      height={Math.max(0, cell.h - 2)}
                      rx={6}
                      fill={isHovered ? colors.border : colors.bg}
                      stroke={colors.border}
                      strokeWidth={isHovered ? 2 : 1}
                      style={{ transition: "all 0.2s ease" }}
                    />
                    {showSymbol && (
                      <text
                        x={cell.x + cell.w / 2}
                        y={showPct ? cell.y + cell.h / 2 - fontSize * 0.6 : cell.y + cell.h / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fff"
                        fontSize={fontSize}
                        fontWeight="bold"
                        fontFamily="monospace"
                        style={{ pointerEvents: "none" }}
                      >
                        {cell.symbol}
                      </text>
                    )}
                    {showPct && (
                      <text
                        x={cell.x + cell.w / 2}
                        y={cell.y + cell.h / 2 + fontSize * 0.8}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--text-secondary)"
                        fontSize={Math.max(7, fontSize - 4)}
                        fontFamily="monospace"
                        style={{ pointerEvents: "none" }}
                      >
                        {fmtPct(cell.price_change_percentage_24h)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
