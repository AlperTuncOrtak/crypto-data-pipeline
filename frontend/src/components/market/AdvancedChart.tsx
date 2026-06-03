import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

// Maps our range keys to Binance kline intervals
const INTERVAL_MAP = {
  "1h":  { binance: "1m",  limit: 60 },
  "24h": { binance: "15m", limit: 96 },
  "7d":  { binance: "4h",  limit: 42 },
  "30d": { binance: "1d",  limit: 30 },
  "all": { binance: "1w",  limit: 200 },
};

export default function AdvancedChart({ symbol, interval = "24h" }) {
  const containerRef = useRef(null);
  const chartRef    = useRef(null);
  const seriesRef   = useRef(null);
  const [state, setState] = useState({ loading: true, error: null });

  // ── Create chart once ──────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(255,255,255,0.45)",
        fontFamily: "'Inter', 'Roboto', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(245,166,35,0.4)",
          width: 1,
          style: 1,
          labelBackgroundColor: "#00F0FF",
        },
        horzLine: {
          color: "rgba(245,166,35,0.4)",
          width: 1,
          style: 1,
          labelBackgroundColor: "#00F0FF",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        textColor: "rgba(255,255,255,0.4)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 3,
      },
      handleScroll: true,
      handleScale: true,
      autoSize: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:       "#2ecc71",
      downColor:     "#e74c3c",
      borderVisible: false,
      wickUpColor:   "#2ecc71",
      wickDownColor: "#e74c3c",
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, []);

  // ── Fetch data when symbol / interval changes ──────────────
  useEffect(() => {
    if (!seriesRef.current) return;

    const { binance, limit } = INTERVAL_MAP[interval] ?? INTERVAL_MAP["24h"];
    let cancelled = false;

    setState({ loading: true, error: null });

    const fetchData = async () => {
      try {
        let sym = symbol.toUpperCase();
        if (!sym.endsWith("USDT")) sym += "USDT";

        const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${binance}&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Binance API ${res.status}`);

        const raw = await res.json();
        if (!Array.isArray(raw) || raw.length === 0)
          throw new Error("Empty data");

        const candles = raw.map((d) => ({
          time:  Math.floor(d[0] / 1000),
          open:  parseFloat(d[1]),
          high:  parseFloat(d[2]),
          low:   parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));

        if (!cancelled && seriesRef.current) {
          seriesRef.current.setData(candles);
          chartRef.current?.timeScale().fitContent();
          setState({ loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("AdvancedChart:", err);
          setState({ loading: false, error: "Pro Chart data unavailable for this pair." });
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [symbol, interval]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Overlay states */}
      {state.loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.35)", fontSize: 13, zIndex: 10,
          pointerEvents: "none",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading Pro Chart...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {state.error && !state.loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8, zIndex: 10, pointerEvents: "none",
        }}>
          <span style={{ fontSize: 28 }}>📊</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{state.error}</span>
        </div>
      )}
      {/* Chart DOM node — must always be mounted */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
