import React, { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Formatters ───────────────────────────────────────────────
function fmtPrice(n: any) {
  const v = Number(n);
  if (isNaN(v) || n === null || n === undefined) return "—";
  if (v >= 1000)
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  if (v >= 0.000001) return `$${v.toFixed(8)}`;
  return `<$0.000001`;
}

function fmtChartTime(iso: string, range: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (range === "1h" || range === "24h")
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function aggregateToOHLC(data: any[], targetBuckets = 60) {
  if (!data || data.length === 0) return [];

  const sorted = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const startTime = new Date(sorted[0].time).getTime();
  const endTime = new Date(sorted[sorted.length - 1].time).getTime();
  
  if (startTime === endTime) return [];

  // Veri azsa mum sayisini dusur ki her mum bos olmasin
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

  return buckets.map(b => {
    if (b.prices.length === 0) {
      // Bosluklari onceki kapanis fiyatiyla doldur (yatay cizgi olur)
      return {
        time: b.time,
        open: lastValidClose,
        high: lastValidClose,
        low: lastValidClose,
        close: lastValidClose,
        range: [lastValidClose, lastValidClose]
      };
    }
    const open = b.prices[0];
    const close = b.prices[b.prices.length - 1];
    const high = Math.max(...b.prices);
    const low = Math.min(...b.prices);
    
    lastValidClose = close;
    
    return {
      time: b.time,
      open,
      high,
      low,
      close,
      // For charting, we need a bar value array [low, high] to map to Y axis correctly
      range: [low, high]
    };
  });
}

const CandlestickShape = (props: any) => {
  const { x, y, width, height, open, close, high, low } = props;
  const isUp = close >= open;
  // Cyan temamiza uygun yesil ve kirmizi tokenlarini kullaniyoruz
  const color = isUp ? "var(--positive)" : "var(--negative)";

  // Recharts treats 'range' = [low, high]. 
  // Since high is larger, it maps to the top of the chart (y), and low maps to the bottom (y + height).
  // Y coordinate increases downwards.
  
  const rangeDiff = high - low;
  const getY = (price: number) => {
    if (rangeDiff === 0) return y + height / 2;
    return y + height * ((high - price) / rangeDiff);
  };

  const yOpen = getY(open);
  const yClose = getY(close);
  const yHigh = y; // top
  const yLow = y + height; // bottom
  
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1); // at least 1px height
  const centerX = x + width / 2;

  return (
    <g>
      {/* Wick */}
      <line x1={centerX} y1={yHigh} x2={centerX} y2={yLow} stroke={color} strokeWidth={1.5} />
      {/* Body */}
      <rect 
        x={x} 
        y={bodyTop} 
        width={width} 
        height={bodyHeight} 
        fill={isUp ? color : "transparent"} 
        stroke={color} 
        strokeWidth={1.5} 
        rx={1}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const isUp = data.close >= data.open;
  const color = isUp ? "var(--positive)" : "var(--negative)";

  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "12px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, fontWeight: 600, letterSpacing: "0.05em" }}>
        {new Date(data.time).toLocaleString()}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 12 }}>
        <div style={{ color: "var(--text-muted)" }}>Open</div>
        <div style={{ fontFamily: "monospace", fontWeight: 600, textAlign: "right", color: "var(--text-primary)" }}>{fmtPrice(data.open)}</div>
        
        <div style={{ color: "var(--text-muted)" }}>High</div>
        <div style={{ fontFamily: "monospace", fontWeight: 600, textAlign: "right", color: "var(--text-primary)" }}>{fmtPrice(data.high)}</div>
        
        <div style={{ color: "var(--text-muted)" }}>Low</div>
        <div style={{ fontFamily: "monospace", fontWeight: 600, textAlign: "right", color: "var(--text-primary)" }}>{fmtPrice(data.low)}</div>
        
        <div style={{ color: "var(--text-muted)" }}>Close</div>
        <div style={{ fontFamily: "monospace", fontWeight: 700, color, textAlign: "right" }}>{fmtPrice(data.close)}</div>
      </div>
    </div>
  );
};

export default function CustomCandlestickChart({ data, range }: { data: any[], range: string }) {
  const ohlcData = useMemo(() => aggregateToOHLC(data, 75), [data]);

  if (!ohlcData || ohlcData.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
        Not enough data to display candles.
      </div>
    );
  }

  // Y ekseni domain bulma
  const minPrice = Math.min(...ohlcData.map(d => d.low));
  const maxPrice = Math.max(...ohlcData.map(d => d.high));
  const padding = (maxPrice - minPrice) * 0.05 || minPrice * 0.005;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={ohlcData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis 
          dataKey="time" 
          tickFormatter={(t) => fmtChartTime(t, range)} 
          stroke="var(--border)" 
          tick={{ fill: "var(--text-muted)", fontSize: 11 }} 
          minTickGap={40}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis 
          domain={[minPrice - padding, maxPrice + padding]}
          tickFormatter={(v) => {
            if (v >= 1000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
            if (v >= 1) return `$${v.toFixed(2)}`;
            if (v >= 0.01) return `$${v.toFixed(4)}`;
            return `$${v.toFixed(6)}`;
          }}
          stroke="var(--border)"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          width={80}
          axisLine={false}
          tickLine={false}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-surface)", opacity: 0.5 }} />
        <Bar 
          dataKey="range" 
          shape={(props: any) => <CandlestickShape {...props} {...props.payload} />}
          isAnimationActive={true}
          animationDuration={800}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
