import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMarket } from "../hooks/useMarket";
import { LayoutGrid, RefreshCw } from "lucide-react";

// ─── Renk sistemi ────────────────────────────────────────────
// Değişim yüzdesine göre 7 kademeli renk skalası
function changeColor(pct) {
  const p = Number(pct) || 0;
  if (p >= 10) return { bg: "#0d6b35", text: "#6efaaa", border: "#1a9e52" };
  if (p >= 5) return { bg: "#0f7a3a", text: "#7dfdb5", border: "#1db356" };
  if (p >= 2) return { bg: "#155e30", text: "#86f5b0", border: "#20a050" };
  if (p >= 0) return { bg: "#163d25", text: "#5ddc8a", border: "#1e7a44" };
  if (p >= -2) return { bg: "#4a1515", text: "#f47878", border: "#7a2222" };
  if (p >= -5) return { bg: "#5c1010", text: "#f96060", border: "#921a1a" };
  if (p >= -10) return { bg: "#6b0d0d", text: "#ff5252", border: "#a01c1c" };
  return { bg: "#7a0a0a", text: "#ff3838", border: "#b01515" };
}

// ─── Fiyat formatlama ─────────────────────────────────────────
function fmt(n) {
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (v >= 1000)
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  return `<$0.0001`;
}

function fmtCap(n) {
  const v = Number(n);
  if (isNaN(v) || v === 0) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toFixed(0)}`;
}

function fmtPct(n) {
  const v = Number(n);
  if (isNaN(v)) return "—";
  return `${v >= 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(2)}%`;
}

// ─── Treemap layout: squarified algorithm ────────────────────
function squarify(items, x, y, w, h) {
  if (!items.length) return [];
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0 || w <= 0 || h <= 0) return [];

  const result = [];
  let remaining = [...items];
  let rx = x,
    ry = y,
    rw = w,
    rh = h;

  while (remaining.length) {
    const isWide = rw >= rh;
    const side = isWide ? rh : rw;
    const remSum = remaining.reduce((s, i) => s + i.value, 0);

    // worst-ratio greedy: eklenecek row/col grubunu bul
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

    // Bu satırı/sütunu yerleştir
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

    // Kalan alanı güncelle
    if (isWide) {
      rx += rowLen;
      rw -= rowLen;
    } else {
      ry += rowLen;
      rh -= rowLen;
    }

    remaining = remaining.slice(row.length);
  }

  return result;
}

// ─── Tooltip ─────────────────────────────────────────────────
function Tooltip({ coin, pos }) {
  const { t } = useTranslation();
  if (!coin || !pos) return null;
  const colors = changeColor(coin.price_change_percentage_24h);
  const pct = Number(coin.price_change_percentage_24h) || 0;
  const isUp = pct >= 0;

  // Ekran kenarlarına taşmayı önle
  const TW = 230,
    TH = 170;
  const left =
    pos.x + 16 + TW > window.innerWidth ? pos.x - TW - 8 : pos.x + 16;
  const top =
    pos.y + 16 + TH > window.innerHeight ? pos.y - TH - 8 : pos.y + 16;

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 9999,
        background: "rgba(25, 25, 28, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${colors.border}`,
        borderRadius: "1.2rem",
        padding: "16px",
        pointerEvents: "none",
        width: TW,
        boxShadow: `0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px ${colors.border}44`,
      }}
    >
      {/* Header: logo + isim */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginBottom: 10,
          borderBottom: "1px solid #2a2a2a",
          paddingBottom: 9,
        }}
      >
        {coin.image_url ? (
          <img
            src={coin.image_url}
            alt={coin.symbol}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: colors.text,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {coin.symbol?.[0]}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#f0f0f0",
              lineHeight: 1.1,
            }}
          >
            {coin.name}
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>
            {coin.symbol}
          </div>
        </div>
        {/* 24h badge */}
        <div
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            background: isUp ? "rgba(46,204,113,0.15)" : "rgba(231,76,60,0.15)",
            border: `1px solid ${isUp ? "#2ecc7144" : "#e74c3c44"}`,
            borderRadius: 6,
            padding: "3px 7px",
            fontSize: 12,
            fontWeight: 700,
            color: isUp ? "#2ecc71" : "#e74c3c",
          }}
        >
          {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
        </div>
      </div>

      {/* Veri satırları */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[
          { label: t("heatmap.price"), value: fmt(coin.current_price), mono: true },
          { label: t("heatmap.market_cap"), value: fmtCap(coin.market_cap), mono: true },
          {
            label: t("heatmap.volume_24h"),
            value: fmtCap(coin.total_volume),
            mono: true,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, color: "#666" }}>{label}</span>
            <span
              style={{
                fontSize: 12,
                color: "#d0d0d0",
                fontFamily: "monospace",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tek hücre ───────────────────────────────────────────────
function HeatCell({ cell, onHover, onClick }) {
  const colors = changeColor(cell.price_change_percentage_24h);
  const w = cell.w,
    h = cell.h;
  const showSymbol = w > 45 && h > 28;
  const showPct = w > 55 && h > 44;
  const showPrice = w > 70 && h > 64;
  const fontSize = Math.max(9, Math.min(15, w / 6));

  return (
    <div
      onMouseEnter={(e) => onHover(cell, { x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => onHover(cell, { x: e.clientX, y: e.clientY })}
      onMouseLeave={() => onHover(null, null)}
      onClick={() => cell.slug && onClick(cell.slug)}
      style={{
        position: "absolute",
        left: cell.x,
        top: cell.y,
        width: Math.max(0, w - 2),
        height: Math.max(0, h - 2),
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 4,
        cursor: cell.slug ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "filter 0.15s",
        userSelect: "none",
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.filter = "brightness(1.3)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.filter = "brightness(1.15)";
      }}
    >
      {cell.image_url && w > 60 && h > 60 && (
        <img
          src={cell.image_url}
          alt={cell.symbol}
          style={{
            width: Math.min(24, w * 0.35),
            height: Math.min(24, w * 0.35),
            borderRadius: "50%",
            marginBottom: 3,
            opacity: 0.85,
          }}
        />
      )}
      {showSymbol && (
        <span
          style={{
            fontSize,
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1.1,
            textAlign: "center",
            padding: "0 4px",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cell.symbol}
        </span>
      )}
      {showPct && (
        <span
          style={{
            fontSize: Math.max(8, fontSize - 2),
            color: colors.text,
            opacity: 0.9,
            lineHeight: 1.2,
          }}
        >
          {fmtPct(cell.price_change_percentage_24h)}
        </span>
      )}
      {showPrice && (
        <span
          style={{
            fontSize: Math.max(7, fontSize - 3),
            color: colors.text,
            opacity: 0.65,
            fontFamily: "monospace",
            lineHeight: 1.2,
          }}
        >
          {fmt(cell.current_price)}
        </span>
      )}
    </div>
  );
}

// ─── Ana bileşen ─────────────────────────────────────────────
const LIMITS = [50, 100, 200];

export default function Heatmap() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const market = useMarket(200);
  const [limit, setLimit] = useState(100);
  const [tooltip, setTooltip] = useState({ coin: null, pos: null });
  const [hoveredCell, setHoveredCell] = useState(null);

  // Treemap verisi
  const coins = useMemo(() => {
    if (!market.data) return [];
    return market.data
      .filter((c) => Number(c.market_cap) > 0 && Number(c.current_price) > 0)
      .slice(0, limit);
  }, [market.data, limit]);

  // Container boyutu — sabit oran
  const CONTAINER_W = 1100;
  const CONTAINER_H = 620;

  const cells = useMemo(() => {
    const items = coins.map((c) => ({
      ...c,
      value: Number(c.market_cap) || 1,
    }));
    return squarify(items, 0, 0, CONTAINER_W, CONTAINER_H);
  }, [coins]);

  function handleHover(coin, pos) {
    setTooltip({ coin, pos });
    setHoveredCell(coin?.symbol || null);
  }

  // Legend bantları
  const legend = [
    { label: "≥+10%", color: "#0d6b35", text: "#6efaaa" },
    { label: "+5~10%", color: "#0f7a3a", text: "#7dfdb5" },
    { label: "+2~5%", color: "#155e30", text: "#86f5b0" },
    { label: "0~+2%", color: "#163d25", text: "#5ddc8a" },
    { label: "0~-2%", color: "#4a1515", text: "#f47878" },
    { label: "-2~-5%", color: "#5c1010", text: "#f96060" },
    { label: "-5~-10%", color: "#6b0d0d", text: "#ff5252" },
    { label: "≤-10%", color: "#7a0a0a", text: "#ff3838" },
  ];

  return (
    <div style={{ color: "var(--text-primary)" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.5px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <LayoutGrid size={24} style={{ color: "var(--accent)" }} />
            {t("heatmap.title")}
          </h1>
          <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>
            {t("heatmap.subtitle")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Coin sayısı seçici */}
          <div style={{ display: "flex", gap: 4 }}>
            {LIMITS.map((l) => (
              <button
                key={l}
                onClick={() => setLimit(l)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1px solid ${limit === l ? "var(--accent)" : "rgba(255,255,255,0.05)"}`,
                  background: limit === l ? "var(--accent)" : "rgba(255,255,255,0.02)",
                  color: limit === l ? "#111" : "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: limit === l ? "0 0 15px var(--accent-soft)" : "none",
                }}
              >
                {t("heatmap.top", { count: l })}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => market.refetch()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-muted)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={12}
              style={{
                animation: market.isFetching
                  ? "spin 1s linear infinite"
                  : "none",
              }}
            />
            {t("heatmap.refresh")}
          </button>
        </div>
      </div>

      {/* LEGEND */}
      <div
        style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}
      >
        {legend.map((l) => (
          <div
            key={l.label}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: l.color,
                border: `1px solid ${l.text}33`,
              }}
            />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>

      {/* TREEMAP */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: `${(CONTAINER_H / CONTAINER_W) * 100}%`,
          backgroundColor: "rgba(25, 25, 28, 0.5)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
          }}
        >
          {market.isLoading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: 14,
              }}
            >
              {t("heatmap.loading")}
            </div>
          )}
          {!market.isLoading && coins.length === 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: 14,
              }}
            >
              {t("heatmap.no_data")}
            </div>
          )}

          {/* SVG viewport trick — koordinatları % ile scale et */}
          <svg
            viewBox={`0 0 ${CONTAINER_W} ${CONTAINER_H}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {cells.map((cell) => {
              const colors = changeColor(cell.price_change_percentage_24h);
              const w = cell.w,
                h = cell.h;
              const cx = cell.x + w / 2;
              const cy = cell.y + h / 2;
              const fontSize = Math.max(
                7,
                Math.min(15, Math.min(w / 5, h / 3.5)),
              );
              const showSymbol = w > 20 && h > 14;
              const showPct = w > 28 && h > 28;
              const showPrice = w > 42 && h > 46;
              const isHovered = hoveredCell === cell.symbol;

              return (
                <g
                  key={cell.symbol}
                  onClick={() => cell.slug && navigate(`/coin/${cell.slug}`)}
                  onMouseEnter={(e) => {
                    setHoveredCell(cell.symbol);
                    setTooltip({
                      coin: cell,
                      pos: { x: e.clientX, y: e.clientY },
                    });
                  }}
                  onMouseMove={(e) =>
                    setTooltip((t) =>
                      t.coin
                        ? { coin: cell, pos: { x: e.clientX, y: e.clientY } }
                        : t,
                    )
                  }
                  onMouseLeave={() => {
                    setHoveredCell(null);
                    setTooltip({ coin: null, pos: null });
                  }}
                  style={{ cursor: cell.slug ? "pointer" : "default" }}
                >
                  <rect
                    x={cell.x + 1}
                    y={cell.y + 1}
                    width={Math.max(0, w - 2)}
                    height={Math.max(0, h - 2)}
                    rx={3}
                    fill={isHovered ? colors.border : colors.bg}
                    stroke={colors.border}
                    strokeWidth={isHovered ? 2 : 0.5}
                  />
                  {showSymbol && (
                    <text
                      x={cx}
                      y={
                        showPct
                          ? cy - (showPrice ? fontSize * 1.1 : fontSize * 0.6)
                          : cy
                      }
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colors.text}
                      fontSize={fontSize}
                      fontWeight="700"
                      fontFamily="Inter, sans-serif"
                      style={{ pointerEvents: "none" }}
                    >
                      {cell.symbol}
                    </text>
                  )}
                  {showPct && (
                    <text
                      x={cx}
                      y={
                        cy +
                        (showSymbol ? fontSize * 0.9 : 0) +
                        (showPrice ? -fontSize * 0.5 : 0)
                      }
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colors.text}
                      fontSize={Math.max(7, fontSize - 3)}
                      fontFamily="Inter, sans-serif"
                      opacity={0.9}
                      style={{ pointerEvents: "none" }}
                    >
                      {fmtPct(cell.price_change_percentage_24h)}
                    </text>
                  )}
                  {showPrice && (
                    <text
                      x={cx}
                      y={cy + fontSize * 1.7}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colors.text}
                      fontSize={Math.max(6, fontSize - 4)}
                      fontFamily="monospace"
                      opacity={0.6}
                      style={{ pointerEvents: "none" }}
                    >
                      {fmt(cell.current_price)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* HOVER TOOLTIP */}
      {tooltip.coin && <Tooltip coin={tooltip.coin} pos={tooltip.pos} />}

      {/* ÖZET BANT */}
      {market.data && (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          {(() => {
            const withChange = coins.filter(
              (c) => c.price_change_percentage_24h != null,
            );
            const gainers = withChange.filter(
              (c) => Number(c.price_change_percentage_24h) > 0,
            ).length;
            const losers = withChange.filter(
              (c) => Number(c.price_change_percentage_24h) < 0,
            ).length;
            const neutral = withChange.length - gainers - losers;
            const avgChange = withChange.length
              ? (
                  withChange.reduce(
                    (s, c) => s + Number(c.price_change_percentage_24h),
                    0,
                  ) / withChange.length
                ).toFixed(2)
              : 0;
            return (
              <>
                <span>{t("heatmap.shown", { count: coins.length })}</span>
                <span style={{ color: "#2ecc71" }}>▲ {gainers} {t("heatmap.up")}</span>
                <span style={{ color: "#e74c3c" }}>▼ {losers} {t("heatmap.down")}</span>
                {neutral > 0 && <span>— {neutral} {t("heatmap.unchanged")}</span>}
                <span>
                  {t("heatmap.avg_change")}{" "}
                  <strong
                    style={{
                      color: Number(avgChange) >= 0 ? "#2ecc71" : "#e74c3c",
                    }}
                  >
                    {avgChange >= 0 ? "+" : ""}
                    {avgChange}%
                  </strong>
                </span>
              </>
            );
          })()}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
