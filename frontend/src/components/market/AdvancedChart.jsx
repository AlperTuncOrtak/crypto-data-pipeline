import { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";

export default function AdvancedChart({ symbol, interval = "1h" }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: "solid", color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: {
        mode: 1, // Normal mode
        vertLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#2ecc71",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#2ecc71",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      autoSize: true,
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#2ecc71",
      downColor: "#e74c3c",
      borderVisible: false,
      wickUpColor: "#2ecc71",
      wickDownColor: "#e74c3c",
    });

    seriesRef.current = candlestickSeries;

    // Fetch Data from Binance Public API
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assume default USDT pairing. If symbol is already something like BTCUSDT, we use it directly.
        // But our symbols are usually "btc", "eth" from CoinGecko. Let's append USDT.
        let fetchSymbol = symbol.toUpperCase();
        if (!fetchSymbol.endsWith("USDT")) fetchSymbol += "USDT";
        
        // Map intervals
        const intervalMap = {
          "1h": "1h",
          "24h": "1d",
          "7d": "1d",
          "30d": "1w",
          "all": "1M"
        };
        const binanceInterval = intervalMap[interval] || "1h";

        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${fetchSymbol}&interval=${binanceInterval}&limit=1000`);
        if (!res.ok) throw new Error("Failed to fetch klines from Binance");
        
        const data = await res.json();
        const formattedData = data.map(d => ({
          time: d[0] / 1000, // Unix timestamp in seconds
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));

        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent();
      } catch (err) {
        console.error("AdvancedChart Error:", err);
        setError("Pro Chart data unavailable for this pair.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [symbol, interval]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", zIndex: 10 }}>
          Loading Pro Chart...
        </div>
      )}
      {error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--negative)", zIndex: 10 }}>
          {error}
        </div>
      )}
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
