import React, { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';

function aggregateToOHLC(data: any[], targetBuckets = 60) {
  if (!data || data.length === 0) return [];

  const sorted = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const startTime = new Date(sorted[0].time).getTime();
  const endTime = new Date(sorted[sorted.length - 1].time).getTime();
  
  if (startTime === endTime) return [];

  const actualBuckets = Math.min(targetBuckets, Math.max(12, Math.floor(sorted.length / 2)));
  const interval = (endTime - startTime) / actualBuckets;
  
  const buckets = Array.from({ length: actualBuckets }, (_, i) => ({
    time: startTime + i * interval,
    prices: [] as number[],
  }));

  sorted.forEach(point => {
    const t = new Date(point.time).getTime();
    let idx = Math.floor((t - startTime) / interval);
    if (idx >= actualBuckets) idx = actualBuckets - 1;
    buckets[idx].prices.push(point.price);
  });

  let lastValidClose = sorted[0].price;
  let lastTime = 0;

  return buckets.map(b => {
    let t = Math.floor(b.time / 1000);
    // LightweightCharts requires strictly ascending, unique times
    if (t <= lastTime) {
      t = lastTime + 1;
    }
    lastTime = t;

    if (b.prices.length === 0) {
      return {
        time: t as any,
        open: lastValidClose,
        high: lastValidClose,
        low: lastValidClose,
        close: lastValidClose,
      };
    }
    const open = b.prices[0];
    const close = b.prices[b.prices.length - 1];
    const high = Math.max(...b.prices);
    const low = Math.min(...b.prices);
    
    lastValidClose = close;
    
    return {
      time: t as any,
      open,
      high,
      low,
      close,
    };
  });
}

export default function LightweightCandleChart({ data }: { data: any[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const ohlcData = useMemo(() => aggregateToOHLC(data, 100), [data]);

    useEffect(() => {
    if (!chartContainerRef.current || ohlcData.length === 0) return;

    let chart: any;
    
    // Fallback neutral colors for both light and dark modes
    const textColor = '#94a3b8';
    const gridColor = 'rgba(148, 163, 184, 0.1)';

    try {
      chartContainerRef.current.innerHTML = '';

      // Initialize with default or 100% dimensions
      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: textColor,
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: gridColor,
        },
        timeScale: {
          borderColor: gridColor,
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth || 800,
        height: chartContainerRef.current.clientHeight || 340,
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#2ecc71',
        downColor: '#e74c3c',
        borderVisible: false,
        wickUpColor: '#2ecc71',
        wickDownColor: '#e74c3c',
      });

      candlestickSeries.setData(ohlcData);
      chart.timeScale().fitContent();

    } catch (err) {
      console.error("LightweightCharts initialization failed:", err);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (chart && entries.length > 0) {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          chart.applyOptions({ width, height });
        }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chart) {
        chart.remove();
      }
    };
  }, [ohlcData]);

  if (!ohlcData || ohlcData.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
        Not enough data to display candles.
      </div>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
