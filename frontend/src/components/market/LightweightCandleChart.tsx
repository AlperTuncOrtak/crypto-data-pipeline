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
    if (t <= lastTime) t = lastTime + 1; // lightweight-charts requires strictly increasing time
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

    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.5)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
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

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
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
