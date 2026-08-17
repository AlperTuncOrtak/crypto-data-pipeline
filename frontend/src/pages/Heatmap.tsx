// @ts-nocheck
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMarket } from "../hooks/useMarket";
import { LayoutGrid, RefreshCw } from "lucide-react";

// ─── Renk sistemi ────────────────────────────────────────────
// Değişim yüzdesine göre 7 kademeli renk skalası (Soft Matte Web3)
function changeColor(pct) {
  const p = Number(pct) || 0;
  if (p >= 10) return { bg: "rgba(16, 185, 129, 0.4)", text: "#ffffff", border: "rgba(16, 185, 129, 0.6)" };
  if (p >= 5) return { bg: "rgba(16, 185, 129, 0.3)", text: "#ffffff", border: "rgba(16, 185, 129, 0.5)" };
  if (p >= 2) return { bg: "rgba(16, 185, 129, 0.2)", text: "#ffffff", border: "rgba(16, 185, 129, 0.4)" };
  if (p >= 0) return { bg: "rgba(16, 185, 129, 0.1)", text: "#f4f4f5", border: "rgba(16, 185, 129, 0.2)" };
  if (p >= -2) return { bg: "rgba(239, 68, 68, 0.1)", text: "#f4f4f5", border: "rgba(239, 68, 68, 0.2)" };
  if (p >= -5) return { bg: "rgba(239, 68, 68, 0.2)", text: "#ffffff", border: "rgba(239, 68, 68, 0.4)" };
  if (p >= -10) return { bg: "rgba(239, 68, 68, 0.3)", text: "#ffffff", border: "rgba(239, 68, 68, 0.5)" };
  return { bg: "rgba(239, 68, 68, 0.4)", text: "#ffffff", border: "rgba(239, 68, 68, 0.6)" };
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
        position: "fixed", left, top, zIndex: 9999, pointerEvents: "none", width: TW,
        borderColor: `${colors.border}80`,
        boxShadow: `0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px ${colors.border}44`,
      }}
      className="bg-[var(--bg-elevated)]/95 backdrop-blur-2xl border rounded-2xl p-4"
    >
      {/* Header: logo + isim */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border-base)]">
        {coin.image_url ? (
          <img src={coin.image_url} alt={coin.symbol} className="w-7 h-7 rounded-full shrink-0" />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border"
            style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
          >
            {coin.symbol?.[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-[var(--text-main)] leading-tight truncate">{coin.name}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{coin.symbol?.toUpperCase()}</div>
        </div>
        {/* 24h badge */}
        <div
          className="shrink-0 px-2 py-0.5 rounded-2xl text-[11px] font-bold border"
          style={{
            background: isUp ? "rgba(20,241,149,0.15)" : "rgba(239,68,68,0.15)",
            borderColor: isUp ? "rgba(20,241,149,0.3)" : "rgba(239,68,68,0.3)",
            color: isUp ? "#14F195" : "#ef4444",
          }}
        >
          {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
        </div>
      </div>

      {/* Veri satırları */}
      <div className="flex flex-col gap-2">
        {[
          { label: t("heatmap.price"), value: fmt(coin.current_price) },
          { label: t("heatmap.market_cap"), value: fmtCap(coin.market_cap) },
          { label: t("heatmap.volume_24h"), value: fmtCap(coin.total_volume) },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
            <span className="text-[12px] text-gray-200 font-mono font-medium">{value}</span>
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
    { label: "≥+10%", color: "#0d4d29", text: "#14F195" },
    { label: "+5~10%", color: "#0a3d21", text: "#10c97c" },
    { label: "+2~5%", color: "#08331b", text: "#0d9e61" },
    { label: "0~+2%", color: "#052212", text: "#096940" },
    { label: "0~-2%", color: "#330808", text: "#7a1313" },
    { label: "-2~-5%", color: "#4a0b0b", text: "#a31818" },
    { label: "-5~-10%", color: "#610e0e", text: "#d41c1c" },
    { label: "≤-10%", color: "#7a1111", text: "#f01f1f" },
  ];

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] pt-24 pb-32 px-6 lg:px-12 overflow-x-hidden font-sans">
      {/* BACKGROUND GLOWS */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40">
        <div className="w-[800px] h-[300px] bg-[var(--accent)] blur-[150px] rounded-[100%] opacity-20 absolute -top-[100px] left-[10%]"></div>
        <div className="w-[600px] h-[250px] bg-[var(--accent)] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div>
      </div>

      <div className="max-w-[1100px] mx-auto relative z-20">
      {/* HEADER */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <LayoutGrid size={28} className="text-[var(--accent)]" />
            {t("heatmap.title")}
          </h1>
          <p className="text-sm mt-1 text-[var(--text-muted)] font-medium">
            {t("heatmap.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Coin sayısı seçici */}
          <div className="flex gap-1 bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] rounded-3xl p-1 shadow-lg">
            {LIMITS.map((l) => (
              <button
                key={l}
                onClick={() => setLimit(l)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${limit === l ? "bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-soft)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)]"}`}
              >
                {t("heatmap.top", { count: l })}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => market.refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] rounded-3xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-base)] transition-all shadow-lg"
          >
            <RefreshCw
              size={14}
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
      <div className="flex gap-3 mb-4 flex-wrap bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] rounded-3xl p-3 shadow-lg max-w-fit">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-[3px] border" style={{ background: l.color, borderColor: `${l.text}55` }} />
            <span className="text-[11px] font-medium text-[var(--text-muted)]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* TREEMAP */}
      <div className="relative w-full rounded-[32px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden p-1" style={{ paddingBottom: `${(CONTAINER_H / CONTAINER_W) * 100}%` }}>
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
    </div>
  );
}



