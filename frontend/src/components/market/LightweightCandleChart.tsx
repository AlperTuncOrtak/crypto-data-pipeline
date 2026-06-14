import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function aggregateToOHLC(data: any[], targetBuckets = 60) {
  if (!data || data.length < 2) return [];

  const parsed = data
    .map(d => ({
      time: new Date(d.time).getTime(),
      price: Number(d.price)
    }))
    .filter(d => !isNaN(d.time) && !isNaN(d.price));

  if (parsed.length < 2) return [];

  const sorted = parsed.sort((a, b) => a.time - b.time);
  const startTime = sorted[0].time;
  const endTime = sorted[sorted.length - 1].time;
  
  if (startTime === endTime) return [];

  const actualBuckets = Math.min(targetBuckets, Math.max(12, Math.floor(sorted.length / 2)));
  const interval = (endTime - startTime) / actualBuckets;
  
  const buckets = Array.from({ length: actualBuckets }, (_, i) => ({
    time: startTime + i * interval,
    prices: [] as number[],
  }));

  sorted.forEach(point => {
    let idx = Math.floor((point.time - startTime) / interval);
    if (idx >= actualBuckets) idx = actualBuckets - 1;
    if (idx < 0) idx = 0;
    buckets[idx].prices.push(point.price);
  });

  let lastValidClose = sorted[0].price;

  const result = [];
  for (const b of buckets) {
    if (b.prices.length === 0) {
      result.push({
        time: b.time,
        open: lastValidClose,
        high: lastValidClose,
        low: lastValidClose,
        close: lastValidClose,
      });
    } else {
      const open = b.prices[0];
      const close = b.prices[b.prices.length - 1];
      const high = Math.max(...b.prices);
      const low = Math.min(...b.prices);
      lastValidClose = close;
      
      result.push({
        time: b.time,
        open,
        high,
        low,
        close,
        // For Recharts Bar dataKey (range)
        range: [open, close]
      });
    }
  }
  return result;
}

// Custom Candle Shape for Recharts
const CustomCandle = (props: any) => {
  const { x, width, payload, background } = props;
  
  // yAxis scale provided by Recharts internally via background/yAxis
  // Wait, the easier way is to map the Y coordinates. 
  // Recharts Bar with [open, close] gives us `y` and `height` for the body.
  // But we need the pixel coordinates for `high` and `low`.
  // Actually, props passed to custom shape for Bar includes `y` (top of rect) and `height`.
  // To get high/low pixels, we need the `yAxis` scale, which is often in `props.yAxis` or `props.background`.
  // We can just use the provided rect as the body!
  
  // If Recharts doesn't pass yAxis directly, we can cheat: 
  // We know the value range [open, close], and the pixel range [y, y + height] (or vice versa).
  // We can calculate the pixel-per-value ratio and extrapolate high/low pixels!

  const { open, close, high, low } = payload;
  const isGrowing = close >= open;
  const color = isGrowing ? '#2ecc71' : '#e74c3c';

  const bodyTop = props.y;
  const bodyHeight = Math.max(props.height, 1);
  
  // Calculate ratio: height in pixels / height in value
  const valDiff = Math.abs(open - close);
  
  let pxPerVal = 0;
  if (valDiff > 0) {
    pxPerVal = bodyHeight / valDiff;
  } else {
    // If open == close, we have a flat line. We can't divide by 0.
    // We'll just draw the wick from the bodyTop minus/plus a generic ratio, 
    // but without yAxis scale it's tricky. 
    // Fortunately, most times there is a diff. If not, we just draw a small wick.
    pxPerVal = 10; // arbitrary fallback
  }

  // Calculate wick tops/bottoms
  const highDiff = high - Math.max(open, close);
  const lowDiff = Math.min(open, close) - low;

  const yHigh = bodyTop - (highDiff * pxPerVal);
  const yLow = bodyTop + bodyHeight + (lowDiff * pxPerVal);

  const centerX = x + width / 2;

  return (
    <g stroke={color} fill={color}>
      {/* Wick */}
      <line x1={centerX} y1={yHigh} x2={centerX} y2={yLow} strokeWidth={1.5} />
      {/* Body */}
      <rect x={x} y={bodyTop} width={width} height={bodyHeight} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const fmt = (n: number) => {
      if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      if (n >= 1) return `$${n.toFixed(2)}`;
      return `$${n.toFixed(6)}`;
    };
    
    return (
      <div style={{
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)",
        fontSize: 12
      }}>
        <div style={{ color: "var(--text-muted)", marginBottom: 6 }}>
          {new Date(label).toLocaleString()}
        </div>
        <div><span style={{color: "var(--text-muted)"}}>O:</span> {fmt(data.open)}</div>
        <div><span style={{color: "var(--text-muted)"}}>H:</span> {fmt(data.high)}</div>
        <div><span style={{color: "var(--text-muted)"}}>L:</span> {fmt(data.low)}</div>
        <div><span style={{color: "var(--text-muted)"}}>C:</span> {fmt(data.close)}</div>
      </div>
    );
  }
  return null;
};

export default function LightweightCandleChart({ data, currentPrice }: { data: any[], currentPrice?: number | string }) {
  const baseOhlcData = useMemo(() => aggregateToOHLC(data, 75), [data]);

  const ohlcData = useMemo(() => {
    if (!baseOhlcData || baseOhlcData.length === 0) return [];
    if (!currentPrice) return baseOhlcData;
    
    const price = Number(currentPrice);
    if (isNaN(price)) return baseOhlcData;

    // Clone the array to avoid mutating memoized data
    const cloned = [...baseOhlcData];
    const last = { ...cloned[cloned.length - 1] };
    
    // Inject the real-time tick into the latest candle!
    last.close = price;
    if (price > last.high) last.high = price;
    if (price < last.low) last.low = price;
    last.range = [last.open, last.close];
    
    cloned[cloned.length - 1] = last;
    return cloned;
  }, [baseOhlcData, currentPrice]);

  if (!ohlcData || ohlcData.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
        Not enough data to display candles.
      </div>
    );
  }

  // Dynamic domain logic
  const minLow = Math.min(...ohlcData.map(d => d.low));
  const maxHigh = Math.max(...ohlcData.map(d => d.high));
  const padding = (maxHigh - minLow) * 0.1;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={ohlcData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="time" 
            tickFormatter={(t) => {
              const d = new Date(t);
              return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }}
            stroke="var(--border)"
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            minTickGap={30}
          />
          <YAxis 
            domain={[minLow - padding, maxHigh + padding]}
            tickFormatter={(v) => {
              if (v >= 1000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
              if (v >= 1) return `$${v.toFixed(2)}`;
              return `$${v.toFixed(4)}`;
            }}
            stroke="var(--border)"
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            width={80}
            orientation="right"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border)', opacity: 0.2 }} />
          <Bar dataKey="range" shape={<CustomCandle />} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
